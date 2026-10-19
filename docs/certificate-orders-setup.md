# HAM PLUS — Supabase certificate request rollout

This code is in **draft PR #1**, not in `main`, and it has NOT been deployed to Render.

## 1. Prepare the dedicated Supabase database

**Completed on 2026-10-19:** the database migration `create_private_ham_certificate_orders` has already been applied to Supabase project `ham-plus` (`kwphjsvdsaorfkojxwar`). Do not re-run it manually. The security hardening migration `restrict_rls_auto_enable_function_execution` was also applied.
The migration creates `public.ham_certificate_orders`, enables RLS, revokes all access from `anon` and `authenticated`, and grants the server's `service_role` access.
Never create permissive public SELECT/INSERT/UPDATE policies for this table.

## 2. Server-side environment variables (Render only)

After verifying table creation and approving the code:
- `SUPABASE_URL`: the **public Supabase project URL** from Supabase Dashboard.
- `SUPABASE_SECRET_KEY`: the **new** `sb_secret_...` key from Supabase Dashboard → Settings → API Keys, stored only in Render's environment. Never add it to GitHub or browser JavaScript.
- Alternatively, legacy `SUPABASE_SERVICE_ROLE_KEY` is supported but deprecated. Prefer `SUPABASE_SECRET_KEY`.
- `HAM_CERT_STORAGE_READY=true`: enable only after confirming credentials and persistent database operations work.
- `HAM_CERT_ORDERS_ENABLED=true`: enable customer intake only after all security/privacy/device tests and final approval. Intake remains disabled by default.

The secret API key should be sent solely using the Supabase `apikey` request header; the legacy service-role JWT also uses `Authorization: Bearer`.

## 3. New staging routes

- `/certificates`: customer consent, create order and manually submit a UDID.
- `/certificates-admin`: login with existing HAM admin password, view orders, update statuses and delete customer data.
- Orders are stored in Supabase, **not on Render's ephemeral filesystem**.
- Browser visitors never receive the Supabase secret key.
- Customer order access requires an unguessable token whose SHA-256 hash is stored in the database.

## Protected connection check

After setting Render environment variables, sign in to the HAM administrator panel.
Request `GET /api/admin/certificates/status` on the same origin, using the administrator's authenticated session.
A response with `connected: true` confirms a read-only connection to Supabase.
A response with `ordersEnabled: false` is expected while customer intake is disabled.
Never include API keys in these requests or browser source.

**Caution:** Changing Render environment settings may trigger a redeploy and restart of the live `main` service. The existing administrator password and session management currently use ephemeral local/in-memory state; arrange durable authentication before any production restart and do not change live settings until approved.

## Experimental automatic UDID extraction — staging ONLY

- Staging URL: https://ham-plus-udid-staging.onrender.com/certificates, opened **in Safari on the iPhone being registered**.
- Visitor taps the trial button and explicitly consents; no device details are obtained merely from visiting the webpage.
- A dedicated, tightly scoped HttpOnly browser cookie authorizes a time-limited Apple Profile Service `.mobileconfig` download.
- Only `UDID`, `PRODUCT`, and `VERSION` are requested. Apple may return a model code, not the human-defined device nickname.
- Modern iOS compatibility and the finishing profile handshake are **not yet confirmed on an actual device**. The profile is currently unsigned and can show an untrusted/unsigned warning.
- A CMS signature and per-order challenge are checked for integrity and one-time correlation, but **the Apple device signer certificate chain is not yet authenticated**. Any result is marked `profile-signature-untrusted` and must not be used to automatically issue/sell signing credentials.
- No MDM enrollment, device restrictions, SCEP or signing assets are installed/provisioned by this prototype.
- The Apple reference documentation describes an older multi-phase enrollment workflow. This minimal response may leave the user with an iOS profile installation error, even if the callback submitted device attributes successfully.

Staging-only environment values: `HAM_PROFILE_TEST_ENABLED=true` and `HAM_PUBLIC_ORIGIN=https://ham-plus-udid-staging.onrender.com`. Do not set this test flag on the production service.
To finish a test, review the visible request, check whether the device details reached the admin dashboard, and delete the test order. Remove any downloaded profile if it remains installed.

## 4. Checks required before production

1. Confirm migrations are applied and RLS/grants work (anon should not see orders).
2. Run CI Node tests and manually test the pages with a staging server.
3. Verify admin login survives Render restarts. The existing HAM `auth.json` password store and sessions live locally/in memory; the Free instance can lose or reset them. Secure durable auth is needed before commercial use.
4. Configure a retention policy and deletion workflow, customer support contact and transparent privacy policy. Check rate limits and abuse controls.
5. Verify modern iOS device ID collection method on real devices. **Automatic Apple profile-based UDID extraction is not implemented.** Manual customer-submitted UDID is labeled unverified.
6. Do not sell Apple certificates or promise that sideloaded applications cannot be revoked without verifying Apple distribution policies and your supplier's actual authorization.
7. Leave the Render deployment on `main`. Do not merge this draft PR until an explicit go-ahead.

## Security boundaries

Never disclose, screenshot, or commit signing certificate private keys, `.p12` passwords, Apple credentials, Supabase secret keys, or Render deployment hooks. Never put the server secret key in the public HTML.
