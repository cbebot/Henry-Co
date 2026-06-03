# V3-24 — Money & Identity Spine: KYC Vendor Integration

**Pass ID:** V3-24  ·  **Phase:** C (Money & Identity Spine)  ·  **Pillar:** P7 (Trust & Identity)
**Dependencies:** V3-12 (Foundation Lock acceptance)  ·  **Effort:** XL  ·  **Parallel-safe:** Y
**Owner gate:** D6 (KYC vendor selection per market)  ·  **Risk class:** Identity, Compliance

---

> **OWNER GATE — read before starting.** This pass is gated on **D6 (KYC vendor selection per market)**. The decision is recorded in `docs/v3/DECISIONS-REQUIRED.md` → D6 (recommended path: **Smile Identity** for African markets — Nigeria, Kenya, South Africa, Ghana — with **Onfido** for international fallback). **Confirm the recorded answer; do not re-litigate it.** Do not sign a vendor contract or wire a live SDK key until the owner has confirmed D6 in writing and the vendor DPA (LEGAL-AND-BUSINESS L14) + per-market data-residency requirement (L16) are satisfied.

## Role
You are the V3 identity engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass replaces manual-only KYC review with a vendor-agnostic verification spine: an adapter interface, two production adapters (Smile Identity primary, Onfido fallback), a deterministic per-market vendor router, a five-level verification ladder, and the staff override path — all behind the existing sensitive-action guard. The line you must not cross: **raw identity documents and vendor PII never enter logs, telemetry, or any client response;** behavioral trust tiers (`@henryco/intelligence`) stay the source of *behavioral* trust — this pass adds *document* identity verification alongside them, it does not replace them.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/24-identity-kyc-vendor-integration` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
KYC infrastructure exists but is **manual-review-only — no external vendor is wired**. The shipped baseline (migration `apps/hub/supabase/migrations/20260410130000_kyc_verification_infra.sql`):

- `public.customer_profiles` carries `verification_status` (default `'none'`), `verification_submitted_at`, `verification_reviewed_at`, `verification_reviewer_id`, `verification_note`.
- `public.customer_verification_submissions` rows track each submitted document: `user_id`, `document_type` (`government_id` / `selfie` / `address_proof` / `business_cert`), `document_id` → `public.customer_documents`, `status` (`pending`/`approved`/`rejected`), `reviewer_id`, `reviewer_note`, timestamps. RLS enabled; a partial review-queue index exists on `status = 'pending'`. `handle_updated_at()` trigger is wired.
- User surface: `apps/account/app/(account)/verification/page.tsx` (server component) renders `@henryco/dashboard-shell/surfaces` primitives, pulls `getVerificationState(user.id)` from `@/lib/verification` and `getAccountTrustProfile(user.id)` from `@/lib/trust`, and mounts `@/components/verification/DocumentSubmissionsClient`, `NextMoveCard`, `ReviewerNoteCard`, `UnlocksRail`. A signed-URL PDF summary lives at `/api/documents/kyc-summary/me`.
- Staff review surface exists: `apps/staff/app/(workspace)/kyc/page.tsx`.
- Behavioral trust tiers (`@henryco/intelligence` `ACCOUNT_TRUST_TIERS`: `basic` → `verified` → `trusted` → `premium_verified`) already gate behaviorally.
- Trust telemetry already declared: `henry.trust.verification.submitted`, `henry.trust.verification.resolved`. The `@henryco/observability/redaction` default key set already redacts `nin`, `bvn`, `passportNumber`, `address` — reuse it, never bypass it.

**Gap this pass closes:** a human must currently eyeball every document. There is no automated document authenticity check, no biometric liveness, no per-market vendor routing, and no verification-level ladder that sensitive actions (wallet withdrawal, seller approval, future gaming) can gate on. V3-24 wires real KYC vendors behind a stable adapter so identity verification scales without the manual bottleneck, while the staff override path remains the final human authority.

## Mandatory scope

### S1 — `@henryco/kyc` package + vendor adapter interface
Create `packages/kyc/` (server-only; `import "server-only"` at every entry). The adapter contract:

```typescript
// packages/kyc/src/adapters/adapter-interface.ts
export type KycVendorKey = "smile_identity" | "onfido" | "internal";
export type KycDocumentType =
  | "bvn" | "nin" | "passport" | "drivers_license" | "voter_card" | "national_id" | "selfie";

