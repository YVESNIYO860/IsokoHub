MTN Payments and Geolocation Integration Guide

Overview
- This document explains how to safely integrate MTN Mobile Money payments and Google Maps geolocation/distance features for IsokoHub.

Security first
- Never embed API keys or secrets in client-side JS. Use a backend server (Node/Express, serverless function) to hold secrets and perform API calls.

1) MTN Mobile Money (server-side)
- Create a backend endpoint `/api/mtn/create-payment` that:
  - Accepts POST { amount, currency, phone, orderId, items }
  - Validates and rate-limits requests
  - Uses server-side MTN API credentials to create a payment (STK Push / collection)
  - Returns a JSON response indicating success and any redirect URL or transaction id

- Node/Express example (pseudo):

  const express = require('express');
  const fetch = require('node-fetch');
  const app = express();
  app.use(express.json());

  app.post('/api/mtn/create-payment', async (req, res) => {
    const { amount, phone, items } = req.body;
    // validate inputs
    // build MTN API request using server-side credentials
    // call MTN sandbox/production endpoints
    // return { checkout_url } or { transactionId }
  });

- Important: store credentials in environment variables and do not commit them. Use HTTPS.

2) Google Maps: Geolocation & Distance Matrix
- Use the Maps JavaScript API or server-side Distance Matrix API to compute driving distances and durations.
- For seller location capture: client can call `navigator.geolocation.getCurrentPosition()` and send the lat/lng to your server when creating a listing.
- To reverse-geocode into a human-readable address (district/locality), use a server-side call to Geocoding API with your API key and return the readable address to client.

- Example server route: `/api/geocode?lat=...&lng=...` which proxies to:
  https://maps.googleapis.com/maps/api/geocode/json?latlng={lat},{lng}&key=API_KEY

- For delivery cost calculation per order between buyer and seller addresses: use Distance Matrix API server-side:
  https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins={buyerLat},{buyerLng}&destinations={sellerLat},{sellerLng}&key=API_KEY

3) Pricing rules (example for Rwanda)
- Simple rule (client-side fallback): base 500 RWF for up to 5 km, then 100 RWF per additional km.
- Production: use official driving distance from Distance Matrix and apply agency-specific rules.

4) Implementation notes for IsokoHub
- Client: capture seller coords during listing (we added a "Use my location" button in `js/sell.js`). The coordinates are attached to product data as `sellerLat` / `sellerLng`.
- Server: implement `/api/distance` which accepts buyer/seller coords and returns distance (meters/km) and a recommended fee.
- Client: on checkout we added a button to detect buyer location and compute per-item fees using stored seller coords; this is a best-effort client-side fallback.

5) Next steps
- I'll scaffold a minimal Node/Express server that contains two endpoints:
  - `/api/mtn/create-payment` (MTN payment initiation stub)
  - `/api/distance` (proxy to Google Distance Matrix)

- If you want that, provide your preferred hosting (VPS, Heroku, Vercel, Render) and I'll scaffold the server with instructions to set environment variables for keys.

Security reminder
- Rotate keys regularly
- Use CORS and authentication on backend
- Log payment attempts securely and reconcile transactions by polling MTN or handling webhooks

