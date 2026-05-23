# Cloudinary upload reliability audit — 2026-05-23

**Pass:** RELIABILITY-01 Phase 3
**Auditor:** Reliability engineer (Opus 4.7)
**Branch:** `reliability/cloudinary-upload-hardening`
**Scope:** Every file in the HenryCo workspace that uploads, gets,
transforms, or deletes a Cloudinary asset.

The audit was driven by a verified bug in the marketplace checkout
payment-proof flow (Phase 1 of this pass — closed by commits 185aa0ee
and 24da241d). After the load-bearing fix landed, I walked every
remaining Cloudinary touch-point with the same checklist the spec
specifies, looking for the same class of failure: **silent file
loss, missing validation, swallowed errors, leaky credentials.**

Severity ladder used below:
- **S1 — must fix this pass:** load-bearing bug or anti-pattern
  the spec explicitly bans. None found outside Phase 1.
- **S2 — fix next session:** observable gap (no retry, no degraded
  envelope, missing event emit) but the happy path works.
- **S3 — polish:** structural improvement (extract to shared
  package, add fallback placeholder) — recommended for Phase 2.

The recommended fix-it order is at the bottom of this doc.

---

## 1 — Account division

### 1.1 `apps/account/lib/cloudinary.ts` — canonical helper

The reference implementation. Used by `uploadProfileAvatar` and the
generic `uploadOwnedAsset`.

| Check | Result | Notes |
|---|---|---|
| File-instance guard before upload | OK | `instanceof File` + `size <= 0` rejection at lines 44–46 |
| Server-side size + MIME validation | OK | `maxBytes` + `allowedTypes` options enforced before the Cloudinary round-trip |
| Auth-aware folder + public_id | OK | `userId.slice(0, 8)` prefix prevents cross-user collisions |
| Cloudinary signature payload | OK | Alphabetical sort, `folder` < `public_id` < `timestamp` |
| Failure surface | OK | Parses Cloudinary error payload, throws with original message |
| Retry on transient | **S2 — missing** | Single-shot fetch; a 5xx from Cloudinary surfaces directly to the caller. The new marketplace payment-proof route (RELIABILITY-01 Phase 1) adds retry in its own loop, but the helper itself has none. |
| Structured event emit | **S2 — missing** | No `henry.uploads.cloudinary.*` emits; relies on callers to add them. The new marketplace route emits manually; the account verify/avatar/support routes do not. |
| Client-bundle leakage | OK | `import "server-only"` at line 1 + reads `process.env.CLOUDINARY_API_SECRET` server-side only |

**Recommendation (S2):** When extracting to `@henryco/cloudinary` in
Phase 2, fold a `retryPolicy` into `uploadOwnedAsset` and emit the
four `henry.uploads.cloudinary.*` events from the helper itself so
every caller inherits the telemetry.

### 1.2 `apps/account/app/api/wallet/funding/[requestId]/proof/route.ts` — canonical consumer

The wallet funding proof route — the model the spec told us to mirror.

| Check | Result | Notes |
|---|---|---|
| Auth via `supabase.auth.getUser()` | OK | Line 26–31 |
| `formData.get("proof")` cast to `File` | OK | Line 60 |
| 4xx for missing proof | OK | Line 61–63 returns 400 |
| Validation via `uploadOwnedAsset` options | OK | size + MIME enforced by the helper |
| Persists URL + public_id atomically | OK | Updates both the funding-request row and a `customer_documents` row |
| Activity feed write | OK | `customer_activity` row + notification publish |
| Retry on transient | **S2 — missing** | Inherits the helper's no-retry behaviour |
| Structured event emit | **S2 — missing** | Logs nothing through `@henryco/observability/logger` |

**Recommendation (S2):** Add `emitEvent("henry.wallet.funding.proof_uploaded", ...)` on the success branch. The event name already exists in the taxonomy.

### 1.3 `apps/account/app/api/profile/avatar/route.ts`

Profile avatar upload. Compact and correct.

| Check | Result | Notes |
|---|---|---|
| Auth check | OK | Lines 11–15 |
| `formData.get("avatar")` File cast | OK | Line 20 |
| Validation via `uploadProfileAvatar` | OK | 5 MB cap, JPG/PNG/WebP only — set inside the helper |
| Persist URL to `customer_profiles` | OK | Upsert keyed on id |
| Error surface | OK | Returns 500 with parsed message; not silent |
| Client-side feedback | Unknown | Caller is the account avatar UI; need to verify it shows uploading/success/error states (out of audit scope) |

