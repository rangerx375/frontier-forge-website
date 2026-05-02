const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const nodemailer = require('nodemailer');

export const config = {
  api: {
    bodyParser: { sizeLimit: '10mb' }
  }
};

const RECIPIENT = 'chuck@holtonnews.com';
const SMTP_USER = 'chuck@holtonnews.com';

const ACTIVITY_LABELS = {
  act_hike: 'Hiking, land navigation, and overnight movement carrying personal gear (Day 6)',
  act_water: 'Water activities at the camp pond (swimming, water rescue training)',
  act_construction: 'Light construction work (hand tools, limited power tools, cadre supervision)',
  act_firearms: 'Firearms safety training (inert weapons, then 9mm pistol range under RSO)',
  act_rappel: 'High-angle rappelling (Appalachian Bible College Outdoors team)',
  act_firstaid: 'First aid training (bleeding control, tourniquet, casualty drag)',
  act_pt: 'Daily physical training (running, calisthenics, ruck marches)',
  act_blades: 'Use of pocket knife, fixed blade, multi-tool, or splitting maul under cadre supervision',
  act_camping: 'Camping in tents on cots, exposure to insects/ticks/weather/natural hazards'
};

const OTC_LABELS = {
  otc_acetaminophen: 'Acetaminophen (Tylenol)',
  otc_ibuprofen: 'Ibuprofen (Advil, Motrin)',
  otc_benadryl: 'Diphenhydramine (Benadryl)',
  otc_loratadine: 'Loratadine (Claritin) / non-drowsy antihistamine',
  otc_pepto: 'Bismuth subsalicylate / loperamide',
  otc_antacid: 'Antacid (Tums, Rolaids)',
  otc_hydrocortisone: 'Hydrocortisone cream 1%',
  otc_neosporin: 'Antibiotic ointment (Neosporin)',
  otc_sunscreen: 'Sunscreen and aloe vera gel',
  otc_eyedrops: 'Saline eye drops / contact rewetting drops',
  otc_lozenges: 'Cough drops / throat lozenges'
};

const COMM_LABELS = {
  comm_phone: 'Phone call to primary parent / guardian',
  comm_text: 'Text message to primary parent / guardian',
  comm_whatsapp: 'Camp WhatsApp group',
  comm_email: 'Email'
};

function safe(value) {
  if (value === undefined || value === null || value === '') return '—';
  return String(value);
}

function checkbox(checked) {
  return checked ? '[X]' : '[ ]';
}

