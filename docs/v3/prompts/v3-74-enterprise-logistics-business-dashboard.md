# V3-74 — Partner & Enterprise: Logistics Business Dashboard

**Pass ID:** V3-74  ·  **Phase:** H (Partner & Enterprise)  ·  **Pillar:** P8 (Business & Enterprise)
**Dependencies:** V3-57, V3-64  ·  **Effort:** L  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** —

---

## Role
You are the V3 Logistics Business engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass builds the **B2B shipper dashboard** for Henry Onyx Logistics: a business-scoped operator surface where a company's admins see every shipment booked under their account, upload bulk shipments by CSV, schedule pickups, track SLA + claims, manage their contract + negotiated rates, and reconcile monthly statements against outstanding balance. The line you must not cross: a B2B admin sees only shipments stamped with **their own** `b2b_account_id` — never another business's shipments, never the rider/dispatcher operational internals, never raw cost data the contract does not expose.

## Project
| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/74-enterprise-logistics-business-dashboard` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
The logistics backend and operator surfaces already ship. The B2B account container exists: `public.logistics_b2b_accounts` (billing_terms e.g. `net_30`, billing_email, payment_method, sla_id, status, monthly_volume_target, legal_name) and `public.logistics_b2b_admins` (account_id, user_id, role, active, `unique(account_id, user_id)`). Shipments are stamped: `public.logistics_shipments` carries a nullable `b2b_account_id` with an index for cheap monthly aggregation. RLS is in place — a B2B admin reads their own account via `logistics_b2b_admins.user_id = auth.uid() and active`, and `is_staff_in('logistics')` gives staff full access. The monthly statement PDF exists: `@henryco/branded-documents` → `logistics-b2b-statement.tsx` (`LogisticsB2BStatementProps` with period totals, on-time %, gross kobo, per-shipment rows; `formatKobo`/`statusToLabel` helpers; legal entity from `@henryco/config`). The i18n surface `packages/i18n/src/logistics-business-copy.ts` already exists. The app route `apps/logistics/app/business/page.tsx` exists today as a **static marketing page** — there is no authenticated dashboard behind it.

What is missing — and what this pass delivers — is the **operating dashboard**: today there is no logged-in B2B surface that lists a company's shipments, no CSV bulk-upload path, no pickup scheduling, no contract/rate management surface, no reconciliation view, and the statement PDF is generated but never wired to an on-demand UI export. V3-57 introduced the `businesses` / `business_members` primitive and acting-context; V3-64 matured the logistics network (multi-rider routing, customer-facing tracking polish, SLA enforcement). This pass reconciles the pre-existing `logistics_b2b_accounts` container with the V3-57 `business` primitive (one logistics B2B account links to one `business` with `primary_partner_type = 'logistics_shipper'`), then builds the authenticated dashboard on top of the schema that already exists. It does not touch rider/dispatcher workspaces and it does not build the logistics API (V3-78).

## Mandatory scope

### S1 — Link the B2B account to a V3-57 `business`
Reconcile the two account models instead of forking. New migration `apps/logistics/supabase/migrations/<ts>_v3_74_b2b_business_link.sql`:

```sql
-- Link the pre-existing logistics B2B account to a V3-57 business (nullable for back-compat).
alter table public.logistics_b2b_accounts
  add column if not exists business_id uuid
    references public.businesses(id) on delete set null;

create unique index if not exists logistics_b2b_accounts_business_idx
  on public.logistics_b2b_accounts (business_id)
  where business_id is not null;

-- Reusable predicate: is auth.uid() an active admin of the business that owns this account?
create or replace function public.is_logistics_b2b_member(p_account_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.logistics_b2b_admins a
    where a.account_id = p_account_id and a.user_id = auth.uid() and a.active = true
  )
  or exists (
    select 1
    from public.logistics_b2b_accounts acc
    join public.business_members m on m.business_id = acc.business_id
    where acc.id = p_account_id and m.user_id = auth.uid()
  );
