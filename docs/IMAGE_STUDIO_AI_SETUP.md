# Image Studio AI Setup

The Image Studio sends AI edits through the Vercel function at `/api/image-edit`. The Cloudflare token is only read by that server-side function; it is never sent to the browser.

## 1. Apply the per-user usage limit

In Supabase Dashboard → SQL Editor, run `db/migrations/014_image_edit_quota.sql`. The endpoint fails closed until the migration is applied. It allows each signed-in user five edits per UTC day.

## 2. Add Vercel environment variables

In Vercel → Project → Settings → Environment Variables, add these values for Production, Preview, and Development as needed:

- `CLOUDFLARE_ACCOUNT_ID`: the Cloudflare account ID.
- `CLOUDFLARE_API_TOKEN`: the Workers AI API token with Workers AI Read and Edit permissions.
- `SUPABASE_URL`: the project's Supabase URL.
- `SUPABASE_ANON_KEY`: the project's public/publishable Supabase key, used by the server only to validate the user's Supabase session.

Never use a Supabase service-role key in this function or any browser code. Do not commit real values to Git or paste secrets into chat.

## 3. Redeploy and test

Redeploy the Vercel project after saving its environment variables. Sign in, open Image Studio, upload a JPEG/PNG/WebP image, choose **AI Edit**, enter an instruction, and select **Generate edit**. The browser resizes the reference image to at most 504 pixels on its longest side, as required by FLUX.2 Klein, and requests an output up to 1008 pixels on its longest side. AI-generated details may differ from the actual product; review the comparison before downloading or publishing.

For local development, run the project with Vercel's local function runtime (`vercel dev`) and set the same environment variables in an ignored local `.env.local` file. The Vite-only development server does not execute Vercel functions.