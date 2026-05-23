# RELIABILITY-01 — Cloudinary Upload Reliability + Marketplace Payment Proof Fix

**Pass ID:** RELIABILITY-01
**Phase:** Bug-fix + hardening
**Pillar:** P12 (Global) + P2 (Marketplace ops)
**Dependencies:** Wave B.1 closed (V3-10 observability primitives + degraded-side-effect pattern available)
**Effort:** M (1–2 sessions)
**Parallel-safe:** YES (no overlap with THEME-01 or DESIGN-01)
**Owner gate:** None (bug fix); visual check on the new upload UI
**Risk class:** None (no money/identity touched; just upload reliability)

---

## Role

You are the V3 Reliability engineer. Owner directive, verbatim:

> "Marketplace payment proof is not uploading, fix it and all error of its kind. Any reference to Cloudinary must be uploading, getting etc properly. NO MORE FAILURES."

**The bar:** every Cloudinary touch-point in the codebase is reliable (upload, get, delete, transform, list). Every failure path has a clear user-visible state (not a silent swallow). Every transient failure is retried with backoff. Every permanent failure surfaces a structured error the user can act on. No more "user uploads file → silently disappears".

The conductor verified the **primary bug**:
- `apps/marketplace/components/marketplace/checkout-experience.tsx:1027` has a file input whose `onChange` only captures `event.currentTarget.files?.[0]?.name` into a `proofName` STRING. The actual `File` object is never captured into a state, never sent in a FormData, never uploaded to Cloudinary. There is NO corresponding API route at `apps/marketplace/app/api/.../proof/route.ts`. The user uploads "PNG/JPG/WebP/PDF under 10 MB" expecting it to flow — but it evaporates the moment the form submits because the submit path doesn't include the file at all.

This is THE bug to fix. After it's fixed, audit and harden every other Cloudinary touch-point against the same class of bug.

---

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `reliability/cloudinary-upload-hardening` |
| Worktree (absolute) | `C:/Users/HP VICTUS/HenryCo/.worktree/reliability-cloudinary` |
| Branch base | `main @ 0c33ffa2` (V3-05 merged; entire Wave B.1 on main) |
| OS context | Windows + bash; pnpm 9.15.5; Node 24.x |

Use ABSOLUTE PATHS for every Read/Edit/Write/Grep/Glob call.
For Bash, first call `cd "C:/Users/HP VICTUS/HenryCo/.worktree/reliability-cloudinary"`. CWD persists.
For git, prefer `git -C "C:/Users/HP VICTUS/HenryCo/.worktree/reliability-cloudinary" <cmd>`.
DO NOT touch the parent repo or any sibling worktree (THEME-01 + DESIGN-01 are running in parallel).

---

## Reference architecture (conductor verified)

There is **no shared `@henryco/cloudinary` package**. Each app has its own `lib/cloudinary.ts` with `uploadOwnedAsset` (or similar) helper. The reference implementation lives at:

- `apps/account/lib/cloudinary.ts` (canonical pattern)
- `apps/account/app/api/wallet/funding/[requestId]/proof/route.ts` (canonical CONSUMER pattern — `formData.get("proof")` → `uploadOwnedAsset()` → persist URL)

Cloudinary-touching files across the codebase (25+ identified by conductor):
- `apps/account/lib/cloudinary.ts` + `apps/account/app/api/wallet/funding/.../proof/route.ts` + `apps/account/app/api/verify/route.ts` + `apps/account/app/api/profile/avatar/route.ts`
- `apps/hub/app/api/owner/upload/route.ts`
- `apps/marketplace/app/api/seller-applications/documents/route.ts` (uses Cloudinary; verify pattern matches account)
- `apps/jobs/lib/jobs/write.ts` + `apps/jobs/lib/jobs/offer-letter.ts`
- `apps/studio/lib/studio/policies.ts` + `apps/studio/app/api/studio/asset-packs/generate/route.ts`
- `apps/learn/lib/learn/uploads.ts` + `apps/learn/app/api/learn/assignments/submit/route.ts`
- `apps/property/lib/property/store.ts`
- `apps/logistics/components/operator/PODCapture.tsx`
- Several Supabase migrations referencing Cloudinary public IDs

There's also `MCP claude.ai Cloudinary` tooling available to the conductor — useful for verifying uploads end-to-end.

---

## Mandatory scope

### Phase 1 — The bug fix (marketplace payment proof)

**Reproduce + diagnose:**
- Read `apps/marketplace/components/marketplace/checkout-experience.tsx` lines 1010–1029 (the file input UI)
- Read the form-submit handler — trace where the checkout submits
- Confirm: the `proof` `File` is never captured into state, never sent in FormData, never reaches an API route
- Search for any existing marketplace payment proof API route. Likely DOES NOT EXIST.

