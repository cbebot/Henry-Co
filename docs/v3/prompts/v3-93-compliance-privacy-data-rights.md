# V3-93 — Compliance: Privacy + Data Rights

**Pass ID:** V3-93  ·  **Phase:** I (Platform/API · Global/Mobile · Observability · Closure)  ·  **Pillar:** P12 (Trust, Reliability & Foundation), P7 (Identity, Trust & Compliance)
**Dependencies:** V3-24 (KYC vendor integration — the document store a DSAR must export + a deletion must purge), V3-90 (data lake — the redacted event store a DSAR joins + a deletion must reconcile)  ·  **Effort:** L  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** Compliance

---

## Role

You are the V3 Privacy + Data Rights engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass gives every user the legal rights the company is obligated to honour under GDPR, CCPA, and NDPR: a self-service data export (DSAR), an account-deletion workflow with a grace period and a correct delete-vs-anonymise policy per data class, a versioned consent ledger, and a cookie/tracker consent gate — all on a real, immutable audit trail. The line it must not cross: it builds **the rights machinery** — it never deletes accounting-mandated records the law requires retained, never re-identifies anonymised data, and the deletion path must reconcile with the V3-92 backup retention so a "deleted" user is not silently resurrected from a snapshot.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/93-compliance-privacy-data-rights` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

The pieces a privacy regime needs already exist in part. **Auth + identity:** `@henryco/auth` owns the session; the V3-02 sensitive-action guard (`requireSensitiveAction` server / `fetchWithSensitiveAction` client) protects destructive routes. **Audit:** `@henryco/observability/audit-log` (`writeAuditLog` over `add_audit_log_v2`, SECURITY DEFINER, immutable) is the standing audit primitive on every sensitive route. **Redaction:** `@henryco/observability/redaction` already strips `DEFAULT_REDACT_KEYS` from logs/Sentry. **KYC documents** (V3-24) live in a vendor-mediated, encrypted document store (Smile Identity primary / Onfido fallback per D6), with only metadata in our DB. **The event lake** (V3-90) stores events under `actor_hash` (a salted HMAC, not the raw id) with 90-day raw retention — so events are already pseudonymised by design. **Settings surfaces** exist (`apps/account/app/(account)/settings/{addresses,notifications,security}`). What does **not** exist: any DSAR endpoint (a user cannot export their data), any deletion workflow (no grace period, no per-class delete/anonymise policy, no cascade), any consent ledger (consent actions are not recorded with the version accepted), and any documented per-region data-residency posture. The gap this pass closes: from "we redact logs and store KYC encrypted" to "a user can export everything we hold, delete their account correctly, and we can prove every consent they ever gave."

## Mandatory scope

### S1 — DSAR (Data Subject Access Request) export

A user-initiated data export at `apps/account/app/(account)/privacy/data-export/page.tsx` + the server route `apps/account/app/api/privacy/data-export/route.ts`:
- **Sensitive-action gated** (`requireSensitiveAction`) — a DSAR re-confirms identity before generating an export.
- Generates a comprehensive export (**JSON + CSV**) covering every data class we hold for the user: profile, addresses, orders, bookings, messages/support threads, KYC verification metadata (the document copies are fetched from the V3-24 vendor store via signed URL — never re-stored in our DB), payments + wallet history, AI usage, and the user's own events (joined from the lake via their `actor_hash`).
- Delivered via a **secure signed URL with a 24h expiry** (Supabase Storage signed URL; the export object is private, deleted after expiry). The delivery email is sent via `RESEND_API_KEY`.
- The whole job runs through the **V3-43 workflow engine** (durable, retryable) because assembling a full export is multi-step and must not silently fail; it emits `henry.privacy.dsar.requested` on start and `henry.privacy.dsar.delivered` on signed-URL delivery.
- **Target turnaround: within 7 days** (the regulatory ceiling); the job aims for minutes, the SLA is the legal backstop.

### S2 — Account-deletion workflow (delete-vs-anonymise per class)

A user-initiated deletion at `apps/account/app/(account)/privacy/delete-account/page.tsx` + `apps/account/app/api/privacy/delete-account/route.ts`:
- **Sensitive-action gated**; a `requireSensitiveAction` re-auth is mandatory.
- **30-day grace period** (GDPR + NDPR aligned) — the request schedules deletion; the user can cancel any time within the window; a scheduled V3-43 workflow job executes on expiry.
- On execution, the policy is **per data class** (this is the legally load-bearing part — it is NOT a blanket cascade-delete):
  - **Personal identifiers** (name, email, phone, addresses, profile) → **deleted**.
  - **Transaction + ledger history** (`payment_intents`, `wallet_transactions`, invoices) → **anonymised, retained** — accounting/AML law (LEGAL-AND-BUSINESS L2 tax registration, L15 AML) requires retention; the user is detached (`user_id` → an anonymised tombstone) but the financial record survives for the mandated period.
  - **Reviews + listings + public content** → **author anonymised** (content stays, attribution removed).
  - **Logs + events** → already pseudonymised in the lake (`actor_hash`); the deletion **purges the `actor_hash` → user mapping** so the events become irreversibly non-attributable, and removes any residual raw identifier.
  - **KYC documents** (V3-24 vendor store) → deletion requested from the vendor per the L14 DPA; our metadata row is anonymised/removed.
- An **immutable audit-log entry** records the deletion (via `writeAuditLog`; the V3-17 immutable-trail pattern) — the audit row itself is retained (it is the proof the deletion happened) and contains no PII, only the tombstone id + the classes acted on.
- **Backup reconciliation (the V3-92 seam):** the deletion is recorded against the backup retention horizon — a "deleted" user's data ages out of snapshots per the documented window and is never restored on a future drill/restore without re-applying the deletion. The runbook states this explicitly.

### S3 — Consent ledger (`consent_log`)

Every consent action is recorded, versioned, and queryable. New migration `apps/hub/supabase/migrations/<ts>_consent_log.sql` (**committed, owner-applied**):

```sql
create table if not exists public.consent_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  consent_type text not null
    check (consent_type in ('terms','privacy','cookie','marketing_optin','data_export','data_deletion')),
  consent_action text not null check (consent_action in ('granted','withdrawn')),
  document_version text not null,        -- WHICH version was accepted (e.g. 'terms@2026-06-01')
  region text,                           -- ISO-3166 alpha-2, drives residency/jurisdiction handling
  recorded_at timestamptz not null default now()
);
alter table public.consent_log enable row level security;
grant insert, select on public.consent_log to authenticated;
-- A user reads + writes only their own consent rows.
create policy consent_log_rw_own
  on public.consent_log for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select on public.consent_log to service_role;
