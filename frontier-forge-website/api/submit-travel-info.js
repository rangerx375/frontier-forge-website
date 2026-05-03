const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const nodemailer = require('nodemailer');

export const config = {
  api: {
    bodyParser: { sizeLimit: '2mb' }
  }
};

const RECIPIENTS = ['chuck@holtonnews.com', 'Lailaproenza@gmail.com'];
const SMTP_USER = 'chuck@holtonnews.com';

function safe(value) {
  if (value === undefined || value === null || value === '') return '—';
  return String(value);
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
  function drawLeg(prefix, title) {
    drawSection(title);
    const method = data[`${prefix}_method`];
    drawField('Travel method', method === 'flying' ? 'Flying into CRW (camp shuttle pickup)'
      : method === 'driving' ? 'Parents driving the camper to the lodge'
      : method === 'carpool' ? 'Carpooling with another camper family'
      : '—');
    drawDivider();
    if (method === 'flying') {
      drawText('Flight Details', { bold: true, size: 10 });
      drawField('Airline', data[`${prefix}_airline`]);
      drawField('Flight number', data[`${prefix}_flight_number`]);
      drawField('Departing from (airport / city)', data[`${prefix}_origin`]);
      drawField('Arriving at', data[`${prefix}_destination`] || 'CRW (Charleston, WV)');
      drawField('Date', data[`${prefix}_date`]);
      drawField('Time', data[`${prefix}_time`]);
      drawField('Confirmation / record locator', data[`${prefix}_confirmation`]);
      drawField('Unaccompanied minor service', data[`${prefix}_um`]);
    } else if (method === 'driving') {
      drawText('Drive Details', { bold: true, size: 10 });
      drawField('Driver name', data[`${prefix}_driver_name`]);
      drawField('Vehicle (color, make, model)', data[`${prefix}_vehicle`]);
      drawField('Estimated arrival date', data[`${prefix}_drive_date`]);
      drawField('Estimated arrival time', data[`${prefix}_drive_time`]);
    } else if (method === 'carpool') {
      drawText('Carpool Details', { bold: true, size: 10 });
      drawField('Carpooling with (other camper / family)', data[`${prefix}_carpool_with`]);
      drawField('Driver contact name', data[`${prefix}_carpool_driver_name`]);
      drawField('Driver contact phone', data[`${prefix}_carpool_driver_phone`]);
      drawField('Estimated arrival date', data[`${prefix}_carpool_date`]);
      drawField('Estimated arrival time', data[`${prefix}_carpool_time`]);
    }
  }

  // HEADER
  page.drawText('FRONTIER FORGE INSTITUTE', {
    x: margin, y: pageHeight - margin, size: 14, font: bold, color: rgb(0.12, 0.20, 0.30)
  });
  y = pageHeight - margin - 18;
  page.drawText('Camper Travel Information — Submitted Form', {
    x: margin, y, size: 11, font, color: rgb(0.4, 0.4, 0.4)
  });
  y -= 20;
  page.drawText(`Submitted: ${data.submitted_at_display || new Date().toLocaleString('en-US')}`, {
    x: margin, y, size: 9, font, color: rgb(0.5, 0.5, 0.5)
  });
  y -= 16;

  drawSection('SECTION 1 — CAMPER & TRAVEL-DAY CONTACT');
  drawField('Camper full legal name', data.camper_name);
  drawField('Parent / guardian name', data.parent_name);
  drawField('Parent cell (travel-day)', data.parent_cell);
  drawField('Camper cell during travel', data.camper_cell);

  drawLeg('arrival', 'SECTION 2 — ARRIVAL AT CAMP');
  drawLeg('departure', 'SECTION 3 — RETURN FROM CAMP');

  drawSection('SECTION 4 — NOTES');
  drawField('Anything else camp should know about travel', data.travel_notes);

  drawSection('SECTION 5 — ACKNOWLEDGMENT & SIGNATURE');
  drawText('[X] I acknowledge that the camp will provide ground transportation between Yeager Airport (CRW) in Charleston, WV and the camp lodge for flying campers.', { size: 9, indent: 4 });
  drawText('[X] I acknowledge that arranging unaccompanied minor service with the airline (if needed) is my responsibility, not the camp\'s.', { size: 9, indent: 4 });
  drawText('[X] The travel information above is accurate and complete to the best of my knowledge.', { size: 9, indent: 4 });
  drawDivider();
  drawField('Typed signature', data.signature_typed);
  drawField('Printed name', data.signature_printed_name);
  drawField('Relationship to camper', data.signature_relationship);
  drawField('Date signed', data.signature_date);

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
    const filename = `FFI_Travel_Info_${safeCamper}_${dateTag}.pdf`;

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: SMTP_USER, pass: password }
    });

    await transporter.sendMail({
      from: `"FFI Travel Info" <${SMTP_USER}>`,
      to: RECIPIENTS,
      subject: `FFI Travel Info — ${data.camper_name} — ${dateTag}`,
      text: `Travel info submitted for ${data.camper_name}.\n\nParent/Guardian: ${data.parent_name}\nParent cell: ${data.parent_cell || '—'}\nArrival: ${data.arrival_method || '—'}\nReturn: ${data.departure_method || '—'}\n\nFull details attached as PDF.`,
      attachments: [{ filename, content: pdfBuffer, contentType: 'application/pdf' }]
    });

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Travel submission error:', error.message);
    return res.status(500).json({ error: 'Failed to submit travel info' });
  }
}