export interface KycVendorAdapter {
  readonly vendorKey: KycVendorKey;
  readonly supportedCountries: ReadonlyArray<string>;      // ISO 3166-1 alpha-2
  readonly supportedDocumentTypes: ReadonlyArray<KycDocumentType>;
  /** Server-only. Returns a vendor session the client SDK consumes. Never returns raw PII. */
  initiateVerification(input: InitiateInput): Promise<VerificationSession>;
  /** Polls vendor for a final decision. Result PII is redacted before persistence. */
  fetchResult(vendorSessionId: string): Promise<VerificationResult>;
  /** HMAC/signature-verified webhook parse. Throws on signature mismatch. */
  verifyWebhook(rawBody: string, headers: Record<string, string>): Promise<WebhookResult>;
}

export interface InitiateInput {
  userId: string;
  country: string;                 // ISO alpha-2
  documentTypes: ReadonlyArray<KycDocumentType>;
  requestedLevel: VerificationLevel;
  idempotencyKey: string;          // dedupes vendor session creation
}

export interface VerificationSession {
  vendorSessionId: string;
  /** Opaque client token the web/Expo SDK uses — NOT a provider API key. */
  clientToken: string;
  expiresAt: string;               // ISO
}

export type VendorDecision = "approved" | "rejected" | "manual_review" | "pending";

export interface VerificationResult {
  vendorSessionId: string;
  decision: VendorDecision;
  achievedLevel: VerificationLevel;
  /** PII-stripped; passed through @henryco/observability/redaction before storage. */
  redactedResultJson: Record<string, unknown>;
  reasonCodes: ReadonlyArray<string>;
}

export interface WebhookResult { vendorSessionId: string; result: VerificationResult; }
```

Files: `packages/kyc/src/index.ts`, `adapters/adapter-interface.ts`, `adapters/smile-identity-adapter.ts`, `adapters/onfido-adapter.ts`, `adapters/internal-adapter.ts`, `router.ts`, `levels.ts`, `cost.ts`, `package.json` (name `@henryco/kyc`, `private: true`, exports `server-only`). No vendor key reaches the client bundle — every vendor call is server-mediated.

### S2 — Smile Identity adapter (D6 primary, African markets)
`packages/kyc/src/adapters/smile-identity-adapter.ts`. Wraps the Smile Identity server SDK. `supportedCountries = ["NG","KE","ZA","GH"]`. `supportedDocumentTypes`: `bvn`, `nin`, `passport`, `drivers_license` (Nigeria); `voter_card` (Kenya, South Africa); plus `selfie` for biometric match. Performs document-liveness + biometric selfie ↔ document match. Keys read from env `SMILE_IDENTITY_PARTNER_ID` / `SMILE_IDENTITY_API_KEY` / `SMILE_IDENTITY_CALLBACK_URL` (callback URL composed via `henryWebRoot()` — never hardcoded). `verifyWebhook` validates the Smile signature before trusting any payload.

### S3 — Onfido adapter (D6 fallback, international)
`packages/kyc/src/adapters/onfido-adapter.ts`. Wraps the Onfido server SDK. Broad `supportedCountries` (international). `supportedDocumentTypes`: `passport`, `national_id`, `drivers_license`, `selfie`. Performs facial-similarity + document-authenticity. Keys from `ONFIDO_API_TOKEN` / `ONFIDO_WEBHOOK_TOKEN`. `verifyWebhook` validates the Onfido `X-SHA2-Signature` HMAC before trusting any payload. Also implement `internal-adapter.ts` (manual-review fallback that mints a session resolved entirely by the staff queue — used when no vendor covers the country, and as the deterministic test double).

### S4 — Per-market vendor router
`packages/kyc/src/router.ts`:

```typescript
export class KycVendorRouter {
  constructor(private adapters: ReadonlyArray<KycVendorAdapter>, private cfg: KycRouterConfig) {}
  /** Deterministic: country → preferred vendor; failover to next adapter covering the country. */
  selectAdapter(country: string): KycVendorAdapter;
}
```

Rules: African markets (`NG/KE/ZA/GH`) → Smile Identity primary; everywhere else → Onfido; no covering vendor → `internal` (manual review). If the primary adapter is unavailable (health probe fails / vendor 5xx burst), failover to the next adapter whose `supportedCountries` includes the country, else fall to `internal`. Selection is pure and unit-testable from `country` + adapter availability — no hidden global state.

### S5 — Five-level verification ladder
`packages/kyc/src/levels.ts`:

```typescript
export type VerificationLevel = "L0" | "L1" | "L2" | "L3" | "L4";
// L0 unverified (default) · L1 email-verified · L2 phone-verified
// L3 document-verified (passport/NIN/BVN/national ID) · L4 biometric-verified (selfie ↔ document match)
export function meetsLevel(actual: VerificationLevel, required: VerificationLevel): boolean;
export function levelForSensitiveAction(action: SensitiveKycAction): VerificationLevel;
```

Mapping (this pass *defines* the ladder; each action's own gate is out of scope per below): wallet withdrawal requires `L3+`; seller/provider approval requires `L3+`; future gaming requires `L4`. `meetsLevel` is a total order on `L0 < L1 < L2 < L3 < L4`.

### S6 — Schema extension (real tables, real RLS)
New migration `apps/hub/supabase/migrations/2026XXXXNNNNNN_kyc_vendor_integration.sql`. **Extend the existing tables — do not invent a parallel `kyc_submissions` table.**

```sql
-- Vendor metadata on the existing submission rows.
alter table public.customer_verification_submissions
  add column if not exists vendor text,                  -- 'smile_identity' | 'onfido' | 'internal'
  add column if not exists vendor_session_id text,
  add column if not exists vendor_decision text,         -- 'approved'|'rejected'|'manual_review'|'pending'
  add column if not exists vendor_result_json jsonb,     -- PII-REDACTED via @henryco/observability/redaction
  add column if not exists achieved_level text not null default 'L0',
  add column if not exists idempotency_key text;