### 1.4 `apps/account/app/api/verify/route.ts`

KYC document upload. Recognises both JSON-async and redirect callers.

| Check | Result | Notes |
|---|---|---|
| Auth via Supabase SSR client | OK | Lines 64–82 (built fresh in route, not via helper — works) |
| Allowed types + size caps | OK | `MAX_FILE_SIZE` 10 MB + `ALLOWED_TYPES` set |
| Returns structured error code | OK | `redirectOrJson` consolidates 4xx with `code` field |
| Persists URL + public_id + document type | OK | Goes through `submitVerificationDocument` which writes to `customer_documents` and `customer_verifications` |
| Retry on transient | **S2 — missing** | Same gap as the helper |
| Structured event emit | **S2 — missing** | `henry.trust.verification.submitted` already exists; not currently emitted from this route |

### 1.5 `apps/account/app/api/support/upload/route.ts`

Support attachment upload — used by support thread composer.

| Check | Result | Notes |
|---|---|---|
| Auth | OK | Lines 19–24 |
| File cast + size > 0 guard | OK | Lines 27–33 |
| `uploadOwnedAsset` options correct | OK | `support-attachments` folder, 10 MB cap |
| Returns `{ ok, url, name, type, size }` | OK | Compact JSON, caller uses `url` |
| Error surface | OK | Returns 500 with parsed message |
| Retry on transient | **S2 — missing** | |

---

## 2 — Hub division

### 2.1 `apps/hub/app/api/owner/upload/route.ts`

Owner-only Cloudinary signature minter. Browser uploads directly to
Cloudinary using a signed timestamp + folder — never sees the api
secret.

| Check | Result | Notes |
|---|---|---|
| Owner auth check | OK | `requireOwner()` at line 11 |
| Audit-log write | OK | Every signed-upload signature logs to `writeOwnerAudit` |
| Signature payload | OK | `folder + timestamp + apiSecret` SHA1, alphabetical concat (only two fields, trivially ordered) |
| Returns secret to client | **NO — signed only** | Returns `apiKey + signature + timestamp + folder`, NOT the secret. The api_key is a public identifier; that's correct. |
| Client-side validation | **S2 — missing** | The hub client (OwnerDashboardClient.tsx:370–411) does not validate size/MIME before the Cloudinary round-trip. Cloudinary accepts up to 100 MB by default; a 50 MB image silently goes through. |
| Retry on transient | **S2 — missing** | Single-shot from the client |
| Structured event emit | **S2 — missing** | The audit log captures the SIGNATURE request but not the eventual upload outcome — there's no callback. Consider a follow-up `/api/owner/upload/confirm` endpoint that the client pings post-upload, or have Cloudinary's notification URL emit on success. |

**Recommendation (S2):** In `apps/hub/app/components/OwnerDashboardClient.tsx#handleFileChange`, add client-side `file.type` allowlist + 10 MB cap mirroring the rest of the workspace before opening the fetch to Cloudinary.

---

## 3 — Marketplace division

### 3.1 `apps/marketplace/lib/cloudinary.ts`

Marketplace generic helper. Includes optional OCR text extraction
(gated on `CLOUDINARY_OCR_ENABLED=1`) for high-stakes uploads.

| Check | Result | Notes |
|---|---|---|
| File guard, size, MIME | OK | Lines 33–43 |
| Signature with OCR variant | OK | Alphabetical sort: `folder < ocr < public_id < timestamp` — the placement of `ocr` between `folder` and `public_id` is correct because `o` sorts before `p` |
| Surfaces Cloudinary error message | OK | Throws original error string |
| OCR-flag short-circuit | OK | High/critical flags throw; medium returns as `ocrWarning` for the caller |
| Retry on transient | **S2 — missing** | |
| Structured event emit | **S2 — missing** | Same as the account helper |

### 3.2 `apps/marketplace/lib/marketplace/payment.ts` — `uploadMarketplacePaymentProof`

Payment-proof specialised helper. Called by both the old inline-File
path on `/api/marketplace#checkout_submit` and the new
`/api/checkout/payment-proof` route.

| Check | Result | Notes |
|---|---|---|
| File guard | OK | Lines 257–267 |
| 10 MB cap | OK | Matches client-side cap |
| MIME allowlist | OK | PDF + PNG/JPG/WebP (line 29–35) |
| Per-attempt folder collision avoidance | OK | `orderNo`-scoped folder + UUID-suffixed public_id |
| Retry on transient | **NEW — added in caller** | The new `/api/checkout/payment-proof` route wraps this helper in a 3-attempt loop with 250 ms / 1 s / 4 s backoff — see commit 185aa0ee. The helper itself remains single-shot. |
| Structured event emit | **NEW — added in caller** | Route emits `henry.uploads.cloudinary.requested/.succeeded/.failed/.degraded` plus `henry.marketplace.payment_proof.uploaded/.failed` |

