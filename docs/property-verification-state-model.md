# Property Verification State Model

HenryCo Property currently evaluates listing trust from three layers:

1. Shared account trust
   - Source: `customer_profiles`, `customer_security_log`, and Supabase auth user metadata.
   - Key signals used in app logic:
     - `verification_status`
     - email confirmation
     - phone presence
     - account age
     - suspicious security events
     - duplicate email and phone overlaps

2. Listing submission evidence
   - Source: property application records plus uploaded storage documents.
   - Evidence categories now used by the app:
     - `ownership_proof`
     - `authority_proof`
     - `management_authorization`
     - `identity_evidence`
     - `supporting_document`
     - `inspection_evidence`

3. Listing operational review state
   - Source: property listing status plus inspection records and policy events.
   - This is the state users and staff should trust for publication readiness.

## Current listing states used by app truth

- `draft`: not yet in governance flow
- `submitted`: entered initial trust pipeline
- `awaiting_documents`: missing proof files or required evidence
- `awaiting_eligibility`: shared-account trust or duplicate-contact gate unresolved
- `inspection_requested`: inspection required before publication can continue
- `inspection_scheduled`: inspection booked or actively being coordinated
- `under_review`: trust gates are sufficiently satisfied for editorial review
- `requires_correction`: corrections requested
- `changes_requested`: more information requested
- `approved`: approved for trusted publication
- `published`: live on public property surface
- `rejected`: stopped
- `blocked`: trust posture too weak
- `escalated`: higher-scrutiny review needed
- `archived`: inactive

## What each layer controls

- Shared account trust can hold a listing in `awaiting_eligibility`.
- Document weakness can hold a listing in `awaiting_documents`.
- Inspection-sensitive paths can move a listing into `inspection_requested` or `inspection_scheduled`.
- Only after those rails are cleared should the listing move into `under_review`, `approved`, or `published`.

## Managed vs non-managed truth

- Managed listings are not just regular listings with a badge.
- Managed listings require management authorization and imply HenryCo operational involvement after acceptance.
- Non-managed listings can still be published after review, but the owner or agent remains responsible for operating continuity.

## Important repo truth caveat

- Shared account verification state is real because it comes from shared Supabase-backed identity data.
- Property listing governance is real in app logic.
- Property listing governance is not yet backed by a fully migrated SQL workflow in the live app layer.
- Current app truth persists listing runtime state in storage-backed JSON collections.
