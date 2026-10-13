# Authentication Setup

## Username Login

Apply `db/migrations/016_auth_usernames.sql` in the Supabase SQL Editor to add the unique username field and create profiles from signup metadata. The trigger also enforces username uniqueness before email confirmation, when the browser cannot yet write a profile under row-level security.

The `/api/username-login` endpoint looks up a username using the Supabase service role key, then verifies the supplied password with Supabase Auth before returning the account email. The service role key must only be configured as a server-side environment variable; never put it in browser code or commit it to Git.

Configure these environment variables for the deployed API:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Redeploy after applying the migration and setting the variables. Email login and password reset use Supabase Auth directly. Password reset requires the site's redirect URL to be allowed in Supabase Auth URL settings.

For local API testing, use the Vercel function runtime (`vercel dev`) and provide the variables through an ignored `.env.local` file. The Vite-only dev server does not run API functions.

## Confirmation Email Delivery

Supabase's default mailer is for testing: it only sends to project team addresses and allows about two messages per hour. For public signups, configure a custom SMTP provider under **Authentication → SMTP Settings**, verify the sender domain, and check Supabase Auth logs plus the provider's delivery logs if confirmation emails fail. Keep email confirmation enabled.