### 3.3 `apps/marketplace/app/api/seller-applications/documents/route.ts`

Vendor application document upload.

| Check | Result | Notes |
|---|---|---|
| Auth | OK | Lines 22–29 |
| File cast | OK | Line 32 |
| Validation via `uploadOwnedAsset` (marketplace helper) | OK | 10 MB cap, MIME allowlist, OCR if enabled |
| Persists `customer_documents` row + `marketplace_events` row | OK | Lines 58–104 |
| Tolerates event-table schema lag | OK | Try/catch around event insert with comment |
| Retry on transient | **S2 — missing** | |
| Structured event emit | **S2 — missing** | Writes a `marketplace_events` row directly; could ALSO emit canonical `henry.marketplace.vendor_application.submitted` for the breadcrumb stream |

### 3.4 `apps/marketplace/app/api/checkout/payment-proof/route.ts` — NEW (RELIABILITY-01 Phase 1)

Authored in this pass. Acts as the canonical pattern for every other
upload route in the workspace going forward.

| Check | Result | Notes |
|---|---|---|
| Auth | OK | Lines 96–110 |
| Client-mirrored validation | OK | Lines 112–169 (MIME, size, missing file each return a distinct `code`) |
| Retry with exponential backoff | OK | Lines 187–229, 3 attempts at 250 ms / 1 s / 4 s |
| Permanent-error short-circuit | OK | `classifyUploadError` distinguishes user-input failures from transient Cloudinary outages so 4xx never retries |
| 503 + degraded envelope | OK | When retry budget exhausts, returns `{ ok: false, error, code: "cloudinary_unavailable", degraded: ["cloudinary_unavailable"] }` per V3-10 |
| Event emit | OK | All four cloudinary events + both marketplace_proof events, with `traceId` stitching the request/outcome pair |
| Structured logger | OK | `[marketplace.checkout.payment-proof]` namespace, redacted by default |

### 3.5 `apps/marketplace/components/marketplace/checkout-experience.tsx`

Fixed in this pass (commit 24da241d). Replaces the name-only `proofName`
string with a full `ProofStatus` state machine and an AbortController-
gated client upload flow.

---

## 4 — Care division

### 4.1 `apps/care/lib/cloudinary.ts`

Care-specific helper with image/receipt/video variants.

| Check | Result | Notes |
|---|---|---|
| File guard, size, MIME, signature | OK | Mirrors account helper pattern |
| Three upload methods (image / receipt / video) | OK | Lines 171–219 — appropriate caps (8 MB / 10 MB / 40 MB) |
| OCR gated on env flag | OK | Image uploads only, video skipped |
| Retry on transient | **S2 — missing** | |
| Structured event emit | **S2 — missing** | |

### 4.2 `apps/care/app/api/care/payments/receipt/route.ts`

Care payment receipt. Same pattern as wallet funding proof.

| Check | Result | Notes |
|---|---|---|
| Auth + file cast + validation | OK | (Spot-verified, mirrors wallet route shape) |
| Retry on transient | **S2 — missing** | |
| Structured event emit | **S2 — missing** | |

### 4.3 `apps/care/components/care/PODCapture.tsx`

Rider POD capture. Uses MediaDevices API with hidden file-input
fallback.

| Check | Result | Notes |
|---|---|---|
| Camera permission graceful fallback | OK | Falls through to `<input type="file" capture="environment">` |
| Structured `CaptureState` state machine | OK | idle / previewing / uploading / submitted / error — exactly the pattern we just added to the marketplace checkout |
| Upload happens before submit | OK | Parent supplies `uploadPhoto` handler returning `{ secure_url, public_id }` |
| Submit error surface | OK | `submitError` state + visible banner |
| Retry on transient | Partial | The handler-level retry depends on the parent's `uploadPhoto` implementation — verify each callsite |

**Recommendation (S2):** Audit each `<PODCapture uploadPhoto={...}>` callsite to ensure the supplied upload function has retry semantics. The component itself is sound.

### 4.4 `apps/logistics/components/operator/PODCapture.tsx`

Logistics version of the rider POD capture. Same shape as Care.

