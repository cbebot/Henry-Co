# V3-75 — Partner & Enterprise: Bulk Invoicing + Team Roles + Company Admin

**Pass ID:** V3-75  ·  **Phase:** H (Partner & Enterprise)  ·  **Pillar:** P8 (Business & Enterprise), P2 (Wallet, Payments, Financial Spine)
**Dependencies:** V3-18, V3-57  ·  **Effort:** L  ·  **Parallel-safe:** N
**Owner gate:** none  ·  **Risk class:** Money, Compliance

---

## Role
You are the V3 Bulk Invoicing engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass turns a `business` into a fully governed company account: a **bulk invoicing** engine that batches recurring invoices per business on a schedule, a **fine-grained team-role permission matrix** layered over V3-57's `owner`/`admin`/`member` model, a **company-admin** role that can manage team + payment methods + contracts, and a hard rule that every sensitive action (issue a bulk invoice run, change a role, add an admin, attach a payment method) passes the V3-02 sensitive-action guard and is audited. The line you must not cross: money invariants are absolute — invoice amounts are BIGINT minor units, every batch issuance is idempotent, no permission ever silently widens, and no role change or money mutation is unattributed in the audit log.

## Project
| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/75-enterprise-bulk-invoicing-team-roles-admin` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
V3-57 shipped the business-identity spine: `public.businesses` (slug, legal_name, trading_name, country, `primary_partner_type`, status), `public.business_members` (role `owner`/`admin`/`member`, `primary key (business_id, user_id)`), `public.business_invitations` (`sha256(token)`, expiry), default-deny RLS, the `business_public_profile` view, the `accept_business_invitation` RPC, and the `resolveActingContext` / `setActingContext` acting-context layer on `@henryco/auth` (the context-switch route is `requireSensitiveAction`-guarded and re-verifies membership). V3-18 shipped the invoice spine: the unified PDF generator on `@henryco/branded-documents` → `invoice.tsx` (`InvoiceProps` with `lineItems`, `subtotalKobo`/`taxKobo`/`totalKobo`, `currency`, issuer with `rcNumber`/`vatNumber`, legal entity from `@henryco/config`), email delivery, storage, and signed-URL retrieval. The V3-02 sensitive-action guard (`requireSensitiveAction` server / `fetchWithSensitiveAction` client) is live on payment/identity/destructive routes.

What is missing — and what this pass delivers — is the **company-governance layer**. V3-57's three roles are coarse (`owner`/`admin`/`member`); there is no per-resource permission matrix, no concept of multiple company admins distinct from the single owner, and no audited role-change history. V3-18 generates one invoice at a time; there is no scheduled, batched, recurring invoice run for a business, no per-business invoice schedule, and no batch idempotency. This pass adds the permission matrix, the company-admin model, the bulk-invoicing engine, and the audit trail — built strictly on top of the V3-57 identity primitive and the V3-18 invoice generator, re-using both rather than re-implementing either.

## Mandatory scope

### S1 — Per-resource permission matrix (layered over V3-57 roles)
V3-57's `owner`/`admin`/`member` stays the base; this pass adds fine-grained capabilities without widening it. New migration `supabase/migrations/<ts>_v3_75_team_permissions.sql`:

```sql
-- Capability grants per member, per business resource. Default-deny:
-- absence of a row = no capability beyond the base role's floor.
create table public.business_member_permissions (
  business_id  uuid not null references public.businesses(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  resource     text not null check (resource in
                 ('invoicing','team','payment_methods','contracts','analytics','listings','bookings')),
  capability   text not null check (capability in ('read','write','admin')),
  granted_by   uuid not null references auth.users(id),
  granted_at   timestamptz not null default now(),
  primary key (business_id, user_id, resource)
);

-- Immutable audit of every role / permission change.
create table public.business_role_events (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  actor_user_id   uuid not null references auth.users(id),
  target_user_id  uuid not null references auth.users(id),
  change_type  text not null check (change_type in
                 ('role_changed','permission_granted','permission_revoked','admin_added','admin_removed')),
  before       jsonb,
  after        jsonb,
  occurred_at  timestamptz not null default now()
);

alter table public.business_member_permissions enable row level security;
alter table public.business_role_events         enable row level security;

-- Members read their own business's permission grid.
create policy bmp_member_read on public.business_member_permissions for select
  using (exists (select 1 from public.business_members m
                 where m.business_id = business_member_permissions.business_id and m.user_id = auth.uid()));

-- Only owner/admin mutate grants (writes route through a SECURITY DEFINER RPC that also writes the audit row).
create policy bmp_admin_write on public.business_member_permissions for all
  using (exists (select 1 from public.business_members m
                 where m.business_id = business_member_permissions.business_id and m.user_id = auth.uid()
                   and m.role in ('owner','admin')));

create policy bre_member_read on public.business_role_events for select
  using (exists (select 1 from public.business_members m
                 where m.business_id = business_role_events.business_id and m.user_id = auth.uid()));
```
A SECURITY DEFINER RPC `set_member_permission(p_business_id, p_target_user, p_resource, p_capability, p_actor)` is the **only** write path: it verifies the actor is `owner`/`admin`, applies the grant, and writes a `business_role_events` row atomically (no grant without an audit row). A server helper `hasCapability(ctx, resource, capability)` resolves a member's effective capability (base-role floor ∪ explicit grants) and is the gate every protected route calls. Acceptance: `pnpm test:rls` proves a `member` without an `invoicing:write` grant cannot issue invoices; an audit row exists for every grant.

### S2 — Company-admin model
The `owner` is singular per business (V3-57). This pass formalises **multiple company admins** distinct from the owner:
- An `admin` role member with the `team:admin` and `payment_methods:admin` capabilities is a "company admin" — can manage team, payment methods, and contracts, but cannot transfer ownership or delete the business (owner-only, sensitive-action-guarded).
- `admin_added` / `admin_removed` changes go through `set_member_permission` (S1) and emit `henry.business.admin_added`.
- The owner-only ceiling (ownership transfer, business deletion) requires `requireSensitiveAction` **and** the `owner` base role — an admin capability never satisfies it.
Acceptance: an admin can add a second admin (audited, telemetry fires) but cannot delete the business or transfer ownership; the owner-only actions 403 for any non-owner even with admin capabilities.

### S3 — Bulk invoicing engine
A scheduled, idempotent batch invoice run per business, built on the V3-18 generator. New migration `supabase/migrations/<ts>_v3_75_bulk_invoicing.sql`:

```sql
-- A per-business recurring invoice schedule (which customers, what cadence, what line-item source).
create table public.business_invoice_schedules (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  cadence       text not null check (cadence in ('monthly','quarterly','manual')),
  next_run_at   timestamptz,
  line_source   text not null,             -- resolver key: which division/contract feeds line items
  currency      text not null,             -- ISO-4217; validated against @henryco/i18n/currency
  status        text not null default 'active' check (status in ('active','paused','ended')),
  created_by    uuid not null references auth.users(id),
  created_at    timestamptz not null default now()
);

-- One row per batch issuance; the idempotency anchor.
create table public.business_invoice_runs (
  id               uuid primary key default gen_random_uuid(),
  schedule_id      uuid references public.business_invoice_schedules(id) on delete set null,
  business_id      uuid not null references public.businesses(id) on delete cascade,
  period_label     text not null,           -- e.g. '2026-06'
  idempotency_key  text not null,           -- client/cron-supplied UUIDv4
  invoice_count    int  not null default 0,
  total_minor      bigint not null default 0 check (total_minor >= 0),  -- BIGINT minor units (A4)
  currency         text not null,
  status           text not null default 'pending'
                     check (status in ('pending','issued','partially_failed','failed')),
  issued_by        uuid references auth.users(id),
  issued_at        timestamptz,
  created_at       timestamptz not null default now(),
  unique (business_id, idempotency_key)     -- A1: idempotent batch issuance
);
```
The engine resolves the period's billable line items via the `line_source` resolver (e.g. logistics monthly shipments from V3-74, marketplace seller fees, recurring service charges), groups them per customer, and calls the V3-18 single-invoice generator once per customer **inside one run**, then delivers each invoice by email with a payment link + deadline. The `unique (business_id, idempotency_key)` makes a retried run a no-op — never a double-bill. Amounts are BIGINT minor units end-to-end; the run total equals the sum of its invoice totals (asserted). A run is issued only by a member with `invoicing:write` and behind `requireSensitiveAction`. Acceptance: re-issuing a run with the same `idempotency_key` produces zero new invoices; a partial provider/email failure marks `partially_failed` and records which invoices failed (no silent loss).

### S4 — Surfaces
- **Bulk invoicing** at `apps/account/app/(account)/business/[slug]/invoicing/page.tsx`: schedule management (create/pause/end), run history with per-run status, and a "Issue run now" action (capability + sensitive-action gated). Tiles obey the V3-08 truth rule (no-data vs loading vs nothing-due).
- **Team roles** at `apps/account/app/(account)/business/[slug]/team/roles/page.tsx`: the permission matrix UI (member × resource × capability), role-change history from `business_role_events`. Owner/admin gated; the grid reflects effective capability, not just base role.
- **Company admin** controls in the team surface: add/remove admin, manage payment methods (attach/detach — the money-method binding is sensitive-action guarded), review contracts.
All money strings render through the payment surface's i18n; the invoice legal entity is `Henry Onyx Limited`. Acceptance: every protected control is hidden/disabled when `hasCapability` is false and 403s server-side if called directly.

### S5 — Telemetry
Add three event names to the intelligence registry (`packages/intelligence/src/index.ts`, validated by `henryEventNameSchema`, shape `henry.<domain>.<noun>.<verb>`), each carrying `{ businessId }`, a business-actor block, and for the invoice event the run's `{ invoiceCount, totalMinor, currency }`:
```
henry.business.bulk_invoice.generated    henry.business.team_role_changed
henry.business.admin_added
```

## Out of scope
- The business-account public API (multi-user accounts, team-role API, analytics access) — V3-80 (this pass is its prerequisite; it consumes this permission model).
- Standalone consumer single-invoice generation, the PDF template, email delivery, signed-URL storage — V3-18 owns the engine; this pass batches and schedules it, never re-implements it.
- The `businesses` / `business_members` / `business_invitations` primitive and acting-context — V3-57.
- Payment **capture** / provider routing / ledger truth — the payments spine (V3-13/15/17). This pass issues invoices with payment links; it does not capture funds.
- Tax computation — V3-21 (this pass carries the `taxKobo` the invoice generator already supports; it does not compute tax).
- Per-division monetization rates — D9 / V3-69 territory; the `line_source` resolver reads rates from the owning division, never hardcodes them.

## Dependencies
**Depends on:** V3-57 (`businesses` / `business_members` / acting-context), V3-18 (invoice generator + delivery + storage). **Blocks:** V3-80 (business-account API consumes this permission matrix + company-admin model). **Sequential (Parallel-safe: N):** this pass mutates the shared `business_members` governance surface; it must not run concurrently with another pass editing the same identity/permission tables.

## Inheritance
- V3-57: `businesses`, `business_members`, `business_invitations`, `business_public_profile` view, `accept_business_invitation` RPC, `resolveActingContext`/`setActingContext` on `@henryco/auth`.
- V3-18: the `invoice.tsx` branded-document template, the invoice generator, email delivery, signed-URL storage.
- V3-02: `requireSensitiveAction` (server) / `fetchWithSensitiveAction` (client) on every sensitive control.
- `@henryco/payment-surface` — money-string primitives (behaviour-locked; style/label only here).
- `@henryco/i18n/currency` — `isSupportedCurrency` / minor-unit math for the run currency.
- `@henryco/observability/audit-log` — `writeAuditLog` on every role/permission/admin/payment-method/invoice-run mutation.
- `@henryco/intelligence` — telemetry envelope + event-name registry.
- `@henryco/config` — `company.ts` legal entity, `henryDomain()` / `getAccountUrl()` for invoice + payment links.

## Implementation requirements

### Files
- `supabase/migrations/<ts>_v3_75_team_permissions.sql` (S1 permissions + role-events + `set_member_permission` RPC).
- `supabase/migrations/<ts>_v3_75_bulk_invoicing.sql` (S3 schedules + runs + idempotency).
- `packages/auth/src/server/has-capability.ts` (S1 `hasCapability` effective-capability resolver, + barrel export).
- `apps/account/app/api/business/invoicing/runs/route.ts` (issue run — capability + `requireSensitiveAction` gated, idempotency-keyed).
- `apps/account/app/api/business/team/permissions/route.ts` (grant/revoke via the RPC).
- `apps/account/app/(account)/business/[slug]/invoicing/page.tsx`, `.../team/roles/page.tsx`.
- `packages/i18n/src/business-copy.ts` extension (invoicing + roles keys); `packages/intelligence/src/index.ts` (3 event names).

### Trust / safety / compliance
Default-deny everywhere: a member has no capability beyond the base-role floor without an explicit grant. Every permission/role/admin mutation flows through `set_member_permission` (S1), which writes an immutable `business_role_events` audit row atomically — no grant without an audit record. Every sensitive control (issue run, change role, add admin, attach payment method, ownership transfer, business deletion) is wrapped in `requireSensitiveAction` and re-verifies capability + acting-context server-side; the cookie never widens authority. **Money invariants are absolute:** invoice + run amounts are BIGINT minor units (A4); batch issuance is idempotent on `unique(business_id, idempotency_key)` (A1); a run's total equals the sum of its invoice totals; partial failures are recorded, never silently dropped; status is provider/email-confirmed truth, never optimistic. The invoice legal entity is `Henry Onyx Limited` (must match the CAC entity for payment compliance). This pass embodies the ANTI-CLONE governance principles: server-side authority on every money/permission decision (no client-trusted capability), and full attribution of every actor on every mutation.

### Mobile + desktop parity
Company-admin governance (permission matrix, bulk-invoicing schedules, run history) is desktop-primary. The invoice/payment-link recipient surface is mobile-first and verified on web mobile (safe-area, sticky nav, modal escape per V3-09). Super-app: company-admin governance is deferred to the mobile-parity wave (V3-87) — state explicitly; do not silently skip.

### i18n
All copy through `@henryco/i18n`, namespace **`surface:business`** (extend `packages/i18n/src/business-copy.ts`) for the governance chrome and **`surface:payments`** for any money/invoice string. Permission/resource/capability labels, role-change history copy, run statuses, schedule cadences, and invoice/email strings are Pattern A typed keys; Pattern B `translateSurfaceLabel` covers the 11 non-en locales. Zero hardcoded user-facing strings.

### Brand & design system
Henry Onyx brand correctness via `@henryco/config` (`COMPANY.group.name`) — never the retired "Henry & Co.". The invoice/receipt legal entity is `Henry Onyx Limited` from `company.ts` `legalName` (CAC-matched). Invoice payment links and any callback resolve through `getAccountUrl()` / `henryDomain()` — never a literal `henrycogroup.com`. The payment-surface money primitives are behaviour-locked (style/label only). Design-system tokens only (Fraunces where editorial, locked `--site-*`/`--accent`); light + dark, mobile + desktop, CLS ≈ 0, contrast not regressed (`pnpm a11y:contrast`).

## Validation gates
1. **CI** green: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` across `apps/account`, `packages/auth`, `packages/branded-documents`, `packages/i18n`, `packages/intelligence`.
2. **RLS suite** (`pnpm test:rls`, ~10 cases): member without `invoicing:write` cannot issue a run; non-owner/admin cannot grant permissions; member of business A blocked from B's permissions/role-events/runs; owner-only ceiling (ownership transfer, deletion) 403s for admins.
3. **Money-correctness suite** (~12 cases): run idempotency (same `idempotency_key` → zero new invoices); run total = Σ invoice totals; BIGINT minor-unit math (no float); currency validated against `@henryco/i18n/currency`; partial-failure marks `partially_failed` and records failed invoices.
4. **Permission-matrix suite** (~10 cases): effective capability = base-role floor ∪ grants; every grant produces an audit row; `set_member_permission` is the only write path.
5. **e2e** (Playwright): owner creates a schedule → grants a member `invoicing:write` → member issues a run (sensitive-action gated) → invoices delivered with payment links → retry is a no-op → role-change + admin-add audited → telemetry fires.
6. **i18n gate**: hardcoded-text scanner clean; `surface:business` + `surface:payments` keys present in all 12 locales.
7. **Real-browser UI**: invoicing + role matrix in light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` clean.

## Deployment gate
All validation gates green; the RLS + money-correctness suites green are mandatory (money + identity surface). The only required branch-protection check (`Lint, typecheck, test, build`) passing. Owner review of the bulk-invoicing + permission-matrix design from screenshots before merge. Branch `v3/75-enterprise-bulk-invoicing-team-roles-admin` off `origin/main` → PR → CI green → squash-merge; no force-push. Because this pass issues real invoices with payment links, a 14-day soak on the bulk-run idempotency + permission-enforcement path is required before V3-80 exposes the permission model via API.

## Final report contract
`.codex-temp/v3-75-enterprise-bulk-invoicing-team-roles-admin/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence — including the money-correctness suite · smoke · live verification · telemetry baseline — the 3 `henry.business.*` events firing · deferred items — business-account API → V3-80, tax computation → V3-21, payment capture → payments spine, native governance → V3-87 · pass-closure assertion).

