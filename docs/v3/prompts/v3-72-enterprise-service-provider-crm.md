# V3-72 — Partner & Enterprise: Service-Provider CRM

**Pass ID:** V3-72  ·  **Phase:** H (Partner & Enterprise)  ·  **Pillar:** P8 (Partner & Business)
**Dependencies:** V3-50 (Verified Provider Model), V3-57 (Business Profiles + Tools)  ·  **Effort:** L  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** —

---

## Role

You are the V3 Provider-CRM engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass gives a verified service provider a **lightweight CRM** over their own customer relationships: private customer notes, recurring-booking management, a performance view, and payout reconciliation that ties each payout to the specific bookings it settled. The line it must not cross: it operates only on the provider's own customers and bookings — it never exposes one provider's customer data to another, never mutates the booking engine itself (V3-51), and never moves money (V3-69). It is a relationship and reconciliation lens, not a booking or payout system.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/72-enterprise-service-provider-crm` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

V3-50 establishes the verified-provider model (provider profile, verification, scoring, service areas, availability) and the provider-side onboarding flow; V3-51 owns smart booking (slot picker, provider matching, recurring bookings, per-service cancellation policy). V3-57 supplies the `businesses` + `business_members` model so a provider can be a team rather than a single person; V3-68 computes the partner performance scorecard; V3-69 owns the `payouts` schema and rails. What no surface gives a provider today is a *customer-relationship view*: there is no place to keep a private note ("prefers morning slots, allergic to bleach, gate code 4471"), no consolidated list of recurring customers with pause/resume, and no way to see which completed bookings a given payout actually settled. Care today has bookings and the Fabric Care provider flows, but the relationship memory lives in the provider's head. This pass adds the CRM layer — notes, recurring management, a performance read-through, and booking-level payout reconciliation — strictly scoped to the provider's own customers, on top of the V3-50 provider identity and the V3-51 booking records.

## Mandatory scope

### S1 — CRM shell + provider scoping

New route group `apps/account/app/(account)/provider/crm/` (the provider-side surface lives in the account app where authenticated provider context resolves), or the care app provider workspace if that is where V3-50 placed the provider surface — follow V3-50's placement. The layout resolves the acting provider identity (a `provider_id` for a solo provider, or a `business_id` when the provider is a V3-57 business with `business_members`) and gates by membership. Every query in this pass is scoped to that identity.

```
provider/crm/
  page.tsx                 CRM home (recent customers, recurring count, next payout summary)
  customers/page.tsx       customer list (people this provider has served)
  customers/[customerId]/page.tsx   customer detail + notes timeline (S2)
  recurring/page.tsx       recurring-booking management (S3)
  performance/page.tsx     performance read-through (S4)
  reconciliation/page.tsx  payout ↔ booking reconciliation (S5)
```

### S2 — Customer notes

Private, provider-owned notes about a customer. These are **personal data about a third party** — they are visible only to the provider team, never to the customer, never to another provider, and are subject to V3-93 data-rights handling.

```sql
CREATE TABLE provider_customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL,                 -- references the V3-50 provider entity
  business_id UUID REFERENCES businesses(id),-- set when the provider is a V3-57 business
  customer_user_id UUID NOT NULL REFERENCES auth.users(id),
  author_user_id UUID NOT NULL REFERENCES auth.users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE provider_customer_notes ENABLE ROW LEVEL SECURITY;
-- A note is readable/writable only by members of the owning provider/business.
CREATE POLICY provider_customer_notes_team ON provider_customer_notes
  FOR ALL USING (
    (business_id IS NOT NULL
       AND business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid()))
    OR (business_id IS NULL AND author_user_id = auth.uid())
  ) WITH CHECK (
    (business_id IS NOT NULL
       AND business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid()))
    OR (business_id IS NULL AND author_user_id = auth.uid())
  );