create unique index if not exists customer_verification_submissions_idempotency_key_idx
  on public.customer_verification_submissions(idempotency_key)
  where idempotency_key is not null;

-- Persisted current level on the profile (driven by the highest approved submission).
alter table public.customer_profiles
  add column if not exists verification_level text not null default 'L0';

-- RLS: user reads/writes ONLY own submissions; staff-reviewer role reads all + writes review fields.
-- Reuse the existing RLS pattern on customer_verification_submissions; add a staff-reviewer policy
-- mirroring the staff (workspace)/kyc reviewer claim. vendor_result_json is NEVER selectable by the
-- owning user (column-level: expose via a view that drops vendor_result_json for self-reads).
```

`vendor_result_json` must be written already-redacted by `defaultRedactor` from `@henryco/observability/redaction` (extend with any vendor-specific keys via `createRedactor({ extra: [...] })`). Raw vendor responses are never persisted unredacted and never logged.

### S7 — Server routes (idempotent, guarded, audited)
New routes under `apps/account/app/api/verification/`:

- `POST /api/verification/session` — body `{ documentTypes, country }`. Behind **`requireSensitiveAction`** (`packages/auth/src/server/sensitive-action-guard.ts`). Generates the `idempotencyKey`, calls `KycVendorRouter.selectAdapter(country).initiateVerification(...)`, persists a `customer_verification_submissions` row in `pending`, returns `{ vendorSessionId, clientToken, expiresAt }` only.
- `POST /api/verification/webhooks/[vendor]/route.ts` — vendor webhook ingress. Verifies signature via the adapter's `verifyWebhook` (reject 401 on mismatch), reconciles the submission row, recomputes `customer_profiles.verification_level` as the max achieved level across approved submissions, writes the audit log, emits telemetry. Idempotent on `vendor_session_id`.

Every mutating route writes an audit row via `writeAuditLog` from `@henryco/observability/audit-log` (`entityType: "kyc_verification"`, dot-action e.g. `kyc.session.initiated`, `kyc.vendor.decision`, `kyc.staff.override`; `reason` required on staff overrides).

### S8 — User-facing flow (account app)
Update `apps/account/app/(account)/verification/page.tsx` + `@/components/verification/DocumentSubmissionsClient` to drive the vendor capture SDK (web SDK on web; the Expo mobile-capture SDK in the super-app). Preserve the existing surface composition (HeroCard / NextMove / Unlocks / ReviewerNote). All new copy flows through `@henryco/i18n` (`translateSurfaceLabel`, namespace `surface:verification`). The `/api/documents/kyc-summary/me` PDF must continue to work post-migration.

### S9 — Staff review queue + override
Extend `apps/staff/app/(workspace)/kyc/page.tsx`: surface vendor-flagged (`manual_review`) and `rejected` submissions, show the redacted `vendor_result_json` + reason codes (never raw PII), and provide approve / reject / override actions. Every action goes through `requireSensitiveAction` and writes an audit row with a mandatory `reason`. Staff override is the final human authority and always supersedes the vendor decision.

### S10 — Telemetry
Emit via the `@henryco/intelligence` envelope (`henry.<domain>.<noun>.<verb>`):
`henry.kyc.session.initiated`, `henry.kyc.documents.uploaded`, `henry.kyc.vendor_decision.received`, `henry.kyc.staff.override`, `henry.kyc.verification.completed`. Properties carry vendor key, country, achieved level, latency — **never** document numbers, names, or raw vendor payload.

## Out of scope
- Per-action gating *logic* — each sensitive action consumes `meetsLevel(...)`; the wallet-withdrawal gate, seller-approval gate, and gaming gate are implemented by their owning passes (V3-50 provider model, V3-65 gaming, and the existing wallet routes).
- Partner onboarding flow that *uses* this KYC (V3-67).
- Privacy data-rights / DSAR / deletion of verification records (V3-93).
- Content moderation of submitted media (V3-25).

## Dependencies
Depends on **V3-12** (Foundation Lock acceptance) and the **D6** owner decision. **Blocks** V3-50 (verified-provider model), V3-65 (gaming — L4 gate), V3-67 (partner onboarding), V3-93 (privacy/data-rights deletion of KYC records).

## Inheritance
Builds on: existing `kyc_verification_infra` migration (`customer_profiles` + `customer_verification_submissions` + `customer_documents`); `@henryco/intelligence` trust tiers + event envelope + `henry.trust.verification.*` events; `requireSensitiveAction` from V3-02 (`packages/auth`); `writeAuditLog` (`@henryco/observability/audit-log`, `add_audit_log_v2()` RPC); `@henryco/observability/redaction` (`createRedactor`/`defaultRedactor`, already redacts `nin`/`bvn`/`passportNumber`/`address`); `@henryco/dashboard-shell/surfaces`; `@henryco/i18n`; domain helpers in `@henryco/config` (`henryWebRoot`, `getAccountUrl`, `getStaffHqUrl`).

## Implementation requirements

### Files
- `packages/kyc/` (new package — S1–S5): `src/index.ts`, `src/adapters/{adapter-interface,smile-identity-adapter,onfido-adapter,internal-adapter}.ts`, `src/router.ts`, `src/levels.ts`, `src/cost.ts`, `package.json`, `tsconfig.json`.
- `apps/hub/supabase/migrations/2026XXXXNNNNNN_kyc_vendor_integration.sql` (new — S6).
- `apps/account/app/api/verification/session/route.ts`, `apps/account/app/api/verification/webhooks/[vendor]/route.ts` (new — S7).
- `apps/account/app/(account)/verification/page.tsx` + `apps/account/components/verification/DocumentSubmissionsClient.tsx` (updated — S8).
- `apps/staff/app/(workspace)/kyc/page.tsx` (updated — S9) + a staff server action for approve/reject/override.
- `docs/v3/kyc-vendor-architecture.md` (new — adapter + router + level ladder reference, vendor DPA/data-residency notes).

### Trust / safety / compliance
- Vendor contract + DPA (L14) + per-market data-residency (L16) verified before any live key is used.
- All document storage encrypted at rest (Supabase Storage); vendor-side handling per the vendor DPA.
- `requireSensitiveAction` on every initiate / webhook-reconcile-with-side-effects / staff-override path.
- Webhook signature verification mandatory; unsigned/forged payloads rejected 401.
- `vendor_result_json` persisted redacted; raw PII never logged, never in telemetry, never client-readable.
- Idempotency key on session creation dedupes vendor sessions and prevents double-billing the vendor.
- Audit log row on every state change. ANTI-CLONE Principles 6/10/12 (server-side identity logic; labeled verification dataset as moat; every decision audited).

### Mobile + desktop parity
Web uses the vendor web-capture SDK inside the existing verification surface. The Expo super-app uses the vendor's React Native capture SDK (e.g., Smile Identity RN, Onfido RN) through the same server-mediated `/api/verification/session` route — the client never holds a vendor API key, only the opaque `clientToken`. Safe-area + keyboard-avoidance from V3-09 apply to the mobile capture screens.

### i18n
Namespace `surface:verification` (account) and `surface:kyc-review` (staff). Every status label, level name, reason-code explanation, instruction string, and error message flows through `@henryco/i18n` (`translateSurfaceLabel`). Zero hardcoded user-facing strings. Vendor SDK UI carries its own localization where it owns the capture screen.

### Brand & design system
All user-facing strings read "Henry Onyx" via `@henryco/config` (`COMPANY.group.name`) — never hardcoded, never "Henry & Co.". Any document/summary PDF legal entity = **"Henry Onyx Limited"** sourced from `COMPANY.group.legalName`. Verification + staff surfaces use locked design tokens (`--site-*` / `--accent`, Fraunces on editorial surfaces), light + dark, mobile + desktop, CLS ≈ 0, contrast not regressed. Callback/redirect/webhook URLs built only via `henryWebRoot()` / `getAccountUrl()` / `getStaffHqUrl()` — zero hardcoded domains.

## Validation gates
1. Standard CI: `pnpm typecheck` + `pnpm lint` + `pnpm test` + `pnpm build` all green.
2. **Adapter conformance tests** — `internal`, Smile Identity, and Onfido adapters all satisfy `KycVendorAdapter`; `internal` resolves deterministically for unit tests.
3. **Router tests** — country → vendor selection + failover + no-coverage → `internal`, pure-function unit tests (≥ 20 cases across NG/KE/ZA/GH + international + unknown country).
4. **Sandbox e2e** — both vendors in sandbox: initiate → capture → webhook → reconciled decision → level recomputed.
5. **Webhook signature verification** — forged/unsigned payloads rejected 401; valid payloads reconcile idempotently (replay = no double-effect).
6. **Level-gating tests** — `meetsLevel` total-order tests; a sample sensitive action allowed only at the required level.
7. **Redaction test** — persisted `vendor_result_json` contains no `nin`/`bvn`/`passportNumber`/`name`/`address`; telemetry payloads carry zero PII.
8. **RLS verification** — owning user cannot read another user's submissions and cannot read `vendor_result_json`; staff-reviewer role can.
9. **Staff override path** verified end-to-end with mandatory `reason` audited.
10. UI gates on the verification + staff surfaces: real-browser light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` not regressed.

