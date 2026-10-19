# HAM — Certificate request staging

This work is in a separate branch and is **not deployed**.

## Routes
- Visitor: `/certificates`
- Administrator: `/certificates-admin` (uses the existing administrator password)
- API: `/api/certificates/orders` and authenticated `/api/admin/certificates/orders`

## What is implemented
The customer expressly consents, enters a name/device label, creates a token-protected order and submits a **manually supplied** UDID. Admins can list orders and change their status. Manual identifiers are marked `manual-unverified`. The design deliberately does **not** install a device management profile or issue Apple certificates.

## Before enabling customer intake
1. Run `npm test` and verify the workflow tests pass.
2. Attach a persistent, access-controlled storage disk or replace file storage with a suitable database. Render's ephemeral filesystem is NOT sufficient.
3. Set `DATA_DIR` to the durable storage path and verify it across restart/deploy.
4. Only after storage and backups are tested, set both `HAM_CERT_STORAGE_READY=true` and `HAM_CERT_ORDERS_ENABLED=true` in Render's environment configuration (never in GitHub).
5. Add a real privacy notice, explicit retention/deletion procedure, administrator deletion controls and customer support details before commercial use.
6. Test the workflow on an iPhone and iPad, and verify the supplier's terms and Apple's distribution rules.

## Known limitations
- **Automatic Apple Profile Service/UDID collection is NOT implemented or tested.** The order form supports manual UDID submission only.
- The API's deletion handler is not connected to the existing server router yet; do not describe deletion as available in the admin dashboard.
- Orders and login sessions are not suitable for horizontal scale without shared infrastructure.
- A device UDID does not itself authorize public distribution, sell Apple certificates, or guarantee an app won't be revoked.
- Nothing should be merged to `main` until approval and security checks are complete.

No private keys, customer UDIDs, Apple IDs or passwords should be committed.