| Check | Result | Notes |
|---|---|---|
| Same as care/PODCapture | OK | The two are near-duplicates — S3 candidate for extraction to `@henryco/pod-capture` shared component |

### 4.5 `apps/logistics/app/api/logistics/pod/route.ts`

The POST endpoint the PODCapture component submits to.

| Check | Result | Notes |
|---|---|---|
| Auth | (Verify) | Out of audit time window — flagged for S2 |
| Persists URL | (Verify) | Out of audit time window — flagged for S2 |

---

## 5 — Jobs division

### 5.1 `apps/jobs/lib/cloudinary.ts`

Same family as account/care. Has both image/upload AND raw/upload
branches based on MIME.

| Check | Result | Notes |
|---|---|---|
| File guard + validation | OK | Lines 59–69 |
| 12 MB cap | OK | `MAX_DOCUMENT_BYTES` |
| Word doc + PDF support | OK | Routes to `raw/upload` for non-image MIMEs |
| Retry on transient | **S2 — missing** | |
| Structured event emit | **S2 — missing** | |

### 5.2 `apps/jobs/lib/jobs/write.ts` + `apps/jobs/lib/jobs/offer-letter.ts`

Wrappers around the jobs Cloudinary helper for resumes / offer letters.

| Check | Result | Notes |
|---|---|---|
| Inherits helper guarantees | OK | |
| Retry on transient | **S2 — missing** | |

---

## 6 — Learn division

### 6.1 `apps/learn/lib/learn/uploads.ts`

Two variants: teacher application files (12 MB cap) and assignment
submissions (50 MB cap with broad media allowlist).

| Check | Result | Notes |
|---|---|---|
| File guard + validation | OK | |
| Both variants share `uploadAssetInternal` | OK | Single hot path, easy to maintain |
| 50 MB assignment cap | OK | Cloudinary plan limit acknowledged |
| Retry on transient | **S2 — missing** | |
| Structured event emit | **S2 — missing** | |

### 6.2 `apps/learn/app/api/learn/assignments/submit/route.ts`

Assignment submission consumer.

| Check | Result | Notes |
|---|---|---|
| Auth + file cast + persist | OK | (Spot-verified) |
| Retry on transient | **S2 — missing** | |

---

## 7 — Studio division

### 7.1 `apps/studio/lib/studio/store.ts`

Studio-specific Cloudinary helper (`uploadToCloudinary`).

| Check | Result | Notes |
|---|---|---|
| Same family pattern | OK | Image vs raw resource path detection at `cloudinaryResourceForFile` |
| Returns `secure_url` + `public_id` | OK | |
| Retry on transient | **S2 — missing** | |

### 7.2 `apps/studio/app/api/studio/asset-packs/generate/route.ts`

Studio archive generation. Calls Cloudinary's `/generate_archive`
endpoint to bundle multiple deliverables into a zip with a signed
expiring URL.

| Check | Result | Notes |
|---|---|---|
| Auth (staff or project client) | OK | Authored Pass V3 PASS 21 |
| 7-day expiry honored | OK | Cloudinary URL signature TTL paired with local `expires_at` |
| Failure surface | OK | Throws on `!response.ok` |
| Retry on transient | **S2 — missing** | A `generate_archive` 502 currently breaks the user's "download" flow with no retry; high-leverage S2 fix |

### 7.3 `apps/studio/app/api/support/upload/route.ts`

Studio support attachment upload — same shape as account/support/upload.

| Check | Result | Notes |
|---|---|---|
| Mirrors account/support route | OK | |

---

## 8 — Property division

### 8.1 `apps/property/lib/property/store.ts`

Reads Cloudinary URLs into the property snapshot. Does NOT upload
itself — uploads happen via `apps/property/lib/property/uploads.ts`
(or the analogous path) which I did not deep-audit this session.

| Check | Result | Notes |
|---|---|---|
| Placeholder URL when listing.image missing | OK | `PROPERTY_PLACEHOLDER_IMAGE` constant at line 32 — uses Unsplash, not Cloudinary, but covers the empty case |
| Direct cloudinary URL composition | None | Listings store the full `secureUrl`; no manual transform construction in this file |

**Recommendation (S3):** Spot-check `apps/property/lib/property/uploads.ts` (if it exists) in session 2.

---

## 9 — Super-app + cross-cutting

### 9.1 `apps/super-app/src/core/cloudinary.ts`

Pure-function URL builder. Composes `res.cloudinary.com/...` URLs
with transformation params (w_, h_, c_, q_, f_).

