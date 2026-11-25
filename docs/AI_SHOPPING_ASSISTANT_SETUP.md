# IsokoHub AI shopping and seller tools

The customer assistant searches approved public listings and can answer verified platform questions. Seller writing tools generate drafts from the seller's entered listing details. Both use server-side Groq requests; neither endpoint can create, edit, or delete a product.

## Server configuration

Configure these variables on the deployment that serves the `/api` functions:

- `GROQ_API_KEY`: Groq API key. Keep it server-side; never add it to browser code or commit it.
- `SUPABASE_URL`: Supabase project URL.
- `SUPABASE_ANON_KEY`: Supabase anon/public key used with public listing policies and the signed-in seller's bearer token. Do not use a service-role key.
- `GROQ_MODEL` (optional): Groq chat-completions model; defaults to `llama-3.3-70b-versatile`.

On Vercel, add the variables in Project Settings → Environment Variables, then redeploy. The endpoints are `/api/shopping-assistant` and `/api/product-intelligence`.

For local development, the Vite server provides middleware for these two AI endpoints. Set the same values in your local process environment before running `npm run dev`. The seller endpoint additionally requires a signed-in account whose `user_profiles` row is active and verified. The shopper endpoint uses the Supabase anon key and returns only approved public listing fields.

The in-process request throttles are best-effort protections for a single running server instance. For deployments with multiple serverless instances, also configure provider/host-level rate limiting if a strict global quota is needed.

## Database

The AI endpoints do not require a new migration. Public product search uses the existing `public.products` table and RLS policies; if optional `specifications`, `color`, or price-range columns are not present, search falls back to the core listing fields. The separate product-specification migration improves specification matching but should only be applied if those listing fields are wanted by the marketplace.

## Smoke test

1. Open the floating assistant or `/shopping-assistant`, select a language, and search for a product/district. Confirm returned cards open the corresponding real listing.
2. Ask for a comparison of at least two listings. Missing values should be identified as unavailable.
3. Ask a platform question, including how to report a listing; the response should reflect the current Support page and not claim a report feature exists.
4. Sign in as an active, verified seller, open Sell Product, and generate a description or feature list. Review the draft before copying or using it.
5. Try the seller tool with a non-approved account; it should be rejected by the server.

If Groq is not configured, the AI endpoints return a visible configuration error. Product search also requires `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
