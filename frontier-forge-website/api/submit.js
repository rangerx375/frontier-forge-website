const { google } = require('googleapis');

const SHEET_ID = '1qbiAP58SfhXfflutiScmq9OLFiJ6mBeQ5JHBp-GsszQ';

const credentials = {
  type: "service_account",
  project_id: "chuckforge",
  private_key_id: "fabd9c716f63b5b9bc4983def8068d77e14d817d",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDKkvkm3MH/JUz6\nDAXSfQRUZ4pNdxQZvrhb328LwWB3z8VWyngLDVvyvbhFUkNaYrsL9ec7wwU40ocF\n5wvM9oKtTCUJ3Sk1NjTsGpJi3hdxe6xgNqiHSxNG6j50O4/OH+z0FiqhrYLEo8SH\nXVpJPMAzoXZT75s36gje1UctpTrryWjODlaTkZjOuT2w/ueEDzXGJrjtGVzXBbi9\navszwr07SBDqRL+FfB0n19ptBYjw56B3s5LNcQdeDc+nshWVrHvQM4iyiCUSyS5I\na9sD1pNq7zyeGwvEahLONVEnTerKToa0CWk3ZpdXte9DFNcnvvAGTgU7n5xVZxCA\nmz0iXgotAgMBAAECggEAANrspldZkk7Wq6+P+WWBtoGBZKD+EBBtYtCR/XC24Yqa\nVgAg0EXMKj2Bdk7J7gBrXbo6BwHkbGr8cEVGGCVqQ8+wewGDV7AqOlzvr+8pa4Hk\nJmZ/Vk2Lf/R5MwXAA6oVgVTz9R7FuzgdxPHbRw00moMx/AS6Q7Ap6BbqaAJB5MDr\npYHKF/xdOqzeGx0FC2KmYzb33O6U2mQrEy26Au4AUHbvkgCUgrBqPrVMbQamPSz0\nw7I6m3g6thpDJBEWOuBWfssHuFYsD/xkOgBz741E4sfw3cf3PkGUTXxZLwclRkg2\nl+saPSNE6mFREEg3zliGEbcBWpb6rjKZBlLMJfX+gQKBgQD/mcmChDIJxtvEUyzm\nXzm0hRKWqzHJmtu9ulSFNyRZUtO0tjClajVgl1yFuVqRtkSPU74eblNBFMtDY6Ut\nNcsFselJsD3+GqlOrhzQ0SKDdJx7wGhz0xqrC8yBfTomY8myS38Ml1Ug1RHRwplb\nYcsY1MPaxbVYUbw8rQ1kXKQsfQKBgQDK4/sseubDHpmDQQUO9QBHZNYRE9haMzMc\nT3RbeJjrzgGXK+uH9+AW0krIX2VSr/hACSGWlAJ3BR7aTbWnozXv1BaSQU9VtHdF\no4zIzkXa3YAca2yOe/YPLcJBINPzMfE0hJSz/4ViemgtS3rI+hTEd3w5BfQxpzAs\na3fR5uezcQKBgQCDy8e1TfcDRY/ShtTzIQz/QVLZcALnIrvF9Ata+Zj7mhLh7sPc\nt4w4dzPVHENQOTzW7uZsiJTTTSaWZA4q5r79+8QAJCmDGjpNAMiJAB2czQdXZFo3\nxxXMNvRHnMvcOb4p+nXTh0D1AgkDMSWkkiOIdUVcTG/6z4KRguYR5xccfQKBgCEj\nO1L4f9g+lzQo2nqm6XS/s3b2ls+krSRilc6a098vtnLKaZ27jo4rqqsvaY0n0JQk\n6ad+ZSirXW6qYpEOxzB0o3sfz6Vf5Fsra0Mg7afhpZr+sKxU8stn3eJlSjjeX1cE\nkIUVpuN+uqUrPtK0hc/Q9CkcH9Y8SFH4+4j8/bsBAoGAMVRcB1MZHV3IO78DkdCR\nZnAZXq8aqxguCViTZ+NR5sllJQhv2EXCGJZ4DsupnJsM3FkbY9HTy0HnuH8eabyp\nTAjppQxBtQe81rN3eTWJ3FZ8VB3CqWYjxCUua4YZzCMmJNdsAatgat4PlXj5kZF0\nu4B2NdFKJgzEcD6DfUwsbf4=\n-----END PRIVATE KEY-----\n",
  client_email: "chuck-442@chuckforge.iam.gserviceaccount.com",
  client_id: "110731000704423384490",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token"
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const row = [[
      data.timestamp || new Date().toISOString(),
      data.parent_name, data.relationship, data.parent_email, data.parent_phone,
      data.address, data.city, data.state, data.zip,
      data.student_name, data.student_dob, data.student_age, data.student_email,
      data.allergies, data.medications, data.health_conditions, data.injuries, data.dietary,
      data.interest_reason, data.referral_source, data.additional_info,
      data.emergency_name, data.emergency_relationship, data.emergency_phone,
      data.deposit_status || 'Pending'
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A:Y',
      valueInputOption: 'RAW',
      requestBody: { values: row }
    });

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save' });
  }
}