**Fix:**

1. **State the File, not just its name.** In the checkout component, hold `[proofFile, setProofFile] = useState<File | null>(null)` AND keep `proofName` for the display label.
2. **Wire the input.** `onChange={(e) => { const f = e.currentTarget.files?.[0] ?? null; setProofFile(f); setProofName(f?.name ?? ""); }}`
3. **Client-side validate.** File size ≤ 10 MB, MIME in allowed set (PNG/JPG/WebP/PDF). Show inline error if violated. Don't let the user submit a 50 MB file just to get a server-side rejection.
4. **Author the API route.** Create `apps/marketplace/app/api/checkout/payment-proof/route.ts` modelled on `apps/account/app/api/wallet/funding/[requestId]/proof/route.ts`:
   - POST, accepts `multipart/form-data`
   - Auth check via `createSupabaseServer().auth.getUser()`
   - Reads `formData.get("proof") as File | null`
   - Calls `uploadOwnedAsset()` (port the function from account if not shared — see Phase 2)
   - Persists the Cloudinary URL + public ID against the in-flight checkout record (the cart? a pending order?) in Supabase
   - Returns `{ ok: true, url, public_id }` on success
   - Returns `{ error: <localized message> }` with appropriate 4xx on validation failure
   - Returns `{ error, degraded: ['cloudinary_unavailable'] }` with 503 on transient Cloudinary failure (per V3-10 degraded pattern)
   - Logs structured `[checkout/payment-proof]` events via `@henryco/observability/logger`
   - Emits `henry.marketplace.payment_proof.uploaded` event on success and `henry.marketplace.payment_proof.failed` on failure
5. **Wire the submission.** On form submit, if `method === "bank_transfer"`, POST the file to `/api/checkout/payment-proof` FIRST, get the URL back, then attach the URL to the checkout submit payload. Show a spinner + "Uploading proof…" status while the upload is in flight.
6. **Display feedback.** Success: green check + filename. Failure: red text + reason + retry button.

### Phase 2 — Shared Cloudinary client (optional but recommended)

The codebase has fragmented per-app Cloudinary helpers. Consider extracting:
- New package `@henryco/cloudinary` (or `@henryco/uploads`) with:
  - `uploadOwnedAsset(file, ownerUserId, options)` — moved from `apps/account/lib/cloudinary.ts`
  - `deleteOwnedAsset(publicId, ownerUserId)`
  - `getSignedUrl(publicId, options)`
  - `transformUrl(publicId, params)`
- Each helper accepts an options bag with `folder`, `resourceType`, `maxBytes`, `allowedTypes`, `publicIdPrefix`, `retryPolicy`
- Built-in retry on transient errors (5xx from Cloudinary, network timeouts) with exponential backoff (3 tries, 250ms / 1s / 4s)
- Built-in degraded-side-effect return: `{ ok: false, error: 'cloudinary_unavailable', retriable: true }` for transient; `{ ok: false, error: '<reason>' }` for permanent (validation, auth)
- Built-in structured logging via `@henryco/observability/logger`

If extracting is too disruptive for this session, document the plan in `docs/v3/cloudinary-refactor-followup.md` and proceed with Phase 3 as-is (fix marketplace using a local helper copy or the existing account helper).

### Phase 3 — Audit + harden existing Cloudinary touch-points

For each Cloudinary-touching file listed in the reference architecture section, verify:

**Upload sites** (every API route that calls `uploader.upload` or equivalent):
- [ ] File is actually captured client-side (no name-only bugs)
- [ ] Client-side validation (size + MIME) before upload
- [ ] Server-side validation on top
- [ ] Auth check before upload
- [ ] Retry on transient failure (3 tries with backoff)
- [ ] Structured log on entry / success / failure
- [ ] Degraded-side-effect response on partial failure (per V3-10 pattern)
- [ ] Loading + success + error states visible in UI

**Get/transform sites** (every `<img src={cloudinaryUrl}>` or signed-URL generation):
- [ ] Fallback placeholder image when Cloudinary URL is missing or 404
- [ ] No hardcoded Cloudinary cloud_name / api_key in client code
- [ ] Image transformations match the actual rendered size (no 4K image downscaled to 100×100)

**Delete sites:**
- [ ] Delete is idempotent (re-deleting already-deleted asset returns ok)
- [ ] Delete failure doesn't block the primary user action — log + continue
- [ ] Database flag updates atomically with delete attempt

