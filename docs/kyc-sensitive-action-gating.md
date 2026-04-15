# KYC Sensitive Action Gating

This pass aligns sensitive-action gating around shared identity verification truth.

## Required behavior

- The gate must be visible.
- The reason must be understandable.
- The UI must deep-link users to the exact next verification step.
- Server-side enforcement must exist for the final action.

## Current gates hardened in this pass

### Account withdrawals

Files:

- `apps/account/app/api/wallet/withdrawal/request/route.ts`
- `apps/account/app/(account)/wallet/withdrawals/page.tsx`
- `apps/account/components/wallet/WalletWithdrawalsClient.tsx`

Rules:

- Withdrawals remain blocked unless identity verification is approved.
- The page now shows the gate before users fill the request form.

### Account verification uploads

Files:

- `apps/account/app/api/verify/route.ts`
- `apps/account/components/verification/VerificationWorkspaceClient.tsx`

Rules:

- Uploads are async.
- Submission state updates in place.
- Users see truthful queue/review status without page bounces.

### Jobs employer posting

Files:

- `apps/jobs/lib/jobs/posting-eligibility.ts`
- `apps/jobs/lib/jobs/write.ts`
- `apps/jobs/app/employer/company/page.tsx`
- `apps/jobs/app/employer/jobs/new/page.tsx`

Rules:

- Shared account verification now influences posting readiness.
- Rejected or incomplete trust conditions keep roles in draft / review lanes instead of direct publish.

### Marketplace seller and payout posture

Files:

- `apps/marketplace/lib/marketplace/data.ts`
- `apps/marketplace/app/api/marketplace/route.ts`

Rules:

- Seller trust derives from real shared verification posture.
- Missing identity proof no longer presents a stronger seller state than the account has earned.

### Property submission eligibility

Files:

- `apps/property/lib/property/policy.ts`
- `apps/property/app/api/property/route.ts`
- `apps/property/components/property/submit/PropertySubmissionForm.tsx`

Rules:

- Higher-risk listings require approved identity before publication review can progress.
- Missing identity pushes the listing into `awaiting_eligibility`.
- The user sees the policy result immediately after submission.

### Staff review actions

Files:

- `apps/staff/app/(workspace)/kyc/page.tsx`
- `apps/staff/components/kyc/KycReviewQueueClient.tsx`
- `apps/staff/app/api/kyc/review/route.ts`

Rules:

- Staff can approve or request more information asynchronously.
- Review notes are required for negative outcomes.
- User-facing activity and notification records are written when staff acts.
