const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const CONFIG = {
  AUTH_URL: 'https://d18devmarketplace.meevodev.com/oauth2/token',
  API_URL: 'https://d18devpub.meevodev.com/publicapi/v1',
  CLIENT_ID: 'a7139b22-775f-4938-8ecb-54aa23a1948d',
  CLIENT_SECRET: 'b566556f-e65d-47dd-a27d-dd1060d9fe2d',
  TENANT_ID: '4',
  LOCATION_ID: '3'
};

let token = null;
let tokenExpiry = null;

async function getToken() {
  if (token && tokenExpiry && Date.now() < tokenExpiry - 300000) return token;

  const res = await axios.post(CONFIG.AUTH_URL, {
    client_id: CONFIG.CLIENT_ID,
    client_secret: CONFIG.CLIENT_SECRET
  });

  token = res.data.access_token;
  tokenExpiry = Date.now() + (res.data.expires_in * 1000);
  return token;
}

app.post('/book', async (req, res) => {
  try {
    const { first_name, last_name, phone, email, service, stylist, datetime } = req.body;

    if (!first_name || !last_name || !email || !service) {
      return res.json({ success: false, error: 'Missing required fields' });
    }

    const authToken = await getToken();

    // Create client
    const clientRes = await axios.post(
      `${CONFIG.API_URL}/client?TenantId=${CONFIG.TENANT_ID}&LocationId=${CONFIG.LOCATION_ID}`,
      {
        FirstName: first_name,
        LastName: last_name,
        Email: email,
        MobilePhone: phone?.replace(/\D/g, ''),
        ObjectState: 2026,
        OnlineBookingAccess: true
      },
      { headers: { Authorization: `Bearer ${authToken}` }}
    );

    const clientId = clientRes.data.clientId || clientRes.data.data?.clientId || clientRes.data.id;
    console.log('Client created:', clientId);

    if (!clientId) {
      return res.json({ success: false, error: 'Client created but no ID returned', debug: clientRes.data });
    }

    // Book appointment
    const bookingData = new URLSearchParams({
      ServiceId: service,
      StartTime: datetime || new Date(Date.now() + 86400000).toISOString().slice(0,19) + '-08:00',
      ClientId: clientId,
      ClientGender: 2035
    });

    if (stylist) bookingData.append('EmployeeId', stylist);

    const bookRes = await axios.post(
      `${CONFIG.API_URL}/book/service?TenantId=${CONFIG.TENANT_ID}&LocationId=${CONFIG.LOCATION_ID}`,
      bookingData.toString(),
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    res.json({
      success: true,
      appointment_id: bookRes.data.appointmentId,
      message: 'Appointment booked successfully'
    });

  } catch (error) {
    res.json({
      success: false,
      error: error.response?.data?.error?.message || error.message
    });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