Output the audit at `docs/v3/cloudinary-audit-2026-05-23.md` — per-file findings, per-issue severity, recommended fix.

### Phase 4 — Telemetry + observability

Register events in `packages/observability/src/events.ts`:
- `henry.uploads.cloudinary.requested` (file size, mime, target folder)
- `henry.uploads.cloudinary.succeeded` (file size, duration_ms, public_id)
- `henry.uploads.cloudinary.failed` (error_code, retriable, attempt_n)
- `henry.uploads.cloudinary.degraded` (when retry exhausts and degraded path triggers)
- `henry.marketplace.payment_proof.uploaded`
- `henry.marketplace.payment_proof.failed`

Emit from the new shared helper (or from each upload site) via `@henryco/observability/emitEvent`.

Owner-workspace observability tile (V3-10's `observability-tile.tsx`) already reads from `henry_events`. New events will show up there automatically.

### Phase 5 — Documentation

- `docs/v3/cloudinary-runbook.md` — how an operator diagnoses a "user reports upload failed" complaint. Steps: check the user's session, check `henry_events` for failed event, check Vercel runtime logs for the route, check Cloudinary dashboard for the upload attempt.
- Update `docs/v3/fallback-policy.md` (V3-10 doc) to include the Cloudinary degraded-side-effect path.

### Phase 6 — Tests + verification

If time permits:
- Add an integration smoke for the marketplace payment proof flow: upload a 1×1 PNG via the route, verify Cloudinary URL returns 200 on GET.
- Otherwise, document a manual smoke procedure in the report (curl commands, browser steps).

---

## Validation gates

1. Standard CI (Lint, typecheck, test, build) on the branch — must pass.
2. **Manual smoke (primary bug):** in marketplace checkout, select bank transfer, choose a file ≤10 MB, submit — confirm Cloudinary URL is captured server-side + persisted.
3. **Manual smoke (validation):** select a 50 MB file — client-side error prevents submit.
4. **Manual smoke (wrong MIME):** select a `.txt` file — client-side error rejects.
5. **Manual smoke (failure path):** with `CLOUDINARY_API_KEY` temporarily invalid, attempt upload — verify route returns 503 with `degraded: ['cloudinary_unavailable']` and UI shows actionable error.
6. **Audit doc** `docs/v3/cloudinary-audit-2026-05-23.md` covers every file listed in Phase 3.
7. **Events emit** — at least the marketplace upload event is observed in `henry_events` after a successful test.

## Deployment gate

- All gates pass
- DRAFT PR opened, NOT auto-merged
- Owner reviews the new upload flow visually

## Final report contract

`.codex-temp/reliability-cloudinary-uploads/report.md` — standard 9 sections + Cloudinary audit summary + before/after for the marketplace payment proof flow + telemetry events registered.

---

## Anti-patterns (HARD stops)

- NO silently swallowing upload errors. Every catch logs + emits a failed event + surfaces UI feedback.
- NO storing file contents in localStorage / sessionStorage / cookies (>4KB limit + sensitive data).
- NO hardcoded Cloudinary credentials in client bundle. Always server-side.
- NO bypassing the auth check on upload routes.
- NO over-broad retry (don't retry on 4xx — those are user errors).
- NO touching `packages/search-ui/` (owner-reserved).
- NO touching `apps/account/lib/cloudinary.ts` destructively — it's the canonical reference. Extend or extract; don't rewrite in place.
- NO breaking existing Cloudinary URLs (image rendering paths everywhere depend on them).
- NO `git push --force`; use `--force-with-lease`.
- NO PR auto-merge.

---

## Self-verification checklist

- [ ] Marketplace payment proof: File captured into state (not just name)
- [ ] Client-side validation (size + MIME) inline-errors before submit
- [ ] New API route `apps/marketplace/app/api/checkout/payment-proof/route.ts` with auth + upload + persist + structured response
- [ ] Submission flow uploads proof, gets URL, attaches to checkout payload
- [ ] UI shows uploading → success → error states
- [ ] Cloudinary audit doc landed
- [ ] All upload sites verified (or fixed) per Phase 3 checklist
- [ ] 6 new telemetry events registered
- [ ] Runbook + fallback-policy update doc landed
- [ ] DRAFT PR opened with screenshots-needed list

---

You're Opus 4.7. The owner directive is verbatim: "NO MORE FAILURES." Take this seriously. Every Cloudinary touchpoint should work like the user expects on the first try — and degrade gracefully + observably when it can't.

Session 1 target: Phases 1, 3 (audit), and 4 (events). Phases 2 (shared client), 5 (docs), 6 (tests) can spill to session 2 with a crisp pickup note.

Make every shipped phase convincing.
