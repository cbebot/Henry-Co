# Trust Score Rules

This pass removes optimistic trust scoring and replaces it with verification-aware caps.

## Shared verification caps

Implemented in `packages/trust/verification.ts`.

- `verified`
  Shared trust score may rise normally and higher tiers remain available.
- `pending`
  Score is capped below high-trust lanes and tier is capped at `verified`.
- `none`
  Score is capped aggressively and tier is capped at `basic`.
- `rejected`
  Score is capped hardest and tier is forced back to `basic`.

Default shared caps in this pass:

- `none`
  Max score `58`, max tier `basic`
- `pending`
  Max score `72`, max tier `verified`
- `rejected`
  Max score `38`, max tier `basic`

Apps can apply stricter caps where product risk is higher.

## Account trust honesty

`apps/account/lib/trust.ts` now applies verification-aware caps before returning:

- public trust score
- trust tier
- requirements for next tier
- flags used by marketplace and jobs surfaces

Consequence:

- No account can show a premium or near-perfect trust state without real approved identity.
- Pending KYC can show progress, but not fake completion.

## Jobs trust honesty

`apps/jobs/lib/jobs/data.ts` and `apps/jobs/lib/jobs/posting-eligibility.ts` now use shared verification truth.

- Candidate trust/readiness cannot silently self-promote while identity is missing.
- Employer posting readiness now carries `verificationStatus` alongside trust tier and score.

## Marketplace trust honesty

`apps/marketplace/app/api/marketplace/route.ts` and `apps/marketplace/lib/marketplace/data.ts` now clamp seller trust projections when shared verification is absent.

- Vendor trust no longer falls back to a high-trust seller posture when account verification is missing.
- Payout-sensitive seller behavior now inherits the same identity truth used elsewhere.

## Property trust honesty

`apps/property/lib/property/trust.ts` and `apps/property/lib/property/policy.ts` now treat identity approval as a real gating factor for higher-risk submissions.

- Missing verification raises risk.
- High-risk listings move into `awaiting_eligibility` instead of pretending to be review-ready.