## Self-verification
- [ ] S1: per-resource permission matrix with default-deny; `set_member_permission` is the only write path and writes an audit row atomically; `hasCapability` resolver gates every protected route; `pnpm test:rls` proves a member without a grant cannot issue invoices.
- [ ] S2: company-admin model — admins manage team/payment-methods/contracts; owner-only ceiling (ownership transfer, deletion) 403s for admins; `henry.business.admin_added` fires.
- [ ] S3: bulk-invoicing engine reuses the V3-18 generator; idempotent on `unique(business_id, idempotency_key)`; run total = Σ invoice totals in BIGINT minor units; partial failures recorded.
- [ ] S4: invoicing + role-matrix surfaces; every protected control hidden/disabled without capability and 403s server-side; V3-08 truthful tiles.
- [ ] S5: 3 `henry.business.*` events registered and firing with business-actor + run metrics.
- [ ] Every sensitive control behind `requireSensitiveAction`; every role/money mutation audited via `writeAuditLog`.
- [ ] Brand = Henry Onyx via `@henryco/config`; invoice legal entity `Henry Onyx Limited` (CAC-matched); zero hardcoded domains; zero hardcoded strings; `surface:business` + `surface:payments` keys in 12 locales.
- [ ] CI + RLS + money-correctness + permission-matrix + e2e + i18n + real-browser light/dark/mobile/desktop/CLS≈0/contrast all green.
- [ ] `.codex-temp/v3-75-enterprise-bulk-invoicing-team-roles-admin/report.md` written with all 9 sections.