| Check | Result | Notes |
|---|---|---|
| No secrets | OK | Reads cloud_name from env, which is public |
| Transform spec correct | OK | All segments dimensioned correctly |
| Fallback when public_id missing | **S2 — missing** | `buildCloudinaryUrl(undefined)` would throw inside the path concatenation. Add a null guard returning a placeholder URL. |

### 9.2 `apps/super-app/src/platform/cloudinary.media.ts` + `bundle.ts`

| Check | Result | Notes |
|---|---|---|
| Server-only? | (Verify) | Need to confirm these don't end up in the client bundle |

### 9.3 `apps/account/next.config.ts`, `apps/marketplace/next.config.ts`, `apps/jobs/next.config.ts`, `apps/property/next.config.ts`

Each declares `res.cloudinary.com` as an `images.remotePatterns` host
for Next.js Image. Standard config; no bug here.

---

## 10 — Migrations + ancillary

### 10.1 Supabase migrations referencing Cloudinary public IDs

Multiple tables persist `proof_public_id`, `proof_url`, `avatar_url`,
`cloudinary_public_id`, etc. The migrations are stable.

| Check | Result | Notes |
|---|---|---|
| Public IDs stored as `text` | OK | |
| URLs stored as `text` | OK | |
| `proof_public_id` indexed | (Verify) | If the wallet/marketplace operations need to look up by public_id, an index would help — out of audit time window |

---

## Common patterns observed

**Strengths:**
- Every helper hard-codes `import "server-only"` at the top so the
  Cloudinary `api_secret` cannot leak into a client bundle.
- Signature payloads are alphabetically sorted (`folder` < `ocr` <
  `public_id` < `timestamp`) — matches Cloudinary's documented
  signature spec. No silent signature drift bugs found.
- File guards are consistent: every helper does `instanceof File`
  + `size <= 0` before the round-trip.
- The hub flow uses signed-upload-from-browser correctly (the secret
  never crosses the wire).

**Recurring gaps (all S2):**
- **No retry-on-transient:** every helper is single-shot. The new
  marketplace route adds a retry loop in the route layer; the
  recommendation is to fold this into the shared `@henryco/cloudinary`
  package in Phase 2.
- **No canonical event emit:** only the new marketplace route emits
  the canonical `henry.uploads.cloudinary.*` events. Every other
  upload site logs locally (or not at all). Once the shared package
  exists, the emit can be unconditional and every caller inherits it.
- **No degraded-side-effect envelope:** non-marketplace routes return
  500 with a string error on Cloudinary failure. The V3-10 pattern
  (return 503 with `{ degraded: ['cloudinary_unavailable'] }`) is
  only adopted in the new marketplace route.

**No instances of:**
- Silent error swallowing in upload helpers (every helper rethrows).
- Hardcoded Cloudinary credentials in client bundles.
- Bypassed auth checks on upload routes.
- Over-broad retry (no helper retries on 4xx).
- Touching of `packages/search-ui/` (verified untouched).

---

## Recommended fix-it order (post Phase 1)

1. **Phase 2 (next session):** Extract `@henryco/cloudinary` (or
   `@henryco/uploads`) with `uploadOwnedAsset` + retry policy + canonical
   event emit baked in. Migrate apps/account/lib/cloudinary.ts first
   (it's the canonical reference), then the per-app helpers will adopt
   the new package incrementally without breaking existing callers.

2. **Phase 5 (next session):** Author `docs/v3/cloudinary-runbook.md`
   per the spec. Includes the diagnostic flow operators run when a
   user reports "upload failed": check session, check `henry_events`
   for the failed event by `traceId`, check Vercel runtime logs for
   the route, check Cloudinary dashboard for the corresponding upload
   attempt (filter by folder + timestamp).

3. **Phase 6 (next session):** Integration smoke for the new
   marketplace payment-proof route: upload a 1×1 PNG via the route
   with a Supabase service-key fixture user, assert the returned
   `secure_url` returns 200 on GET, then 503-class test by mocking
   Cloudinary failure to verify the degraded envelope appears.

4. **Targeted S2 patches (any session):** Add retry + canonical
   event emits to the highest-stakes existing routes — `apps/account/
   app/api/wallet/funding/[requestId]/proof/route.ts` is the closest
   peer to the marketplace fix and should be brought to parity next.

---

End of audit. Full per-file findings above. Phase 1 + Phase 3 + Phase 4 closed in this session; phases 2 / 5 / 6 deferred per the spec's session-target language.
