# IsokoHub Security Notes

## Browser configuration

`js/supabase-config.js` contains only the Supabase project URL and publishable client key. These values are required by the browser and are not database passwords. Do not place a Supabase `service_role` key, database password, OAuth client secret, or private API key in this repository or any browser-delivered file.

## Database protection

Supabase Row Level Security is the security boundary for this static site. Keep RLS enabled on every table and restrict policies by authenticated user, seller ownership, and admin role. Test anonymous reads, seller writes, and admin deletes in the Supabase SQL editor after every policy change.

## Private secrets

Private keys belong in environment variables on a server or serverless function. The existing Claude proxy reads `CLAUDE_API_KEY` from the server environment; never copy that value into frontend JavaScript.

## Source code visibility

HTML, CSS, and JavaScript delivered to a browser can always be downloaded and inspected. Minifying or putting code on one line is not security and will not hide a database endpoint or key. Keep source readable and rely on RLS, authentication, HTTPS, restricted storage policies, and server-side secrets.

If the Supabase publishable key is ever replaced by a secret or service-role key, revoke it immediately in Supabase and replace it through the deployment environment.