## Deployment gate
- All validation gates green; D6 confirmed in writing; L14 (DPA) + L16 (data residency) verified per market.
- Owner review of `docs/v3/kyc-vendor-architecture.md`.
- 14-day staging soak with synthetic/sandbox users (no real documents) before any live key.
- Live ramp behind a feature flag, monitored — manual `internal` review remains available as the always-on fallback throughout the ramp.
- Branch `v3/24-identity-kyc-vendor-integration` off `origin/main` → PR → CI green → squash-merge; no branch-protection bypass, no force-push.

## Final report contract
`.codex-temp/v3-24-identity-kyc-vendor-integration/report.md` with the standard 9 sections: exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion. Include the vendor DPA/data-residency confirmation and the redaction-of-vendor-payload evidence.

## Self-verification
- [ ] `@henryco/kyc` package: adapter interface + Smile Identity + Onfido + internal adapters (S1–S3).
- [ ] Per-market `KycVendorRouter` with deterministic selection + failover + no-coverage path (S4).
- [ ] Five-level ladder L0–L4 with `meetsLevel` total order + sensitive-action mapping (S5).
- [ ] Migration extends `customer_verification_submissions` + `customer_profiles` with vendor metadata + `verification_level`; RLS verified; `vendor_result_json` redacted + self-hidden (S6).
- [ ] Guarded, idempotent, audited `/api/verification/session` + `/api/verification/webhooks/[vendor]` routes (S7).
- [ ] Account verification surface + Expo capture wired through server-mediated session (S8); web + Expo parity.
- [ ] Staff KYC review + override at `apps/staff/app/(workspace)/kyc` with mandatory audited reason (S9).
- [ ] 5 telemetry events emitted via the `henry.kyc.*` envelope, PII-free (S10).
- [ ] D6 confirmed; L14 + L16 verified; zero hardcoded domains/strings; brand = Henry Onyx / Henry Onyx Limited.
- [ ] Report written; hand-off to V3-50 / V3-65 / V3-67 / V3-93 noted.
