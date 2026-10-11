# IsokoHub Security Notes

## Browser configuration

`js/supabase-config.js` contains only the Supabase project URL and publishable client key. These values are required by the browser and are not database passwords. Do not place a Supabase `service_role` key, database password, OAuth client secret, or private API key in this repository or any browser-delivered file.

## Database protection

Supabase Row Level Security is the security boundary for this static site. Keep RLS enabled on every table and restrict policies by authenticated user, seller ownership, and admin role. Test anonymous reads, seller writes, and admin deletes in the Supabase SQL editor after every policy change.

Apply `db/migrations/013_secure_api_access.sql` after migrations 002-012. It adds the `site_visits` table used by the browser, lets visitors insert only their anonymous page data, and limits analytics reads to the verified admin account. It also prevents users from granting themselves profile roles or capabilities, changing listing approval/ad status, editing other users' IsokoLink relations, or managing another seller's listing media. Listing images and videos remain publicly readable. Confirm the configured admin email in the migration matches the verified owner account before applying it.

The existing demo-name chat intentionally uses public conversation and message reads so unauthenticated visitors can chat. That means chat contents and visitor display names are not private from other API clients. Do not send sensitive information through this chat. To make it private, move chat access behind a server/Edge Function or redesign it around authenticated/anonymous Supabase sessions with per-conversation RLS; changing the current public policies alone would break visitor chat.

The `site_visits` insert policy is public by design and can be abused to inflate analytics. It accepts no account or contact information; use a rate-limited Edge Function or CAPTCHA if visit-count integrity becomes important.

## Private secrets

Private keys belong in environment variables on a server or serverless function. The existing Claude proxy reads `CLAUDE_API_KEY` from the server environment; never copy that value into frontend JavaScript.

## Source code visibility

HTML, CSS, and JavaScript delivered to a browser can always be downloaded and inspected. Minifying or putting code on one line is not security and will not hide a database endpoint or key. Keep source readable and rely on RLS, authentication, HTTPS, restricted storage policies, and server-side secrets.

If the Supabase publishable key is ever replaced by a secret or service-role key, revoke it immediately in Supabase and replace it through the deployment environment.