create policy consent_log_select_service_role
  on public.consent_log for select to service_role using (true);
```

The `document_version` is non-negotiable — "the user accepted terms" is worthless without "*which* terms." Every terms/privacy acceptance, cookie choice, marketing opt-in/out, and the DSAR/deletion requests themselves write a `consent_log` row and emit `henry.privacy.consent.recorded`.

### S4 — Cookie + tracker consent banner (L17)

A global consent banner (per L17), integrated across the public + account shells (it lives in shared chrome, not per-app):
- Granular categories (necessary / analytics / experimentation / marketing); necessary is non-rejectable, the rest are opt-in.
- The choice is persisted, written to `consent_log` (S3), and is **the signal V3-91 reads** to keep non-consenting users out of experiments and the signal that gates analytics-event emission to the lake.
- The banner copy routes through `@henryco/i18n` (namespace `surface:privacy`), is translated, and the legal entity it names is **"Henry Onyx Limited"** sourced from `@henryco/config` — never hardcoded.

### S5 — Per-region data residency posture

Documented in `docs/v3/data-residency.md` (driven by config rows, **not hardcoded jurisdiction codes or retention periods**):
- A `data_residency_config` set of rows mapping region → storage region + retention windows per data class.
- For EU users, the posture states EU-region Supabase storage **if D10 (per-market localization commitment) commits to it** — this pass documents the mechanism and wires the config-driven switch; it does not unilaterally provision EU infra (that is D10's call). The DSAR + deletion honour the per-region retention windows from the config, never a literal.

### S6 — Telemetry

Five new events, added to the `HenryEventName` union in `packages/observability/src/events.ts` and `docs/event-taxonomy.md`:

```
henry.privacy.dsar.requested       (user_action · requested)   — user initiated a data export
henry.privacy.dsar.delivered       (system_state · delivered)  — export signed-URL delivered
henry.privacy.deletion.requested   (user_action · requested)   — user requested account deletion
henry.privacy.deletion.executed    (system_state · completed)  — grace expired, deletion ran
henry.privacy.consent.recorded     (user_action · completed)   — a consent action was logged
```

Payloads carry the consent/data class and region — **never the exported content, never a raw identifier** (the actor is the user id only in the RLS-protected `consent_log`; telemetry uses the pseudonymised actor).

## Out of scope

- The KYC vendor integration + document store itself (**V3-24** — this pass exports from and requests deletion against it).
- The data lake + `actor_hash` pseudonymisation (**V3-90** — this pass joins it for the DSAR and purges the mapping on deletion).
- Backup machinery + RPO/RTO (**V3-92** — this pass reconciles the deletion against its retention horizon; it does not build backups).
- Provisioning EU-region infrastructure (**D10** owner decision — this pass wires the config-driven mechanism, not the infra).
- A full international consent-management platform (CMP) integration — deferred until D10 commits a market footprint.

## Dependencies

- **Requires:** V3-24 (KYC document store — DSAR export source + deletion target), V3-90 (the lake — DSAR join + deletion-mapping purge; `actor_hash` pseudonymisation).
- **Blocks:** V3-94 closure includes the DSAR + deletion + consent flows in the regression walk; V3-95 launch-readiness asserts "privacy notices published (L6), consent banner live (L17), DPA in place (L14)." The consent signal (S4) is consumed by V3-91 (experiment gating) and the analytics-emission gate.

## Inheritance

- `@henryco/auth` — the session; the V3-02 sensitive-action guard (`requireSensitiveAction` / `fetchWithSensitiveAction`) on the DSAR + deletion routes.
- `@henryco/observability/audit-log` (`writeAuditLog`, immutable) — the deletion + DSAR audit trail; `@henryco/observability/redaction` — the PII-stripping already applied to logs/events.
- V3-90 — `henry_events_raw` + `actor_hash` (the DSAR join + the deletion purge); V3-92 — the backup retention horizon (deletion reconciliation).
- `@henryco/workflow` (V3-43) — the durable export + scheduled-deletion jobs.
- `RESEND_API_KEY` (DSAR delivery email) + Supabase Storage signed URLs + the V3-24 vendor signed URLs (KYC document export) per `docs/v3/INTEGRATION-KEYS.md`.

## Implementation requirements

### Files

DSAR surface + route (`apps/account/app/(account)/privacy/data-export/page.tsx`, `apps/account/app/api/privacy/data-export/route.ts`); deletion surface + route (`apps/account/app/(account)/privacy/delete-account/page.tsx`, `apps/account/app/api/privacy/delete-account/route.ts`); the scheduled-deletion + export workflow handlers (V3-43); the `consent_log` migration (S3, committed/owner-applied); the cookie-consent banner in shared chrome (S4); `docs/v3/data-residency.md` + the `data_residency_config` rows (S5); the five taxonomy entries (S6); `docs/v3/privacy-data-rights.md` (the policy map: per-class delete/anonymise/retain + the legal basis per class). Legal copy (DSAR/deletion notices, consent banner, updated privacy notice) routes through `@henryco/i18n` `surface:privacy`.

### Trust / safety / compliance

This is a compliance-class pass — rigor is absolute. DSAR + deletion routes are sensitive-action gated; every action writes an immutable `writeAuditLog` row (the proof, retained, PII-free). The delete-vs-anonymise policy is per-class and law-bound: personal identifiers deleted; transaction/ledger anonymised-and-**retained** for the L2/L15 mandated period (deleting accounting records would itself be unlawful); content author anonymised; events de-mapped from `actor_hash`. **Re-identification protection:** anonymisation produces a tombstone the original id cannot be recovered from, and the `actor_hash` salt mapping is purged so the lake's events become irreversibly non-attributable. KYC document deletion is requested from the vendor per the L14 DPA. The deletion reconciles with the V3-92 backup horizon — a deleted user is not resurrected by a restore. The exported bundle is private, signed-URL only, 24h expiry, then deleted. Retention periods + jurisdiction codes are config-driven (S5), never hardcoded literals (L16). L6 (privacy notices), L14 (DPA), L17 (cookie consent) are verified before the gate clears (ANTI-CLONE Principles 6 + 12).

### Mobile + desktop parity

The DSAR export, deletion request, and consent banner are available on both web and the Expo super-app — the privacy routes are reachable from the account surface on mobile, and the consent banner renders in mobile chrome with the same granular categories. The signed-URL export download works on mobile.

### i18n

All user-facing copy — the DSAR surface, the deletion flow (grace-period messaging, the irreversible-warning), the consent banner, and the updated privacy notice — routes through `@henryco/i18n`, namespace **`surface:privacy`**, fully translated; status and error strings are typed copy keys, runtime DeepL (Pattern B) covers the other locales. Legal copy is reviewed by counsel **per market** before publication — the prompt names the namespace and requires the counsel review; it never ships hardcoded legal text.

### Brand & design system

The privacy surfaces inherit the account design tokens + Fraunces; light + dark, mobile + desktop, CLS ≈ 0, contrast not regressed (`pnpm a11y:contrast`). Every user-facing string is `@henryco/i18n`-sourced; the legal entity named on every notice/export/banner is **"Henry Onyx Limited"** read from `@henryco/config` (`company.ts` `legalName`) — never hardcoded, never "Henry & Co.". Every link (export download host, support link, privacy-notice link) resolves through `@henryco/config` helpers (`getAccountUrl()` / `getHubUrl()` / `henryWebRoot('/privacy')`) — zero hardcoded domains.

## Validation gates

1. **Standard CI** — typecheck, lint, test, build (`Lint, typecheck, test, build`, the required branch-protection context).
2. **DSAR e2e** — a synthetic user requests an export, the workflow assembles JSON + CSV across every data class (incl. the KYC vendor fetch + the lake join), delivers a 24h signed URL by email, and emits `henry.privacy.dsar.requested` → `henry.privacy.dsar.delivered`; the URL expires + the object is deleted after 24h.
3. **Deletion e2e** — request → 30-day timer (cancellable) → scheduled execution → verify the per-class outcome (identifiers deleted, ledger anonymised-retained, content author anonymised, `actor_hash` mapping purged, KYC vendor deletion requested), an immutable audit row written, and the backup-reconciliation note recorded; emits `henry.privacy.deletion.requested` → `henry.privacy.deletion.executed`.
4. **Consent ledger** — every consent action (terms, cookie, marketing, DSAR, deletion) writes a versioned `consent_log` row with `document_version`; RLS proven (a user reads only their own rows); emits `henry.privacy.consent.recorded`.
5. **Re-identification protection** — a test asserts anonymised ledger/content rows + the de-mapped lake events cannot be re-attributed to the original user.
6. **L6 + L14 + L17 verified** — privacy notice published, DPA in place, cookie banner live + gating analytics/experimentation; legal copy counsel-reviewed per market.
7. **UI gate** — the privacy surfaces hold light + dark, mobile + desktop, CLS ≈ 0, contrast (`pnpm a11y:contrast`); zero hardcoded strings (i18n strict gate green); zero hardcoded domains.

## Deployment gate

All gates green; the required check passing; branch `v3/93-compliance-privacy-data-rights` off `origin/main` → PR → squash-merge (no force-push). **L6 (privacy notices) and L17 (cookie consent) must be published**, and the L14 DPA in place, before the gate clears. Owner + counsel review the per-class delete/anonymise/retain policy in `docs/v3/privacy-data-rights.md`. The `consent_log` migration stays committed-not-applied until the owner applies it. **30-day soak** running real DSAR + consent flows (deletion exercised on synthetic accounts only during soak) to confirm no false deletions and correct retention before V3-95.

## Final report contract

`.codex-temp/v3-93-compliance-privacy-data-rights/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion) + the per-class delete/anonymise/retain policy table with the legal basis cited per class + the re-identification-protection proof.