$$;
```
The predicate honours **both** the legacy `logistics_b2b_admins` roster and the V3-57 `business_members` roster, so existing admins keep access while new businesses use the unified team model. Acceptance: `pnpm test:rls` proves an admin of account A cannot read account B's shipments, contract, or statement.

### S2 — Authenticated B2B dashboard
Replace the static marketing page with an authenticated dashboard at `apps/logistics/app/business/` (the public marketing content moves to a clearly-marked `/business/overview` landing). The dashboard:
- **All shipments** across the account: a list/table reading `logistics_shipments where b2b_account_id = <account>`, filterable by status/date/zone, paginated, RLS-gated by `is_logistics_b2b_member`. Each row deep-links to the existing customer tracking surface (V3-64).
- **KPI tiles** obeying the V3-08 truth rule: distinguish "no shipments yet" from "loading" from "you have nothing this period." No decorative placeholders.
- **SLA + claims tracking**: surface SLA status (on-time/late per V3-64 enforcement) and open claims from `logistics_claims` scoped to the account.
Acceptance: an admin sees only their account's shipments; the empty/loading/no-data states are truthful; tiles never show fabricated numbers.

### S3 — Bulk shipment upload (CSV) + pickup scheduling
- **Bulk CSV upload**: a server-validated upload that parses a shipment manifest (recipient, address, parcel, service type, zone) into a staged batch, validates every row, surfaces per-row errors before commit, and on confirm creates `logistics_shipments` rows stamped with the account's `b2b_account_id` via a `SECURITY DEFINER` RPC `create_b2b_shipment_batch(p_account_id uuid, p_rows jsonb, p_actor uuid)`. The RPC verifies the actor is a member of the account and rejects the whole batch on any invalid row (no partial commits). Quote each row through the existing logistics quoting path — never hardcode rates.
- **Pickup scheduling**: schedule a pickup window for a batch (date + window + address), persisted and surfaced to dispatch through the existing dispatch pipeline (read-only handoff — this pass does not touch dispatcher workspaces).
Acceptance: a malformed CSV row blocks the entire batch with a row-level error; a valid batch creates N stamped shipments and emits one `henry.logistics_business.bulk_upload` event; a scheduled pickup is visible to the account.

### S4 — Contract + negotiated rates management
A contract surface scoped to the account, building on `logistics_b2b_accounts.billing_terms` / `payment_method` / `sla_id`:
- New table `public.logistics_b2b_contracts (id, account_id fk, version int, billing_cycle text check in ('monthly','per_shipment'), negotiated_rate_card jsonb, effective_from date, effective_to date, signed_by_user_id, signed_at, status text check in ('draft','active','expired','superseded'), created_at)` with `is_logistics_b2b_member` read RLS and staff write via `is_staff_in('logistics')`.
- Contract acceptance is audited via `@henryco/observability/audit-log` (`{ accountId, businessId, actorUserId, contractVersion }`) and emits `henry.logistics_business.contract_signed`.
- The dashboard renders the active contract terms (billing cycle, rate card summary, SLA) — read-only for admins; rate negotiation is a staff-side action.
Acceptance: a contract signed by an admin is audited and version-bumped; only the active contract version drives invoice generation (S5).

### S5 — Invoicing per contract terms + monthly statement export
- **Invoice generation** keyed to the contract's `billing_cycle`: `monthly` aggregates the period's shipments into one invoice; `per_shipment` bills each shipment. Invoices are generated by the existing invoice path (consumed from V3-75's bulk-invoicing engine where present, else the V3-18 single-invoice generator) — this pass does **not** re-implement invoice money logic; it supplies the logistics line items (amount in BIGINT kobo, integer minor units) and the contract's rate card.
- **Statement export**: wire the existing `logistics-b2b-statement.tsx` PDF to an on-demand "Download statement" action that aggregates the period via `logistics_shipments.b2b_account_id`, renders the PDF with legal entity `Henry Onyx Limited` from `@henryco/config`, and serves it through a signed URL. Emits `henry.logistics_business.statement_generated`.
Acceptance: a monthly statement PDF renders with correct period totals, on-time %, and gross kobo; the legal entity is `Henry Onyx Limited`; the signed URL is access-gated to account members.

### S6 — Reconciliation view
A reconciliation surface showing, per period: invoiced total, payments received, and outstanding balance — read from the invoice/payment records (money is provider-confirmed truth, never optimistic). Outstanding balance is computed server-side; the surface is read-only (no payment mutation in this pass — payment capture lives in the payments spine). Acceptance: the reconciliation total ties out to the sum of period invoices minus confirmed payments; no balance is displayed from optimistic/unconfirmed state.

### S7 — Telemetry
Add three event names to the intelligence registry (`packages/intelligence/src/index.ts`, validated by `henryEventNameSchema`, shape `henry.<domain>.<noun>.<verb>`), each carrying `{ accountId, businessId }` and a business-actor block:
```
henry.logistics_business.bulk_upload         henry.logistics_business.contract_signed
henry.logistics_business.statement_generated
```

## Out of scope
- The logistics public API (quote/book/track/cancel/webhooks) — V3-78.
- Rider and dispatcher workspaces and the dispatch engine internals — existing, not touched (pickup scheduling is a read-only handoff).
- Multi-rider routing, customer-facing tracking polish, SLA enforcement engine — V3-64 (this pass consumes its outputs).
- The `businesses` / `business_members` primitive — V3-57.
- Invoice money logic, payment capture, ledger truth — V3-18 (single invoice) and V3-75 (bulk invoicing) own the engine; this pass supplies line items only.

## Dependencies
**Depends on:** V3-57 (`businesses` / `business_members`), V3-64 (logistics network maturity — SLA enforcement, tracking, multi-rider routing). **Consumes when present:** V3-75 bulk-invoicing engine (else falls back to V3-18 single-invoice generation). **Blocks:** V3-78 (logistics API exposes this dashboard's primitives).

## Inheritance
- The shipped logistics B2B schema: `logistics_b2b_accounts`, `logistics_b2b_admins`, `logistics_shipments.b2b_account_id`, `logistics_claims`.
- V3-57: `businesses` / `business_members`, acting-context on `@henryco/auth`.
- V3-64: SLA enforcement, customer tracking surface, multi-rider routing.
- `@henryco/branded-documents` — `logistics-b2b-statement.tsx` (`LogisticsB2BStatementProps`).
- `@henryco/observability/audit-log` — `writeAuditLog` on contract signing + batch creation.
- `@henryco/intelligence` — telemetry envelope + event-name registry.
- `@henryco/i18n` — `logistics-business-copy.ts` (extend for the dashboard chrome).
- `@henryco/config` — `henryDomain('logistics', ...)`, `company.ts` legal entity + division accent.

## Implementation requirements

### Files
- `apps/logistics/supabase/migrations/<ts>_v3_74_b2b_business_link.sql` (S1 link + `is_logistics_b2b_member`).
- `apps/logistics/supabase/migrations/<ts>_v3_74_b2b_contracts.sql` (S4 contracts + RLS).
- `apps/logistics/app/business/page.tsx` (authenticated dashboard) + `apps/logistics/app/business/overview/page.tsx` (the moved marketing landing) + `.../shipments`, `.../upload`, `.../contract`, `.../statements`, `.../reconciliation` sub-routes.
- `apps/logistics/app/api/business/*` route handlers (CSV batch, pickup schedule, statement export, contract sign — all member-gated server-side).
- `packages/i18n/src/logistics-business-copy.ts` extension; `packages/intelligence/src/index.ts` (3 event names).

### Trust / safety / compliance
Default-deny RLS via `is_logistics_b2b_member` on contracts and every account-scoped read; shipment reads are filtered by `b2b_account_id` and the membership predicate. Every mutating route re-verifies membership server-side (the acting-context cookie never widens authority). The CSV batch RPC is all-or-nothing and verifies actor membership. Contract acceptance is audited via `writeAuditLog`. Statement PDFs are served through signed URLs access-gated to account members — never a public URL. Money on invoices/statements is BIGINT kobo (integer minor units); reconciliation uses provider-confirmed payment truth, never optimistic state. No payment capture in this pass.

### Mobile + desktop parity
Operator dashboard is desktop-primary (dense shipment tables, CSV upload, contract review). The shipment-tracking deep-link and statement download are mobile-verified (safe-area, sticky nav per V3-09). Super-app: the B2B operator dashboard is deferred to the mobile-parity wave (V3-87) — state explicitly; do not silently skip.

### i18n
All copy through `@henryco/i18n`, namespace **`surface:logistics-business`** (extend `packages/i18n/src/logistics-business-copy.ts`). Dashboard labels, KPI tile copy, CSV validation errors, contract terms labels, reconciliation copy, and the statement document strings are Pattern A typed keys; Pattern B `translateSurfaceLabel` covers the 11 non-en locales. Zero hardcoded user-facing strings.

### Brand & design system
Henry Onyx brand correctness via `@henryco/config` (`COMPANY.group.name`, division `Henry Onyx Logistics`) — never the retired "Henry & Co.". The statement legal entity is `Henry Onyx Limited` from `company.ts` `legalName`. Every link and signed-URL host resolves through `henryDomain('logistics', ...)` / config helpers — never a literal `henrycogroup.com`. Design-system tokens only (Fraunces where editorial, locked `--site-*`/`--accent`); light + dark, mobile + desktop, CLS ≈ 0, contrast not regressed (`pnpm a11y:contrast`).

## Validation gates
1. **CI** green: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` across `apps/logistics`, `packages/branded-documents`, `packages/i18n`, `packages/intelligence`.
2. **RLS suite** (`pnpm test:rls`, ~7 cases): admin of account A blocked from B's shipments/contract/statement; both legacy `logistics_b2b_admins` and V3-57 `business_members` rosters grant access; non-member blocked from statement signed URL.
3. **Unit/integration** (~12 cases): CSV batch all-or-nothing (one bad row blocks all); rate-card quoting through the existing path; contract version bump + active-only invoice driver; reconciliation total ties out to invoices − confirmed payments; statement aggregation matches `b2b_account_id` shipments.
4. **e2e** (Playwright): admin logs in → dashboard lists own shipments → upload CSV batch → schedule pickup → review/sign contract → generate monthly invoice → download statement PDF → reconciliation balance correct → telemetry fires.
5. **Document render**: `logistics-b2b-statement.tsx` renders with `Henry Onyx Limited` legal entity + correct period totals.
6. **i18n gate**: hardcoded-text scanner clean; `surface:logistics-business` keys present in all 12 locales.
7. **Real-browser UI**: dashboard + upload + contract + reconciliation in light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` clean.

## Deployment gate
All validation gates green; the RLS suite green is mandatory (cross-account shipment isolation). The only required branch-protection check (`Lint, typecheck, test, build`) passing. Owner review of the dashboard + statement design from screenshots before merge. Branch `v3/74-enterprise-logistics-business-dashboard` off `origin/main` → PR → CI green → squash-merge; no force-push. 14-day soak on the CSV-batch + contract-driven invoicing + statement-export path before V3-78 exposes these primitives via API.

## Final report contract
`.codex-temp/v3-74-enterprise-logistics-business-dashboard/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline — the 3 `henry.logistics_business.*` events firing · deferred items — logistics API → V3-78, native operator dashboard → V3-87, payment capture → payments spine · pass-closure assertion).

## Self-verification
- [ ] S1: `logistics_b2b_accounts` linked to a V3-57 `business`; `is_logistics_b2b_member` honours both rosters; `pnpm test:rls` proves cross-account isolation.
- [ ] S2: authenticated dashboard lists only the account's shipments; empty/loading/no-data states truthful (V3-08); marketing content moved to `/business/overview`.
- [ ] S3: CSV bulk upload is all-or-nothing, quotes through the existing path, stamps `b2b_account_id`; pickup scheduling persisted; `henry.logistics_business.bulk_upload` fires.
- [ ] S4: contract + negotiated-rate management with version bump; signing audited; `henry.logistics_business.contract_signed` fires.
- [ ] S5: invoicing keyed to contract `billing_cycle` (kobo minor units, engine reused not reimplemented); statement PDF wired to a signed-URL export with `Henry Onyx Limited`; `henry.logistics_business.statement_generated` fires.
- [ ] S6: reconciliation ties out to invoices − provider-confirmed payments; no optimistic balance.
- [ ] S7: 3 `henry.logistics_business.*` events registered and firing with a business-actor block.
- [ ] Brand = Henry Onyx via `@henryco/config`; zero hardcoded domains; zero hardcoded strings; `surface:logistics-business` keys in 12 locales.
- [ ] CI + RLS + e2e + i18n + real-browser light/dark/mobile/desktop/CLS≈0/contrast all green.
- [ ] `.codex-temp/v3-74-enterprise-logistics-business-dashboard/report.md` written with all 9 sections.
