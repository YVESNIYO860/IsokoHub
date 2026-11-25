# IsokoHub AI shopping and seller tools

The customer assistant chats naturally, searches approved public listings across marketplace categories when asked, and can answer verified platform questions. It should not default to recommending a particular product category. The homepage also asks AI to select one approved listing with a product image for its compact hero feature. Seller AI tools generate listing drafts and can extract explicitly stated details from a description into the seller form. Sellers review the values and submit the form themselves; the API does not directly create, edit, or delete products.

## Server configuration

Configure these variables on the deployment that serves the `/api` functions:

- `GROQ_API_KEY`: Groq API key. Keep it server-side; never add it to browser code or commit it.
- `SUPABASE_URL`: Supabase project URL.
- `SUPABASE_ANON_KEY`: Supabase anon/public key used with public listing policies and the signed-in seller's bearer token. Do not use a service-role key.
- `GROQ_MODEL` (optional): Groq chat-completions model; defaults to `openai/gpt-oss-120b`.

On Vercel, add the variables in Project Settings → Environment Variables, then redeploy. The endpoints are `/api/shopping-assistant` and `/api/product-intelligence`.
If a custom `GROQ_MODEL` has been retired, the server retries the request using the supported default model.

For local development, the Vite server provides middleware for these two AI endpoints. Set the same values in your local process environment before running `npm run dev`. Seller AI tools require a signed-in account, including while seller approval is pending. Posting or editing listings still requires an active, approved account; this is enforced by the listing UI and database. The shopper endpoint uses the Supabase anon key and returns only approved public listing fields.

The in-process request throttles are best-effort protections for a single running server instance. For deployments with multiple serverless instances, also configure provider/host-level rate limiting if a strict global quota is needed.

## Database

The AI endpoints do not require a new migration. Public product search uses the existing `public.products` table and RLS policies; if optional `specifications`, `color`, or price-range columns are not present, search falls back to the core listing fields. The separate product-specification migration improves specification matching but should only be applied if those listing fields are wanted by the marketplace.

## Smoke test

1. Open the floating assistant or `/shopping-assistant`, select a language, try a greeting or general question, then search for a product/district. Confirm casual chat does not show unrelated listings and returned product cards open corresponding real listings.
2. Ask for a comparison of at least two listings. Missing values should be identified as unavailable.
3. Ask a platform question, including how to report a listing; the response should reflect the current Support page and not claim a report feature exists.
4. Sign in as an active, verified seller, open Sell Product, and generate a description or feature list. Drafts use plain-text headings and hyphen bullets without visible Markdown markers; long features appear in separate titled sections, and the preview styles their headings and specification labels. Review the draft before copying or using it.
5. Add product facts to the description and use **Fill fields from description**. Confirm that only supported details are filled, one by one, and review them before saving. The same form works when editing an existing listing.
6. Try seller AI with a signed-in account awaiting approval; drafting should work, while posting or editing listings remains unavailable until approval.

If Groq is not configured, the AI endpoints return a visible configuration error. Product search also requires `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
