# Verification State Model

This pass standardizes HenryCo identity verification around one shared state model used by `account`, `jobs`, `marketplace`, `property`, and `staffhq`.

## Core profile fields

Primary source: `public.customer_profiles`

- `verification_status`
  Values: `none`, `pending`, `verified`, `rejected`
- `verification_submitted_at`
- `verification_reviewed_at`
- `verification_reviewer_id`
- `verification_note`

These fields represent the current account-level trust truth. UI badges, trust-score caps, and sensitive-action gates should read from this profile state instead of inventing local verification guesses.

## Submission queue

Primary source: `public.customer_verification_submissions`

- One row per uploaded document attempt
- Important fields:
  - `user_id`
  - `document_type`
  - `document_id`
  - `status`
  - `submitted_at`
  - `reviewed_at`
  - `reviewer_id`
  - `reviewer_note`

Expected document types in this pass:

- `government_id`
- `selfie`
- `address_proof`
- `business_cert`

`approved` and `rejected` live on submission rows. The account-level profile state remains the authoritative summary.

## Review semantics

- `none`
  User has not submitted a meaningful identity packet yet.
- `pending`
  At least one submission is in queue and final approval has not been granted.
- `verified`
  Review approved the minimum identity requirement for the account.
- `rejected`
  Review failed and the user must resubmit before high-trust lanes unlock.

In this pass, approval of `government_id` or `selfie` is enough to promote the account profile to `verified`. Optional documents remain reviewable without blocking that core state transition.

## Cross-app consumers

- `apps/account`
  Verification workspace, trust score, withdrawals gate
- `apps/jobs`
  Candidate readiness honesty, employer posting eligibility
- `apps/marketplace`
  Seller/payout trust alignment
- `apps/property`
  Submission eligibility and identity gating
- `apps/staff`
  Review queue and async approve / needs-more-info outcomes

## Operational rule

When local division logic needs a trust decision, it can add stricter requirements, but it must not contradict the shared profile verification state.
