IsokoHub minimal server
======================

This small Express server provides:
- `/api/mtn/create-payment` — initiates MTN Request-To-Pay (server-side)
- `/api/mtn/status/:ref` — check a Request-To-Pay status by reference id
- `/api/distance` — proxy to Google Distance Matrix (driving distance)

Setup
-----
1. Copy `.env.example` to `.env` and fill the values (do NOT commit secrets).
2. Install dependencies and run:

```bash
cd server
npm install
npm start
```

Environment variables
- `MTN_TOKEN_URL` — full token endpoint URL
- `MTN_REQUESTTOPAY_URL` — full request-to-pay endpoint URL
- `MTN_SUBSCRIPTION_KEY` — Ocp-Apim subscription key (if required)
- `MTN_CLIENT_ID` / `MTN_CLIENT_SECRET` — client credentials
- `MTN_TARGET_ENVIRONMENT` — `sandbox` or `production`
- `GOOGLE_MAPS_API_KEY` — Google Maps API key for Distance Matrix

Security
--------
- Keep MTN credentials server-side. Do not embed secrets in client code.
- Use HTTPS in production and restrict callback URLs.

Notes
-----
MTN APIs and endpoints vary by operator/region. Use the exact endpoint URLs and header requirements provided by your MTN developer portal for your country/partner.
