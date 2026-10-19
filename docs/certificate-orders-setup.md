# HAM — Certificate Orders (Staging)

This is a staging-only preparation note for the HAM certificate-request feature.

## Planned flow
1. A visitor explicitly consents to providing device information.
2. The site creates a one-time order and securely receives a device UDID (manual or experimental Apple Profile Service route).
3. Only an authenticated administrator can review device data and update the request status.
4. The administrator separately checks eligibility and uses an authorized Apple distribution method.

## Security and rollout requirements
- Keep UDID and customer records on a protected, persistent backend. Do not put them in this public GitHub repository.
- Do not commit Apple signing keys, .p12 bundles, passwords, or .mobileprovision files.
- HTTPS, authorization checks, input validation, rate limits, an explicit privacy notice and a data-deletion process are required.
- Verify the iOS profile mechanism with real devices before offering it as a working feature.
- Apple Ad Hoc provisioning is a limited testing workflow, not an unrestricted commercial distribution program.
- Do not enable customer payments or claim app uptime/revocation guarantees without verifying delivery and Apple rules.

This branch is separate from `main`. Do not deploy or merge before review and tests.
