# HenryCo Role-Sensitive Identity Escalation

This document states the current trust and identity expectations for elevated HenryCo roles and sensitive actions.

## Escalation Lanes

- Marketplace sellers:
  - `CONFIRMED TRUE`: full seller privilege now assumes document-backed identity verification, trusted or premium trust tier, and no duplicate-contact review hold.
  - `FIX NEXT`: direct seller-flow enforcement still depends on marketplace-side runtime gates beyond account visibility.
- Employers:
  - `CONFIRMED TRUE`: jobs posting readiness assumes verified email plus phone or document identity proof and non-basic trust posture.
  - `PARTIALLY TRUE`: employer-company verification remains a separate jobs-domain control.
- Instructors:
  - `PARTIALLY TRUE`: instructor escalation is modeled in shared trust visibility, but explicit Learn runtime enforcement still needs a dedicated instructor lane review.
- Property owners, agents, and listing operators:
  - `CONFIRMED TRUE`: property publishing now treats phone or document identity proof, duplicate-contact review, suspicious access, and submission risk as real gating factors.
- Payout-sensitive and finance-sensitive users:
  - `CONFIRMED TRUE`: payout eligibility assumes document identity verification, trusted or premium trust, clean recent security posture, and no overlap-review hold.
- Staff-sensitive elevation:
  - `CONFIRMED TRUE`: premium verified trust plus document identity proof is the intended shared-account threshold before clean staff-sensitive elevation is considered.

## Practical Rules

- Duplicate email or phone collisions force manual review for higher-trust seller, property, and payout actions.
- Suspicious or failed security events keep finance-sensitive actions in review posture.
- Email confirmation alone is not treated as sufficient for the strongest seller or payout lanes.
- Phone presence helps trust, but phone verification is not yet a separate live-enforced identity proof.

## Governance Gaps Still Open

- `DEFER WITH EXPLICIT REASON`: MFA and passkeys are not part of any role-sensitive enforcement path yet.
- `DEFER WITH EXPLICIT REASON`: per-device session revoke is not yet available for staff or finance responders.
- `FIX NEXT`: Learn instructor enforcement should move from shared trust visibility into explicit runtime gating once the instructor surfaces are audited end-to-end.
