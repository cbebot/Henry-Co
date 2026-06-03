# V3-67 — Partner & Enterprise: Partner Onboarding

**Pass ID:** V3-67  ·  **Phase:** H (Partner & Enterprise)  ·  **Pillar:** P8 (Partner & Enterprise Ecosystem), P7 (Trust)
**Dependencies:** V3-50 (verified provider model), V3-24 (KYC vendor integration)  ·  **Effort:** L  ·  **Parallel-safe:** N (chain V3-67 → V3-68 → V3-69)
**Owner gate:** none  ·  **Risk class:** Identity / Compliance

---

## Role
You are the V3 Partner engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass ships the single canonical partner-onboarding spine — one `partners` record and one onboarding state machine that every division (marketplace seller, service provider, employer, property landlord, studio client) graduates into — from signup through KYC/KYB, service-area declaration, contract acceptance, and a `live` ready-to-trade state. The line you must not cross: you do NOT process money (V3-69 owns payouts), you do NOT compute performance or store contract *versions* (V3-68), and you do NOT build the per-division business suites (V3-70..V3-75). You build the trustworthy front door and the audited contract-acceptance moment; everything downstream consumes the `partners` row you create.

## Project
| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/67-partner-onboarding` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
Partner-style onboarding already exists per-division, fragmented and un-unified:
- **Marketplace** ships the most mature flow: `apps/marketplace/app/account/seller-application/{start,verification,review}/page.tsx`, the `apps/marketplace/app/api/seller-applications/route.ts` handler (draft/submit modes, document map, `agreementAccepted`, `@henryco/trust` auto-flag via `shouldAutoFlag`/`escalateSeverityForRepeatOffender`), the `marketplace_seller_tiers` migration, and a live `apps/marketplace/app/vendor/*` workspace.
- **Jobs** has an employer console (`apps/jobs/app/employer/*`) with `employerMemberships` on the viewer but no formal partner record.
- **KYC** infrastructure exists (`kyc_verification_infra` migration, `@henryco/trust` `verification.ts` with `SharedVerificationStatus`/`SharedTrustTier`, `satisfiesVerificationRequirement`, `getVerificationGateCopy`); **V3-24** wires the external vendor adapters (Smile Identity / Onfido) and verification levels L0–L4 this pass consumes.
- **V3-50** delivers the verified-provider model (provider profile + scoring + service areas) that the `service_provider` partner type federates with.

The gap: there is no **single** `partners` table, no **shared** onboarding state machine, no **unified** staff review queue, and no **audited contract-acceptance** primitive that the whole company trusts. Five divisions each reinvent "become a partner." This pass closes that by introducing one spine all five graduate into — without ripping out the marketplace seller flow (which becomes the reference implementation that writes into the shared `partners` row).

## Mandatory scope

### S1 — `partners` schema + onboarding state machine
Create `supabase/migrations/<ts>_v3_67_partners.sql` (repo-root migrations dir, applied via the standard pipeline). One row per (user, partner_type).

```sql
CREATE TABLE partners (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users (id),
  partner_type          TEXT NOT NULL CHECK (partner_type IN
                          ('marketplace_seller','service_provider','employer','property_landlord','studio_client')),
  display_name          TEXT NOT NULL,
  legal_name            TEXT NOT NULL,                 -- entity name; matches CAC/KYB record
  business_registration TEXT,                          -- CAC / RC number, nullable for sole traders
  kyc_status            TEXT NOT NULL DEFAULT 'none'
                          CHECK (kyc_status IN ('none','pending','verified','rejected')),
  kyc_level             SMALLINT NOT NULL DEFAULT 0,   -- mirrors V3-24 L0..L4
  kyc_verified_at       TIMESTAMPTZ,
  service_areas         TEXT[] NOT NULL DEFAULT '{}',  -- ISO country / region codes
  capabilities          JSONB NOT NULL DEFAULT '{}',   -- per-type capability declaration
  status                TEXT NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft','kyc_in_review','contract_pending','live','suspended','offboarded')),
  current_step          TEXT NOT NULL DEFAULT 'type',  -- wizard resume pointer
  contract_accepted_at  TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, partner_type)
);

ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- Owner reads/writes only their own rows; trust-staff read/write all via the staff client.
CREATE POLICY partners_self_select ON partners
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY partners_self_upsert ON partners
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY partners_self_update ON partners
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND status IN ('draft','kyc_in_review','contract_pending'));
-- Staff/service-role transitions (approve, suspend, offboard) go through the admin client, never RLS.
```

**State machine (forward by self, backward only by staff):**
`draft → kyc_in_review → contract_pending → live`. `live → suspended` and `live → offboarded` are staff-only. Any `*_rejected` outcome routes back to `draft` with a reason. Encode the legal transitions in `lib/partners/state-machine.ts` (pure function `nextPartnerStatus(current, event)` returning `{ ok, next, reason }`); the API and the staff queue both call it — never write `status` ad-hoc.

### S2 — Onboarding wizard
Route: `apps/account/app/(account)/become-a-partner/` (host in the account app so it is division-agnostic; deep-link entry points from each division pass the `?type=` query). Five steps, each persisting to `partners.current_step` so the user can leave and resume:
1. **Partner type** — select one of the five types; pre-fill from `?type=` deep link.
2. **Business / KYB** — legal entity name + business registration; submits to the **V3-24** KYC vendor at business/KYB verification level; writes `kyc_status='pending'`, `status='kyc_in_review'`.
3. **Service area + capabilities** — region multi-select (ISO codes via `@henryco/config` `countries.ts`) + a per-type capability declaration written to `capabilities` JSONB.
4. **Contract** — present the active partner agreement, require explicit acceptance, offer download (rendered via a `@henryco/branded-documents` partner-agreement template; see S5). On accept → `contract_accepted_at`, `status='contract_pending'`.
5. **Initial profile** — minimal profile stub; hand the populated `partners` row to **V3-57** business profiles / **V3-50** provider profile. On completion of all gates → `status='live'`.

Reuse the marketplace draft/submit pattern (`mode: 'draft' | 'submit'`) so progress is never lost.

### S3 — Staff review queue
Route: `apps/staff/app/(staff)/partner-reviews/` + `apps/staff/app/api/partner-reviews/[partnerId]/route.ts`. Trust-staff list `kyc_in_review` and flagged partners, view KYC/KYB result summary (redacted PII), and act: **approve** (advance state), **reject** (back to `draft` + reason), **request more documents**. Every action calls `nextPartnerStatus` and writes an audit-log entry (`@henryco/observability/audit-log`). Reuse `@henryco/trust` `shouldAutoFlag` / `escalateSeverityForRepeatOffender` to pre-sort the queue, exactly as the marketplace seller-application handler does today.

### S4 — Partner notifications
Per-step notifications via `@henryco/notifications` (`publish.ts`), copy keyed through `@henryco/i18n`:
- KYC submitted → "Verification under review"
- KYC approved → "Verification cleared — review your partner agreement"
- Contract accepted → "Agreement accepted — finishing setup"
- Live → "You're live — start trading"
- KYC rejected / docs requested → resubmission CTA deep-linked to the exact wizard step.

### S5 — Contract-acceptance primitive (audited)
The legally load-bearing moment. On acceptance, write an immutable snapshot to a child table `partner_contract_acceptances` (`partner_id`, `contract_version`, `contract_sha256`, `accepted_at`, `ip`, `user_agent`, `accepted_copy_hash`). Render the agreement and the downloadable copy through a new `@henryco/branded-documents` `PartnerAgreementDocument` template — legal entity on the document = **"Henry Onyx Limited"** sourced from `@henryco/config` `COMPANY.group.legalName`, never hardcoded. Acceptance snapshot satisfies ANTI-CLONE Principle 12 (provable consent).

### S6 — Telemetry
Emit via `@henryco/observability/events`:
`henry.partner.onboarding.started`, `henry.partner.kyc.submitted`, `henry.partner.kyc.approved`, `henry.partner.kyc.rejected`, `henry.partner.contract.accepted`, `henry.partner.went_live`.

## Out of scope
- Partner performance, contract *versioning* + re-acceptance flow, dispute history → **V3-68**.
- Payouts, bank-account capture, tax forms → **V3-69**.
- Per-vertical business suites (employer ATS, seller suite, provider CRM, studio suite, bulk invoicing) → **V3-70..V3-75**.
- KYC vendor adapters + verification-level definitions → **V3-24** (this pass *consumes* them).
- Verified-provider scoring + service-area geometry → **V3-50** (federated, not rebuilt).

## Dependencies
Blocked by V3-50 (provider model) and V3-24 (KYC vendor). **Blocks V3-68** (performance + contracts) and **V3-69** (payouts) — both read the `partners` row this pass defines. Chain is strict: V3-67 → V3-68 → V3-69.

## Inheritance
`@henryco/trust` (`shouldAutoFlag`, `escalateSeverityForRepeatOffender`, `verification.ts` status/tier helpers), `@henryco/config` (`countries.ts`, `COMPANY.group.legalName`, `BRAND_EMAILS`), `@henryco/notifications` (`publish.ts`), `@henryco/branded-documents` (new partner-agreement template), `@henryco/observability` (events + audit-log), `requireSensitiveAction` from `@henryco/auth` (V3-02), the V3-24 KYC adapter, and the marketplace seller-application handler as the reference draft/submit implementation.

## Implementation requirements
### Files
- `supabase/migrations/<ts>_v3_67_partners.sql` — `partners` + `partner_contract_acceptances` + RLS.
- `apps/account/lib/partners/state-machine.ts` — `nextPartnerStatus`.
- `apps/account/app/(account)/become-a-partner/` — 5-step wizard + step components.
- `apps/account/app/api/partners/route.ts` — draft/submit + step persistence.
- `apps/staff/app/(staff)/partner-reviews/page.tsx` + `apps/staff/app/api/partner-reviews/[partnerId]/route.ts`.
- `packages/branded-documents/src/templates/partner-agreement.tsx` + export in `index.ts`.

### Trust / safety / compliance
RLS confines a user to their own `partners` rows; staff transitions go through the admin client, never client RLS. KYC/KYB documents and `business_registration` stored per V3-24's encrypted-at-rest contract; review-queue access restricted to trust-staff. Contract acceptance immutable + IP/UA/hash captured (ANTI-CLONE Principle 12). `requireSensitiveAction` guards the KYB-submission and the live-transition routes. Audit-log every state transition.

### Mobile + desktop parity
Wizard is responsive web (account app) and parity-ready for the Expo super-app: each step is a server-action-backed form so the same API serves both. KYC capture defers to the V3-24 vendor SDK (web SDK on web, native SDK on Expo). Contract review is readable on mobile; download works on both.

### i18n
New namespace `surface:partners` (wizard labels, status copy, notification bodies, staff-queue actions, contract-acceptance affordances). Every label/status/error flows through `@henryco/i18n` (`translateSurfaceLabel(locale, text)` Pattern B at minimum; typed Pattern A keys preferred for the wizard). Legal-entity string on the agreement comes from `COMPANY.group.legalName` — translated context, never a hardcoded brand literal.

### Brand & design system
User-facing brand = **Henry Onyx**; legal entity on the partner agreement = **Henry Onyx Limited** — both via `@henryco/config`, never hardcoded. Division labels render "Henry Onyx <Division>". Account-app design tokens (`--site-*` / `--accent`) and shared chrome (`PublicSiteShell`); Fraunces only where the surface is editorial. Zero hardcoded domains — every link via `henryDomain()` / `henryWebRoot()` / `getAccountUrl()`. Light + dark, mobile + desktop, CLS ≈ 0, contrast not regressed.

## Validation gates
1. CI green: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.
2. RLS verification: a partner cannot read or mutate another partner's row; staff-only transitions reject the self client (≈6 RLS assertions).
3. State-machine unit suite: every legal transition + every illegal transition rejected (≈12 cases).
4. Wizard e2e: 5 steps complete, resume mid-wizard restores `current_step`, draft persists across refresh.
5. KYC integration (V3-24 sandbox): submit → `kyc_in_review`, vendor approve → `contract_pending`, vendor reject → `draft` + reason.
6. Contract-acceptance audit: snapshot row written with version + sha256 + IP + UA; download renders `PartnerAgreementDocument` with `legalName = "Henry Onyx Limited"`.
7. i18n strict gate passes (no hardcoded user-facing strings); `surface:partners` namespace registered.
8. UI: light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` not regressed.

## Deployment gate
All validation gates green; V3-50 and V3-24 merged and live; trust-staff queue smoke-tested against a sandbox KYC decision; 14-day soak on a small partner cohort before opening the wizard to all divisions.

## Final report contract
`.codex-temp/v3-67-partner-onboarding/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion). Closure must hand off to V3-68.

## Self-verification
- [ ] `partners` + `partner_contract_acceptances` migration applied; RLS confines self vs staff (S1).
- [ ] `nextPartnerStatus` state machine is the only writer of `status`; illegal transitions rejected (S1).
- [ ] 5-step `become-a-partner` wizard persists + resumes via `current_step` (S2).
- [ ] Staff `partner-reviews` queue approves/rejects/requests-docs, each audit-logged (S3).
- [ ] Per-step partner notifications via `@henryco/notifications`, copy in `surface:partners` (S4).
- [ ] Contract acceptance immutable with version + sha256 + IP + UA; `PartnerAgreementDocument` shows legal entity from `COMPANY.group.legalName` (S5).
- [ ] 6 telemetry events emitted as `henry.partner.*` (S6).
- [ ] `requireSensitiveAction` on KYB-submission + live-transition routes; zero hardcoded domains/strings; Henry Onyx brand throughout.
- [ ] Report written; hand-off to V3-68 stated.