async function buildPDF(data) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  const pageWidth = 612;
  const pageHeight = 792;
  const contentWidth = pageWidth - margin * 2;
  const lineHeight = 14;

  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  function newPage() {
    page = pdf.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  }

  function ensureSpace(linesNeeded) {
    if (y - linesNeeded * lineHeight < margin) newPage();
  }

  function wrapText(text, maxWidth, useFont, size) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let current = '';
    for (const word of words) {
      const test = current ? current + ' ' + word : word;
      const width = useFont.widthOfTextAtSize(test, size);
      if (width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  function drawText(text, options = {}) {
    const size = options.size || 10;
    const useFont = options.bold ? bold : font;
    const indent = options.indent || 0;
    const color = options.color || rgb(0.1, 0.1, 0.1);
    const lines = wrapText(text, contentWidth - indent, useFont, size);
    for (const line of lines) {
      ensureSpace(1);
      page.drawText(line, { x: margin + indent, y: y - size, size, font: useFont, color });
      y -= lineHeight;
    }
  }

  function drawSection(title) {
    ensureSpace(3);
    y -= 6;
    page.drawRectangle({
      x: margin, y: y - 18, width: contentWidth, height: 20,
      color: rgb(0.12, 0.20, 0.30)
    });
    page.drawText(title, {
      x: margin + 8, y: y - 14, size: 11, font: bold, color: rgb(1, 1, 1)
    });
    y -= 26;
  }

  function drawField(label, value, options = {}) {
    ensureSpace(2);
    const indent = options.indent || 0;
    page.drawText(label + ':', {
      x: margin + indent, y: y - 10, size: 9, font: bold, color: rgb(0.3, 0.3, 0.3)
    });
    y -= lineHeight;
    drawText(safe(value), { indent: indent + 12, size: 10 });
  }

  function drawDivider() {
    ensureSpace(1);
    y -= 4;
    page.drawLine({
      start: { x: margin, y },
      end: { x: margin + contentWidth, y },
      thickness: 0.5, color: rgb(0.8, 0.8, 0.8)
    });
    y -= 6;
  }

  // HEADER
  page.drawText('FRONTIER FORGE INSTITUTE', {
    x: margin, y: pageHeight - margin, size: 14, font: bold, color: rgb(0.12, 0.20, 0.30)
  });
  y = pageHeight - margin - 18;
  page.drawText('Medical Release & Liability Waiver — Submitted Form', {
    x: margin, y, size: 11, font, color: rgb(0.4, 0.4, 0.4)
  });
  y -= 20;
  page.drawText(`Submitted: ${data.submitted_at_display || new Date().toLocaleString('en-US')}`, {
    x: margin, y, size: 9, font, color: rgb(0.5, 0.5, 0.5)
  });
  y -= 16;

  // SECTION 1
  drawSection('SECTION 1 — CAMPER & PARENT INFORMATION');
  drawText('Camper', { bold: true, size: 10 });
  drawField('Camper full legal name', data.camper_name);
  drawField('Date of birth', data.camper_dob);
  drawField('Age at start of camp', data.camper_age);
  drawField('Home address', `${safe(data.address_street)}, ${safe(data.address_city)}, ${safe(data.address_state)} ${safe(data.address_zip)}`);
  drawField('Height', data.camper_height);
  drawField('Weight', data.camper_weight);
  drawDivider();

  drawText('Primary Parent / Legal Guardian', { bold: true, size: 10 });
  drawField('Full name', data.parent_name);
  drawField('Relationship to camper', data.parent_relationship);
  drawField('Cell phone', data.parent_cell);
  drawField('Home phone', data.parent_home);
  drawField('Work phone', data.parent_work);
  drawField('Email', data.parent_email);
  drawDivider();

  drawText('Secondary Emergency Contact', { bold: true, size: 10 });
  drawField('Full name', data.emergency_name);
  drawField('Relationship to camper', data.emergency_relationship);
  drawField('Cell phone', data.emergency_cell);
  drawField('Email', data.emergency_email);
  drawDivider();

  drawText('Healthcare Providers & Insurance', { bold: true, size: 10 });
  drawField('Family physician', `${safe(data.physician_name)} — ${safe(data.physician_phone)}`);
  drawField('Dentist', `${safe(data.dentist_name)} — ${safe(data.dentist_phone)}`);
  drawField('Insurance carrier', data.insurance_carrier);
  drawField('Policy / Member number', data.insurance_policy);
  drawField('Group number', data.insurance_group);
  drawField('Preferred hospital', data.preferred_hospital);

  // SECTION 2
  drawSection('SECTION 2 — MEDICAL HISTORY');
  drawText('Allergies', { bold: true, size: 10 });
  if (Array.isArray(data.allergies) && data.allergies.length > 0) {
    for (const a of data.allergies) {
      drawText(`• ${safe(a.allergen)} — Reaction: ${safe(a.reaction)} | Severity: ${safe(a.severity)} | Treatment: ${safe(a.treatment)}`, { indent: 8 });
    }
  } else {
    drawText('NONE reported', { indent: 8 });
  }
  drawDivider();

  drawText('Chronic / Ongoing Conditions', { bold: true, size: 10 });
  if (Array.isArray(data.conditions) && data.conditions.length > 0) {
    for (const c of data.conditions) {
      drawText(`• ${safe(c.condition)} — Diagnosed: ${safe(c.diagnosed)} | Treatment: ${safe(c.treatment)}`, { indent: 8 });
    }
  } else {
    drawText('NONE reported', { indent: 8 });
  }
  drawDivider();

  drawField('Date of last tetanus immunization', data.tetanus_date);
  drawField('Date of last physical examination', data.physical_date);
  drawField('Immunizations up to date', data.immunizations_current);
  drawDivider();

  drawText('Dietary Restrictions / Preferences', { bold: true, size: 10 });
  if (Array.isArray(data.diet) && data.diet.length > 0) {
    for (const d of data.diet) {
      drawText(`• ${safe(d.restriction)} — Reason: ${safe(d.reason)}`, { indent: 8 });
    }
  } else {
    drawText('NONE reported', { indent: 8 });
  }
  drawDivider();

  drawField('Other medical history / notes', data.medical_notes);

  // SECTION 3
  drawSection('SECTION 3 — ACTIVITY ACKNOWLEDGMENT');
  drawText('Parent/guardian consents to camper participation in checked activities:', { size: 9 });
  y -= 4;
  for (const [key, label] of Object.entries(ACTIVITY_LABELS)) {
    drawText(`${checkbox(data[key])} ${label}`, { size: 9, indent: 4 });
  }
  drawDivider();
  drawField('Activity restrictions or concerns', data.activity_notes);

  // SECTION 4
  drawSection('SECTION 4 — AUTHORIZATION TO TREAT');
  drawText(`${checkbox(data.ack_treat)} I authorize FFI staff, the on-site Registered Nurse/medic, and consulting medical personnel to provide such routine first aid, medical, dental, and emergency treatment as necessary. I accept financial responsibility for healthcare costs not covered by insurance.`, { size: 9, indent: 4 });

  // SECTION 5
  drawSection('SECTION 5 — MEDICATION AUTHORIZATION');
  drawText('Medications brought from home:', { bold: true, size: 10 });
  if (Array.isArray(data.medications) && data.medications.length > 0) {
    for (const m of data.medications) {
      drawText(`• ${safe(m.name)} — Dose: ${safe(m.dose)} | Times/day: ${safe(m.times)} | Reason: ${safe(m.reason)}`, { indent: 8 });
    }
  } else {
    drawText('NONE', { indent: 8 });
  }
  drawDivider();

  drawField('Self-administration', data.self_admin === 'self' ? 'Camper authorized to self-administer under medical staff supervision' : data.self_admin === 'staff' ? 'Medical staff will administer all medications (locked storage)' : '—');
  drawDivider();

  drawText('Over-the-counter medications authorized:', { bold: true, size: 10 });
  for (const [key, label] of Object.entries(OTC_LABELS)) {
    drawText(`${checkbox(data[key])} ${label}`, { size: 9, indent: 4 });
  }
  drawDivider();
  drawField('Medications NOT authorized', data.med_restrictions);

  // SECTION 6
  drawSection('SECTION 6 — COMMUNICATIONS & PRIVACY');
  drawText('Routine communication preferences:', { bold: true, size: 10 });
  for (const [key, label] of Object.entries(COMM_LABELS)) {
    drawText(`${checkbox(data[key])} ${label}`, { size: 9, indent: 4 });
  }
  drawDivider();

  drawText('Authorized to discuss medical matters:', { bold: true, size: 10 });
  if (Array.isArray(data.authorized_contacts) && data.authorized_contacts.length > 0) {
    for (const c of data.authorized_contacts) {
      drawText(`• ${safe(c.name)} (${safe(c.relationship)}) — ${safe(c.phone)}`, { indent: 8 });
    }
  } else {
    drawText('NONE', { indent: 8 });
  }

  // SECTION 7
  drawSection('SECTION 7 — RISK ACKNOWLEDGMENT & LIABILITY WAIVER');
  drawText(`${checkbox(data.ack_risk)} I acknowledge inherent risks of the program (physical injury, illness, property damage, and in extreme cases permanent disability or death). I confirm voluntary participation, suitable physical/mental condition, and that I have informed my son of the nature of these activities.`, { size: 9, indent: 4 });
  y -= 4;
  drawText(`${checkbox(data.ack_release)} On behalf of myself, my son, and our heirs, I RELEASE, WAIVE, DISCHARGE, AND COVENANT NOT TO SUE Frontier Forge Institute, its directors, officers, employees, volunteers, cadre, instructors, agents, contractors (including Appalachian Bible College / ABC Outdoors), property owners, lessors (including Alpine Ministries), and all other Released Parties from all liability arising out of or related to any loss, injury, or death sustained while participating in the program. I agree to INDEMNIFY AND HOLD HARMLESS the Released Parties to the maximum extent permitted by West Virginia law.`, { size: 9, indent: 4 });
  y -= 4;
  drawField('Photo / likeness release', data.photo_release === 'opt_out' ? 'PARENT OPTED OUT — do not use camper photos for promotional purposes' : 'Consent granted (default)');

  // SECTION 8 — SIGNATURE
  drawSection('SECTION 8 — SIGNATURES');
  drawField('Camper full legal name (printed)', data.camper_name);
  drawDivider();
  drawText('Parent or Legal Guardian', { bold: true, size: 10 });
  drawField('Typed signature', data.signature_typed);
  drawField('Printed name', data.signature_printed_name);
  drawField('Relationship to camper', data.signature_relationship);
  drawField('Date signed', data.signature_date);
  y -= 6;
  drawText('Witness signature: Will be collected wet-ink at Day 1 registration.', { size: 8, color: rgb(0.5, 0.5, 0.5), indent: 4 });

  // INSURANCE CARDS
  async function appendImagePage(dataUrl, label) {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) return;
    const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) return;
    const mime = match[1];
    const bytes = Buffer.from(match[2], 'base64');
    let image;
    try {
      if (mime === 'image/png') image = await pdf.embedPng(bytes);
      else image = await pdf.embedJpg(bytes);
    } catch (e) {
      return;
    }
    const ipage = pdf.addPage([pageWidth, pageHeight]);
    ipage.drawText('FRONTIER FORGE INSTITUTE — ' + label, {
      x: margin, y: pageHeight - margin, size: 11, font: bold, color: rgb(0.12, 0.20, 0.30)
    });
    const maxW = pageWidth - margin * 2;
    const maxH = pageHeight - margin * 2 - 30;
    const ratio = Math.min(maxW / image.width, maxH / image.height);
    const w = image.width * ratio;
    const h = image.height * ratio;
    ipage.drawImage(image, {
      x: (pageWidth - w) / 2,
      y: (pageHeight - h) / 2 - 10,
      width: w, height: h
    });
  }

  await appendImagePage(data.insurance_card_front, 'Insurance Card (Front)');
  await appendImagePage(data.insurance_card_back, 'Insurance Card (Back)');

  return Buffer.from(await pdf.save());
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const data = req.body || {};

    if (!data.camper_name || !data.parent_name || !data.signature_typed) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const password = process.env.SMTP_PASSWORD;
    if (!password) {
      console.error('SMTP_PASSWORD env var not set');
      return res.status(500).json({ error: 'Email not configured' });
    }

    const pdfBuffer = await buildPDF(data);
    const safeCamper = String(data.camper_name).replace(/[^a-zA-Z0-9 _-]/g, '').replace(/\s+/g, '_').slice(0, 60);
    const dateTag = new Date().toISOString().slice(0, 10);
    const filename = `FFI_Medical_Waiver_${safeCamper}_${dateTag}.pdf`;

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: SMTP_USER, pass: password }
    });

    await transporter.sendMail({
      from: `"FFI Medical Waiver" <${SMTP_USER}>`,
      to: RECIPIENT,
      subject: `FFI Medical Waiver — ${data.camper_name} — ${dateTag}`,
      text: `New medical waiver submitted for ${data.camper_name}.\n\nParent/Guardian: ${data.parent_name}\nParent email: ${data.parent_email || '—'}\nParent cell: ${data.parent_cell || '—'}\n\nFull form attached as PDF.\n\nThis email is the only copy — no data is stored online.`,
      attachments: [{ filename, content: pdfBuffer, contentType: 'application/pdf' }]
    });

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Submission error:', error.message);
    return res.status(500).json({ error: 'Failed to submit waiver' });
  }
}
