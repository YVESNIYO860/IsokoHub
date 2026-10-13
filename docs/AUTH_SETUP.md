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

Supabase's default mailer is for testing: it only sends to project team addresses and allows about two messages per hour. If you keep email confirmation enabled, configure a custom SMTP provider under **Authentication → SMTP Settings**, verify the sender domain, and check Supabase Auth logs plus the provider's delivery logs if confirmation emails fail. If you are launching without SMTP, use the admin-approval workflow below instead.

## Admin-Approved Accounts Without Confirmation Email

If the project is launching without SMTP, open **Authentication → Sign In / Providers → Email** and turn off **Confirm email**. New accounts can then sign in immediately; their email addresses are not verified by this flow.

Apply `db/migrations/017_admin_user_approval.sql` after migrations `013` and `016`. New users can browse, but database triggers block creating or editing listings until an administrator approves them from **Admin → Users**. Administrators can also disable or re-enable accounts there. The account-management endpoint requires the server-side `SUPABASE_SERVICE_ROLE_KEY` already listed above.

The **Delete account** action is permanent. It removes the user's uploaded product photos and property videos, marketplace listings, Supabase Auth account, and linked profile. Admin accounts are protected from this action.

Review existing users in the Admin Users tab and approve accounts that should retain listing access. Do not treat an email address as verified for payments, identity checks, or other sensitive workflows. Supabase Auth settings changes apply at the project level, not per signup page.