## Self-verification

- [ ] DSAR export (JSON + CSV, all data classes incl. KYC vendor fetch + lake join) via the V3-43 workflow; 24h signed-URL delivery; sensitive-action gated; ≤ 7-day SLA.
- [ ] Deletion workflow: 30-day cancellable grace; per-class delete/anonymise/**retain** policy (identifiers deleted · ledger anonymised-retained for L2/L15 · content author anonymised · `actor_hash` purged · KYC vendor deletion requested); immutable audit row.
- [ ] Backup reconciliation: a deleted user ages out of V3-92 snapshots and is not restored without re-applying the deletion.
- [ ] `consent_log` versioned (`document_version`), RLS own-only; every consent action recorded; emits `henry.privacy.consent.recorded`.
- [ ] Cookie/tracker consent banner (L17) in shared chrome, granular categories, gating analytics + V3-91 experimentation; i18n-keyed; "Henry Onyx Limited" from config.
- [ ] Per-region residency documented + config-driven (retention/jurisdiction never hardcoded); EU-region wired behind D10.
- [ ] Re-identification protection proven; five `henry.privacy.*` events added to the typed union + `docs/event-taxonomy.md`, payloads carry no exported content / no raw id.
- [ ] L6 + L14 + L17 verified; legal copy counsel-reviewed per market; zero hardcoded strings/domains; `consent_log` migration committed, NOT applied. Report written.
