# RELIABILITY-01 — Foundation hardening: Cloudinary Upload Reliability + Marketplace Payment-Proof Fix

> **STATUS: SHIPPED — PR #141.** This prompt is the elevated canonical spec and historical record for the Cloudinary upload-reliability pass. The marketplace payment-proof bug is fixed (the `File` is now captured into a real upload state machine and POSTed to a live `/api/checkout/payment-proof` route — see `apps/marketplace/components/marketplace/checkout-experience.tsx` and `apps/marketplace/app/api/checkout/payment-proof/route.ts`), every Cloudinary touch-point was audited (`b800bdb7`), and the six `henry.uploads.cloudinary.*` / `henry.marketplace.payment_proof.*` events are registered in `packages/observability/src/events.ts`. Execute the **Residual / hardening follow-ups** section only; treat everything above it as DONE and verified.

**Pass ID:** RELIABILITY-01  ·  **Phase:** B (Foundation Lock — hardening tail)  ·  **Pillar:** P12 (Global UX), P2 (Marketplace ops)
**Dependencies:** V3-10 (#133 — observability primitives + degraded-side-effect pattern)  ·  **Effort:** M  ·  **Parallel-safe:** Y
**Owner gate:** none (bug fix; visual check on the new upload UI)  ·  **Risk class:** — (no money/identity logic touched — proof is an artifact, not a charge)

---

## Role
You are the V3 Reliability engineer for Henry Onyx. You execute exactly this one pass, then stop and report. You make every Cloudinary touch-point — upload, get, transform, delete, list — reliable, observable, and gracefully degrading, with the marketplace bank-transfer payment-proof upload as the headline fix. The line you do not cross: this is an upload-reliability and artifact-handling pass, not a payments pass — you persist a proof URL against the in-flight order, you never touch charge state, ledger, or money truth; that behaviour stays locked to the payment passes (V3-13 → V3-23).

The owner directive, verbatim, that motivated this pass:
> "Marketplace payment proof is not uploading, fix it and all error of its kind. Any reference to Cloudinary must be uploading, getting etc properly. NO MORE FAILURES."

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/reliability-01-cloudinary` (per pass) |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
There is no shared `@henryco/cloudinary` package — each app owns a `lib/cloudinary.ts` helper. The canonical reference is `apps/account/lib/cloudinary.ts` (the `uploadOwnedAsset` pattern) with `apps/account/app/api/wallet/funding/[requestId]/proof/route.ts` as the canonical consumer (`formData.get("proof")` → `uploadOwnedAsset()` → persist URL). Cloudinary touches ~25 files across `apps/account` (cloudinary lib + wallet funding proof + verify + avatar routes), `apps/hub` (owner upload), `apps/marketplace` (seller-application documents), `apps/jobs` (write + offer-letter), `apps/studio` (policies + asset-packs generate), `apps/learn` (uploads + assignment submit), `apps/property` (store), and `apps/logistics` (`PODCapture.tsx`).

The headline bug: in `apps/marketplace/components/marketplace/checkout-experience.tsx` the bank-transfer proof `<input type="file">` only captured `event.currentTarget.files?.[0]?.name` into a `proofName` string — the actual `File` was never held in state, never put in FormData, never uploaded; and there was no API route to receive it. The user "uploaded" a PNG/JPG/WebP/PDF under 10 MB and it evaporated on submit. This pass closed that gap: the component now runs a real `proofState` upload state machine (`idle | validating | uploading | uploaded | error`), uploads the file to a new `apps/marketplace/app/api/checkout/payment-proof/route.ts` the moment it is selected, and attaches the returned `proof_url` / `proof_public_id` / `proof_name` to the order on "Place order". Card-sensitive data never enters the draft.

## Mandatory scope (SHIPPED — recorded for the closure record)
### S1 — Marketplace payment-proof fix (done, PR #141 `5eacb8e6`)
`checkout-experience.tsx` holds the `File` in a `proofState` machine, validates client-side (≤ 10 MB, MIME ∈ {PNG, JPG, WebP, PDF}) with inline errors before submit, and POSTs to `/api/checkout/payment-proof` on selection (abortable via `proofAbortRef`). The new route: POST `multipart/form-data`; auth via `createSupabaseServer().auth.getUser()`; reads `formData.get("proof") as File | null`; calls the upload helper; persists Cloudinary URL + public ID against the in-flight order; returns `{ ok, url, public_id }` on success, `{ error }` (4xx) on validation failure, `{ error, degraded: ['cloudinary_unavailable'] }` (503) on transient Cloudinary failure per the V3-10 pattern; logs `[checkout/payment-proof]` via `@henryco/observability/logger`; emits `henry.marketplace.payment_proof.uploaded` / `…failed`. UI shows uploading → success (check + filename) → error (reason + retry).
### S2 — Cloudinary touch-point audit + harden (done, `b800bdb7`)
Every upload site verified for: file actually captured client-side (no name-only bugs), client + server size/MIME validation, auth before upload, retry-with-backoff on transient failure (3 tries, 250 ms / 1 s / 4 s), structured log on entry/success/failure, degraded-side-effect response on partial failure, visible loading/success/error states. Get/transform sites: fallback placeholder on missing/404 URL, no cloud_name/api_key in client code, transformations sized to render. Delete sites: idempotent re-delete, delete failure logs-and-continues without blocking the primary action, DB flag updates atomically with the delete attempt. Findings recorded in `docs/v3/cloudinary-audit-2026-05-23.md`.
### S3 — Telemetry (done)
Registered in `packages/observability/src/events.ts`: `henry.uploads.cloudinary.requested`, `…succeeded`, `…failed`, `…degraded`, `henry.marketplace.payment_proof.uploaded`, `henry.marketplace.payment_proof.failed`. Emitted via `@henryco/observability`; they surface in V3-10's `observability-tile.tsx` from `henry_events` automatically.
### S4 — Runbook + fallback doc (done)
`docs/v3/cloudinary-runbook.md` (how an operator diagnoses a "my upload failed" complaint: session → `henry_events` failed event → Vercel runtime logs → Cloudinary dashboard) and the V3-10 `docs/v3/fallback-policy.md` updated with the Cloudinary degraded-side-effect path.

## Out of scope
- Charge/ledger/money-truth behaviour for marketplace orders — owned by V3-13 → V3-23. This pass persists an artifact URL only.
- Shared `@henryco/cloudinary` package extraction — deferred; see follow-up 1 (a plan-doc exists at `docs/v3/cloudinary-refactor-followup.md`).
- `apps/account/lib/cloudinary.ts` destructive rewrite — it is the canonical reference; extend/extract, never rewrite in place.
- `packages/search-ui/` — owner-reserved, never touched.

## Dependencies
Depends on V3-10 (observability logger + degraded-side-effect pattern + the observability tile). Blocks nothing structurally; it hardens the upload substrate every later artifact-bearing pass relies on (V3-18 receipts/invoices, V3-24 KYC document capture, V3-50 provider verification docs).

## Inheritance
Builds on `apps/account/lib/cloudinary.ts` (`uploadOwnedAsset` canonical pattern) + its wallet-funding-proof consumer, `@henryco/observability` (logger, `emitEvent`, the V3-10 tile + fallback policy), and `@henryco/i18n` for all user-facing copy. The `claude.ai Cloudinary` MCP tooling is available to verify uploads end-to-end during smoke.

## Implementation requirements
### Files
`apps/marketplace/components/marketplace/checkout-experience.tsx`; new `apps/marketplace/app/api/checkout/payment-proof/route.ts`; `packages/observability/src/events.ts`; `docs/v3/cloudinary-audit-2026-05-23.md`; `docs/v3/cloudinary-runbook.md`; `docs/v3/fallback-policy.md` (updated); `docs/v3/cloudinary-refactor-followup.md`. Per-app `lib/cloudinary.ts` helpers touched only where the audit found a real defect.
### Trust / safety / compliance
Auth check before every upload (`auth.getUser()`); server-side size/MIME validation on top of client validation; Cloudinary credentials server-only (never in the client bundle); retry only on transient 5xx/network (never on 4xx user errors); every catch logs + emits a `…failed`/`…degraded` event + surfaces UI feedback — zero silent swallows. File contents never stored in localStorage/sessionStorage/cookies. The proof is a payment artifact: persist its URL, never mutate charge or ledger state.
### Mobile + desktop parity
Web mobile is in scope: the file picker, inline validation errors, and uploading/success/error states render correctly on small viewports (PODCapture and avatar flows are mobile-first). Expo super-app upload parity is deferred to V3-87.
### i18n
All upload copy — picker label, "Uploading proof…", success label, validation errors (too-large, wrong-type), retry — routes through `@henryco/i18n` under `surface:marketplace` (Pattern A typed keys; e.g. `checkout.proof.uploading`, `checkout.proof.error.too_large`). Server error messages returned to the UI are localized, not raw strings.
### Brand & design system
The upload UI uses design-system tokens (`--accent` for success, `--state-danger` for error) — no ad-hoc hex; light + dark; CLS ≈ 0; contrast not regressed. Any brand string (division label on the checkout) reads from `@henryco/config` (Henry Onyx Marketplace), never hardcoded.

## Validation gates
1. CI green: Lint, typecheck, test, build.
2. Manual smoke (primary): marketplace checkout → bank transfer → select a ≤ 10 MB file → confirm Cloudinary URL captured server-side and persisted against the in-flight order.
3. Manual smoke (validation): a 50 MB file is blocked client-side before submit; a `.txt` file is rejected by MIME check.
4. Manual smoke (failure path): with `CLOUDINARY_API_KEY` temporarily invalid, the route returns 503 with `degraded: ['cloudinary_unavailable']` and the UI shows an actionable error + retry.
5. Audit doc `docs/v3/cloudinary-audit-2026-05-23.md` covers every file in S2.
6. At least the marketplace upload event is observed in `henry_events` after a successful test.
7. V3-07 hardcoded-text strict gate PASS (no new hardcoded copy).

## Deployment gate
All gates green; owner reviews the new upload flow visually. Squash-merge to `main`; no force-push (`--force-with-lease` only if a rebase requires it); no auto-merge.

## Final report contract
`.codex-temp/v3-reliability-01-cloudinary/report.md` (delivered as `.codex-temp/reliability-cloudinary-uploads/` for the original pass) with the standard 9 sections — exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion — plus the Cloudinary audit summary and the before/after for the marketplace payment-proof flow.

## Residual / hardening follow-ups (the only OPEN work)
1. **Shared `@henryco/cloudinary` (or `@henryco/uploads`) extraction.** Promote the per-app helpers into one package: `uploadOwnedAsset(file, ownerUserId, options)`, `deleteOwnedAsset`, `getSignedUrl`, `transformUrl`; options bag (`folder`, `resourceType`, `maxBytes`, `allowedTypes`, `publicIdPrefix`, `retryPolicy`); built-in 3-try backoff (250 ms / 1 s / 4 s); built-in degraded return (`{ ok:false, error:'cloudinary_unavailable', retriable:true }` transient vs `{ ok:false, error }` permanent); built-in `@henryco/observability` logging. Migrate each app off its local copy. Plan-doc: `docs/v3/cloudinary-refactor-followup.md`.
2. **Integration smoke for the proof flow.** Add a test that uploads a 1×1 PNG via `/api/checkout/payment-proof` and asserts the returned Cloudinary URL GETs 200 — replace the manual curl procedure with a CI-runnable smoke.
3. **Sweep audit findings to closure.** Drive every `medium`/`high` item in `cloudinary-audit-2026-05-23.md` to fixed (or to an explicitly-deferred ticket), so "NO MORE FAILURES" is provable per-file, not just for the headline bug.

## Self-verification
- [ ] S1: proof `File` captured into `proofState` (not just name); client-side size/MIME validation inline-errors before submit; `/api/checkout/payment-proof` route does auth + upload + persist + structured response; submission attaches the returned URL; UI shows uploading → success → error.
- [ ] S2: every upload/get/delete site audited against the checklist; `cloudinary-audit-2026-05-23.md` landed.
- [ ] S3: six `henry.uploads.cloudinary.*` / `henry.marketplace.payment_proof.*` events registered + emitting in `henry_events`.
- [ ] S4: runbook + fallback-policy update landed.
- [ ] No silent swallow, no client-side credentials, no retry on 4xx, no money/ledger mutation.
- [ ] i18n: all copy `surface:marketplace`-namespaced; division label from `@henryco/config`.
- [ ] Tokens: success/error states use `--accent`/`--state-danger`; light + dark; CLS ≈ 0.
- [ ] Residual follow-ups 1–3 executed and recorded in the closure report.
- [ ] CI + V3-07 strict gate PASS; owner visual review of the upload flow done.
