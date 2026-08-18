require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());
app.use(express.json());

const MTN_TOKEN_URL = process.env.MTN_TOKEN_URL;
const MTN_REQUESTTOPAY_URL = process.env.MTN_REQUESTTOPAY_URL;
const MTN_SUBSCRIPTION_KEY = process.env.MTN_SUBSCRIPTION_KEY;
const MTN_CLIENT_ID = process.env.MTN_CLIENT_ID;
const MTN_CLIENT_SECRET = process.env.MTN_CLIENT_SECRET;
const MTN_TARGET_ENVIRONMENT = process.env.MTN_TARGET_ENVIRONMENT || 'sandbox';
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

async function getMtnToken() {
  if (!MTN_TOKEN_URL || !MTN_CLIENT_ID || !MTN_CLIENT_SECRET) {
    throw new Error('MTN token config missing');
  }
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');

  const auth = Buffer.from(`${MTN_CLIENT_ID}:${MTN_CLIENT_SECRET}`).toString('base64');
  const headers = {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  };
  if (MTN_SUBSCRIPTION_KEY) headers['Ocp-Apim-Subscription-Key'] = MTN_SUBSCRIPTION_KEY;

  const resp = await axios.post(MTN_TOKEN_URL, params.toString(), { headers });
  return resp.data.access_token || resp.data.accessToken || resp.data.token;
}

app.post('/api/mtn/create-payment', async (req, res) => {
  try {
    const { amount, currency, phone, items, buyer_location } = req.body || {};
    if (!amount || !phone) return res.status(400).json({ error: 'amount and phone are required' });

    const token = await getMtnToken();
    const referenceId = uuidv4();

    const headers = {
      'Authorization': `Bearer ${token}`,
      'X-Reference-Id': referenceId,
      'X-Target-Environment': MTN_TARGET_ENVIRONMENT,
      'Content-Type': 'application/json'
    };
    if (MTN_SUBSCRIPTION_KEY) headers['Ocp-Apim-Subscription-Key'] = MTN_SUBSCRIPTION_KEY;

    const body = {
      amount: String(amount),
      currency: currency || 'RWF',
      externalId: `ISOKO_${Date.now()}`,
      payer: { partyIdType: 'MSISDN', partyId: String(phone) },
      payerMessage: 'Payment for IsokoHub order',
      payeeNote: 'IsokoHub order'
    };

    const resp = await axios.post(MTN_REQUESTTOPAY_URL, body, { headers, validateStatus: () => true });
    // Many MTN endpoints return 202 Accepted on success
    if (resp.status === 202 || resp.status === 200) {
      return res.status(200).json({ referenceId, status: 'initiated' });
    }

    return res.status(resp.status).json({ error: resp.data || resp.statusText || 'request failed' });
  } catch (err) {
    console.error('mtn create-payment error', err && err.response ? err.response.data : err.message || err);
    return res.status(500).json({ error: String(err.message || err) });
  }
});

app.get('/api/mtn/status/:ref', async (req, res) => {
  try {
    const ref = req.params.ref;
    if (!ref) return res.status(400).json({ error: 'missing reference id' });
    const token = await getMtnToken();
    const headers = { 'Authorization': `Bearer ${token}`, 'X-Target-Environment': MTN_TARGET_ENVIRONMENT };
    if (MTN_SUBSCRIPTION_KEY) headers['Ocp-Apim-Subscription-Key'] = MTN_SUBSCRIPTION_KEY;

    const url = `${MTN_REQUESTTOPAY_URL.replace(/requesttopay\/?$/, '')}requesttopay/${ref}`;
    const resp = await axios.get(url, { headers, validateStatus: () => true });
    return res.status(resp.status).json(resp.data || { status: resp.statusText });
  } catch (err) {
    console.error('mtn status error', err && err.response ? err.response.data : err.message || err);
    return res.status(500).json({ error: String(err.message || err) });
  }
});

app.post('/api/distance', async (req, res) => {
  try {
    const { origin, destination } = req.body || {};
    if (!origin || !destination) return res.status(400).json({ error: 'origin and destination required' });
    if (!GOOGLE_MAPS_API_KEY) return res.status(500).json({ error: 'Google Maps API key not configured' });

    const origins = `${origin.lat},${origin.lng}`;
    const destinations = `${destination.lat},${destination.lng}`;
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origins)}&destinations=${encodeURIComponent(destinations)}&key=${GOOGLE_MAPS_API_KEY}&mode=driving`;

    const resp = await axios.get(url);
    const data = resp.data;
    if (data.status !== 'OK') return res.status(500).json({ error: data.error_message || data.status });
    const element = data.rows?.[0]?.elements?.[0];
    if (!element) return res.status(500).json({ error: 'No route element returned' });
    return res.json({ distance_meters: element.distance?.value || null, duration_seconds: element.duration?.value || null, raw: data });
  } catch (err) {
    console.error('distance error', err && err.response ? err.response.data : err.message || err);
    return res.status(500).json({ error: String(err.message || err) });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
