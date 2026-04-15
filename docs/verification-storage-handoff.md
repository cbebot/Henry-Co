# Verification Storage Handoff

This pass keeps the real repo upload stack intact and records what the backend must continue to support.

## Upload storage pattern in repo truth

- Account verification documents
  `apps/account/app/api/verify/route.ts`
  Uses existing owned-asset upload flow and records the file in `customer_documents`.
- Marketplace seller evidence
  `apps/marketplace/app/api/seller-applications/documents/route.ts`
  Uses existing seller document upload flow and records the file in `customer_documents`.
- Jobs candidate documents
  `apps/jobs/app/api/candidate/documents/route.ts`
  Uses existing jobs document upload flow and records the file in `customer_documents`.
- Property media + verification files
  `apps/property/app/api/property/route.ts`
  Uses existing property media/document upload helpers and records verification documents in `customer_documents`.

No new provider was added in this pass.

## Database truth expected by app code

Required tables / columns already referenced by the repo:

- `customer_profiles.verification_status`
- `customer_profiles.verification_submitted_at`
- `customer_profiles.verification_reviewed_at`
- `customer_profiles.verification_reviewer_id`
- `customer_profiles.verification_note`
- `customer_verification_submissions`
- `customer_documents`
- `customer_activity`
- `customer_notifications`

Relevant migration already present in repo truth:

- `apps/hub/supabase/migrations/20260410130000_kyc_verification_infra.sql`

## Backend/Supabase gaps to verify outside this pass

- Confirm the KYC migration above is applied in every environment that should support real verification.
- Confirm staff review roles have service-side access to `customer_verification_submissions` and profile review fields.
- Confirm `customer_documents` accepts the metadata shapes used by account, marketplace, jobs, and property upload routes.
- Confirm production audit/notification tables exist with the columns used in the review and submission routes.

## App-side readiness completed here

- Shared verification state is consumed consistently by account, jobs, marketplace, property, and staffhq.
- Async uploads now expect JSON-capable routes for account verification, jobs candidate files, property submission, and staff review.
- Sensitive actions now expect truthful verification status instead of placeholder trust assumptions.