```

- **CRUD** on notes from the customer detail surface; notes render as a reverse-chronological timeline with author + timestamp.
- **Shareable across the provider team.** When `business_id` is set, every `business_members` member of that business reads/writes the notes; a solo provider's notes are private to them.
- A provider may only open the detail page for a customer they have an actual booking relationship with (verified server-side against V3-51 bookings) — no browsing arbitrary users.

### S3 — Recurring-booking management

A read-and-control surface over V3-51's recurring bookings. This pass does **not** create or reschedule bookings (that is V3-51) — it lists recurring series and lets the provider pause/resume and bulk-message.

- **View all recurring customers.** List recurring booking series for this provider (customer, service, cadence, next occurrence, status) read from V3-51.
- **Pause / resume a series.** A pause/resume action that calls V3-51's series-state API (the CRM never writes booking rows directly; it invokes V3-51's owned mutation). Each pause/resume is audit-logged and respects the per-service cancellation policy V3-51 enforces.
- **Bulk-message recurring customers.** Compose one message and send to a selected set of recurring customers through the existing messaging path (`@henryco/messaging-thread` / `@henryco/chat-composer`). Rate-limited per provider; opt-out honoured; this is a relationship message, not marketing (transactional separation per V3-61). The AI draft assist here, if used, is the **metered** business-message-assist (V3-30) — not free.

### S4 — Performance dashboard (read-through)

Extends, does not duplicate, the V3-68 partner performance scorecard. The CRM performance surface reads V3-68's computed metrics for this provider (completion rate, response time, rating, dispute rate, trend, privacy-respecting peer rank) and presents them in the provider's CRM context with a deep-link to the full V3-68 scorecard. If V3-68 has not shipped, render a truthful "Performance metrics available once partner performance is enabled" state (i18n). No metric is recomputed here.

### S5 — Payout reconciliation

The distinctive value: tie each V3-69 payout to the specific completed bookings it settled, so a provider can answer "what was this payout for?" exactly.

- Read the provider's payouts from V3-69's `payouts` table and the completed bookings from V3-51.
- Build a reconciliation view: per payout, the list of bookings settled (booking ref, service, customer, completion date, amount minor), with the per-booking amounts summing to the payout amount minus `tax_withheld_minor` (V3-69's field). Surface any unreconciled delta explicitly — never hide a mismatch.
- All amounts BIGINT minor units, formatted via `@henryco/i18n/currency`. This surface is **read-only** — it reconciles, it never adjusts a payout or a booking. The mapping (which bookings a payout settled) is owned by V3-69's payout-creation logic; this surface reads that mapping. If V3-69 does not yet persist the booking↔payout link, this pass defines the read contract and renders a truthful "reconciliation detail pending payout settlement data" state.

### S6 — Telemetry

Extend `@henryco/observability` `HenryEventName` with exactly these three, mapped exhaustively:

```
henry.provider_crm.note_added
henry.provider_crm.recurring.paused
henry.provider_crm.bulk_message.sent
```

Emit `henry.provider_crm.note_added` on note creation, `henry.provider_crm.recurring.paused` on a series pause, `henry.provider_crm.bulk_message.sent` on a bulk message (payload includes recipient count). Every mutating action also writes `@henryco/observability/audit-log`.

## Out of scope

- Booking creation, slot picking, recurring-series creation/reschedule, cancellation-policy enforcement — V3-51 (this pass invokes V3-51's owned mutations; it never writes bookings).
- Provider onboarding, verification, scoring, service areas, availability — V3-50.
- Partner performance computation + contracts — V3-68 (read-through only).
- Payout rails, schedules, bank-account mutation — V3-69 (reconciliation reads only).
- Marketing campaigns + newsletters — V3-61 (bulk-message here is transactional, opt-out-respecting).

## Dependencies

- **Requires:** V3-50 (provider identity model + provider surface placement), V3-57 (`businesses` + `business_members` for team-shared notes).
- **Soft-reads:** V3-51 (recurring bookings + series state API), V3-68 (performance metrics), V3-69 (payouts + booking↔payout mapping), V3-30 (metered business-message assist for drafting).
- **Blocks:** nothing downstream depends on this pass directly.

## Inheritance

- V3-50 verified-provider entity; V3-57 `businesses` / `business_members`.
- V3-51 booking + recurring-series records and their mutation API.
- `@henryco/messaging-thread` / `@henryco/chat-composer` — the bulk-message send path.
- `@henryco/i18n/currency` — money formatting in reconciliation.
- `@henryco/observability` + `@henryco/observability/audit-log` — telemetry + audit.

## Implementation requirements

### Files

The `provider/crm/` route tree in S1; the migration `apps/account/supabase/migrations/<ts>_provider_customer_notes.sql` (the `provider_customer_notes` table + RLS); server actions for notes CRUD, recurring pause/resume (delegating to V3-51), and bulk-message send; the reconciliation read query; the three new events in `packages/observability/src/events.ts`.

### Trust / safety / compliance

Customer notes are third-party personal data: RLS restricts them to the owning provider/business team; they are flagged for V3-93 DSAR/deletion handling (a customer's deletion request must purge or anonymise notes about them); they are never shown to the customer or another provider. A provider may only open a customer they have a real booking relationship with (server-verified). Recurring pause/resume and bulk-message are audit-logged; bulk-message is rate-limited and opt-out-honouring. Reconciliation is strictly read-only and surfaces any unreconciled delta rather than masking it.

### Mobile + desktop parity

Mobile-friendly is a first-class requirement — providers are on-the-go (a cleaner checking the gate code on their phone at the door). The CRM home, customer detail + notes, and recurring list must be fully usable on web mobile (safe-area insets, keyboard avoidance per V3-09). Reconciliation tables may be desktop-primary with a responsive summary on mobile. The Expo super-app links out to the CRM in this pass.

### i18n

All labels, statuses, errors, note timestamps' relative-time copy, and the recurring-status terms flow through `@henryco/i18n`, namespace **`surface:provider-crm`**. Status copy and every error are typed copy keys; runtime DeepL (Pattern B) covers the other locales. No hardcoded user-facing strings.

### Brand & design system

The provider's division label (e.g. **"Henry Onyx Fabric Care"** for a Care provider) is sourced from `@henryco/config` (`company.ts`), never hardcoded. Every link resolves through `henryDomain()` / `getAccountUrl()` — zero literal `henrycogroup.com`. UI uses the locked division accent + design-system tokens only, Fraunces where editorial, light + dark, mobile + desktop, CLS ≈ 0, contrast not regressed. No payment behaviour is touched.

## Validation gates

1. Standard CI: typecheck, lint, test, build (the only required branch-protection context: `Lint, typecheck, test, build`).
2. **Notes CRUD suite** (≈12 specs): create/read/update/delete a note; team-shared notes visible to every `business_members` member; solo-provider notes private; a provider cannot open a customer they have no booking relationship with; RLS denies cross-provider note access.
3. **Recurring management smoke**: list recurring series for a seeded provider; pause/resume invokes V3-51's series-state API (not a direct booking write) and audit-logs; bulk-message sends to selected recurring customers, rate-limited, opt-out honoured.
4. **Reconciliation accuracy**: per-payout booking list sums to payout amount minus `tax_withheld_minor`; an injected mismatch surfaces an explicit unreconciled delta (not hidden); all amounts BIGINT minor units, formatted via `@henryco/i18n/currency`.
5. **Truthful degraded states**: V3-68-absent and V3-69-mapping-absent render honest disabled states (V3-08 rule).
6. **Real-browser** check (CRM home, customer detail, recurring) on web mobile + desktop: light + dark, CLS ≈ 0, `pnpm a11y:contrast` clean, V3-09 mobile ergonomics.

## Deployment gate

All gates green; the only required check (`Lint, typecheck, test, build`) passing; branch `v3/72-enterprise-service-provider-crm` off `origin/main` → PR → squash-merge (no force-push, no branch-protection bypass). **14-day soak**; monitor `henry.provider_crm.*` + audit-log, and watch the reconciliation deltas on the small provider cohort before general rollout.

## Final report contract

`.codex-temp/v3-72-enterprise-service-provider-crm/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion).

## Self-verification

- [ ] CRM shell scoped to the acting provider/business identity; every query identity-scoped.
- [ ] `provider_customer_notes` with team-vs-solo RLS; notes never visible to the customer or another provider; flagged for V3-93 deletion handling.
- [ ] Provider can only open customers they have a real booking relationship with (server-verified).
- [ ] Recurring pause/resume delegates to V3-51's series-state API (no direct booking writes); audit-logged; cancellation policy respected.
- [ ] Bulk-message sends via `@henryco/messaging-thread`/`chat-composer`, rate-limited, opt-out honoured, transactional (not marketing); optional draft assist is the metered V3-30.
- [ ] Performance surface is a read-through of V3-68 with a truthful disabled state when absent.
- [ ] Reconciliation ties payouts to settled bookings, sums correctly minus tax withheld, and surfaces any unreconciled delta; read-only; truthful state when V3-69 mapping absent.
- [ ] Three `henry.provider_crm.*` events added to `HenryEventName` and emitted; every mutation audit-logged.
- [ ] Mobile-first ergonomics (V3-09); division brand from `@henryco/config`; zero hardcoded domains/strings; tokens-only UI light+dark CLS≈0.
- [ ] Report written.
