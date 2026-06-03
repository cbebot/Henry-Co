# V3-58 — Product Expansion: Seller Academy

**Pass ID:** V3-58  ·  **Phase:** G (Product Expansion)  ·  **Pillar:** P1 (Products & Services), P8 (Business & Enterprise)
**Dependencies:** V3-56, V3-57  ·  **Effort:** M  ·  **Parallel-safe:** Y
**Owner gate:** none (fee-discount tier amounts read from D9 — confirm, don't re-litigate)  ·  **Risk class:** Money (tier-based platform-fee discounts touch take-rate)

---

## Role
You are the V3 Seller Academy engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass turns the Learn division into the seller-quality flywheel: a dedicated academy track that teaches a marketplace seller how to operate well, a deterministic tier-badge engine (Bronze/Silver/Gold) that fuses course completion with real transaction + rating signals, badge surfacing on the business profile and marketplace listings, and tier-keyed platform-fee discounts. The line you must not cross: badge tier and fee discount are **derived, never self-asserted** — every tier is recomputed server-side from verified completion + verified transaction/rating data, and any fee-discount amount is read from the ratified D9 config, never hardcoded.

## Project
| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/58-product-seller-academy` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
Henry Onyx Learn is a real division: `apps/learn/app` has `(public)`, `content`, `instructor`, `learner`, `admin`, and `analytics` route groups with course delivery already wired. Henry Onyx Marketplace already runs a seller path: `apps/marketplace/app/account/seller-application/{start,verification,review}/page.tsx` flags sellers, and the public storefront `apps/marketplace/app/(public)/store/[slug]/page.tsx` renders a seller's listings. V3-57 introduces the **business** entity (`businesses`/`business_members`) and a Henry-Onyx-branded business profile. V3-50 (verified provider model) supplies provider/seller quality scoring + transaction counts + ratings.

What is missing: there is no **structured curriculum aimed at sellers**, no **tier/badge model** that fuses learning with performance, and no mechanism to translate seller quality into a **platform-fee discount**. This pass builds exactly that on top of the existing Learn course primitives and V3-57's business profile — no new course-delivery engine, no new storefront chrome.

## Mandatory scope

### S1 — Seller academy course track in Learn
Author three academy courses as first-class Learn content (using the existing `apps/learn` content model — extend it, do not fork it), tagged `track = 'seller_academy'` so they group as a dedicated track and are excluded from the general catalogue's default browse:
1. **"Becoming a verified seller"** — foundational (storefront setup, listing quality, policy compliance, payout setup).
2. **"Optimizing your storefront"** — intermediate (merchandising, pricing, response time, dispute avoidance).
3. **"Premium seller best practices"** — advanced (scaling, fulfilment SLAs, customer retention, brand consistency).

Completion is recorded against the existing Learn completion store (verified-completion, not self-marked). Acceptance: the three courses appear in a `/academy` (or Learn `track=seller_academy`) view, enrol → progress → completion writes a verified completion record.

### S2 — Seller-tier badge engine (deterministic, server-derived)
New migration `supabase/migrations/<ts>_v3_58_seller_tiers.sql`:

```sql
create table public.seller_tiers (
  business_id   uuid primary key references public.businesses(id) on delete cascade,
  tier          text not null default 'none'
                  check (tier in ('none','bronze','silver','gold')),
  computed_at   timestamptz not null default now(),
  inputs        jsonb not null default '{}'::jsonb   -- snapshot of the signals that produced the tier
);
alter table public.seller_tiers enable row level security;
create policy seller_tiers_member_read on public.seller_tiers for select
  using (exists (select 1 from public.business_members m
                 where m.business_id = seller_tiers.business_id and m.user_id = auth.uid()));
-- Only the recompute RPC (SECURITY DEFINER) writes; no direct client write policy.
```
A `SECURITY DEFINER` function `recompute_seller_tier(business_id)` derives the tier from **verified inputs only**:
- **Bronze** — completed the foundational academy course.
- **Silver** — foundational + intermediate completed **and** ≥ 50 completed transactions.
- **Gold** — all three courses completed **and** ≥ 200 completed transactions **and** ≥ 4.5 average rating.

Transaction counts + ratings come from V3-50's quality data (read-only). The function snapshots its inputs into `inputs` jsonb for auditability and writes `computed_at`. It runs on course-completion, on transaction settlement, and on a daily reconcile cron through the existing workflow rails. A tier never goes up without the underlying signal; downgrades on signal loss (e.g., rating drops) are allowed and audited. Acceptance: unit tests prove each threshold boundary; no client can write `seller_tiers` directly.

### S3 — Badge surfacing
Render the earned tier badge on:
- the V3-57 business profile (`apps/account/app/(account)/business/[slug]/page.tsx` owner view + the public `store/[slug]` profile),
- marketplace listings authored by the business (badge chip on the listing card + PDP).

Badge labels and tooltips are i18n keys; the badge visual uses locked design-system tokens (no ad-hoc hex), light + dark, CLS ≈ 0. Acceptance: a Gold business shows the Gold badge on profile + listings; a `none`-tier business shows no badge (not a placeholder).

### S4 — Tier-keyed platform-fee discount (D9-config-driven)
**Read `docs/v3/DECISIONS-REQUIRED.md` D9 (monetization rates per division) before implementing — the discount amounts are owner-ratified config, not your invention; confirm the recorded answer, do not re-litigate.** Implement the discount as a **lookup into the pricing config**, never a hardcoded literal: extend `@henryco/pricing` (the governance-tables package) with a `sellerTierDiscount(tier, division)` resolver keyed off the ratified D9 take-rate table. The discount is applied at fee-computation time inside the existing pricing breakdown so it flows into the persisted breakdown and the receipt — it does **not** alter any money-movement code, idempotency, or ledger behaviour (payment-surface is behaviour-locked). If D9 is not yet ratified, ship the resolver wired to a `0%` default for every tier and gate live discounts behind the config landing — note this in the report. Acceptance: a Silver/Gold business's fee line reflects the configured discount in the breakdown; a `none`/Bronze business reflects `0%`; the ledger entries are unchanged in shape.

### S5 — Telemetry
Emit through `@henryco/intelligence` (envelope validated by `henryEventNameSchema`, `henry.<domain>.<noun>.<verb>`):
- `henry.seller.academy.enrolled`
- `henry.seller.academy.completed`
- `henry.seller.tier.upgraded`

`tier.upgraded` carries `{ businessId, fromTier, toTier }`. Add the three names to `HenryEventNames` in `packages/intelligence/src/index.ts`. (Downgrades reuse `tier.upgraded` with `fromTier > toTier` ordering captured in properties, or add `henry.seller.tier.downgraded` if a distinct event is cleaner — pick one and document it.)

## Out of scope
- General Learn courses + course-delivery engine (existing; this pass only adds the seller track).
- The seller business suite tooling — bulk listing, deal scheduling, payout management (V3-71).
- Course-completion → jobs-board pipeline + employer course-gating (V3-56 — this pass depends on it but does not rebuild it).
- The take-rate numbers themselves (owner decision D9; this pass consumes them).
- KYC verification of the seller identity (V3-24 / V3-57 verification fallback).

## Dependencies
**Depends on:** V3-56 (learn-to-earn employer tools / course-completion pipeline), V3-57 (business profile + `businesses` entity the tier attaches to). **Blocks:** V3-71 (seller business suite reads tier), and feeds V3-50's verified-provider quality narrative. Soft-blocked on **D9** for live fee discounts.

## Inheritance
- `apps/learn` content + verified-completion model — the academy courses extend it.
- V3-57 `businesses`/`business_members` + business profile — the badge attaches to a business.
- V3-50 quality scoring — transaction counts + ratings feed the tier engine.
- `@henryco/pricing` — fee-discount resolver added to the governance tables (D9-keyed).
- `@henryco/observability/audit-log` — tier changes + fee-discount config reads audited.
- `@henryco/intelligence` — telemetry envelope.
- `@henryco/i18n` — course titles, badge labels, tier names, fee-discount copy.

## Implementation requirements

### Files
- Learn content entries for the three academy courses (`track = 'seller_academy'`) + a `/academy` (or `track`-filtered) view in `apps/learn/app/(public)`.
- `supabase/migrations/<ts>_v3_58_seller_tiers.sql` (S2 table + RLS + `recompute_seller_tier` RPC).
- Cron/workflow hook calling `recompute_seller_tier` on completion + settlement + daily reconcile.
- Badge component in `@henryco/ui` (or marketplace components) rendered on profile + listings.
- `@henryco/pricing` extension: `sellerTierDiscount(tier, division)` resolver.
- `packages/i18n/src/seller-academy-copy.ts` (+ index export); `packages/intelligence/src/index.ts` (3 event names).

### Trust / safety / compliance
- Tier is **server-derived only** — no client write path to `seller_tiers`; the recompute RPC is `SECURITY DEFINER` and reads verified signals.
- Course completion is verified-completion (the existing Learn record), never self-asserted.
- `writeAuditLog` on every tier change (with the `inputs` snapshot) and on any fee-discount config application — money-adjacent.
- Fee discount changes the displayed/persisted fee breakdown only; it never touches money-movement, idempotency, webhook, or ledger code (payment-surface behaviour-locked).

### Mobile + desktop parity
Academy track browse, badges on profile + listings, and tier status render responsively on web mobile (per V3-09). Super-app: badges render through the public web export; native academy enrolment defers to V3-87 — state explicitly.

### i18n
All copy through `@henryco/i18n` namespace **`surface:seller-academy`** (Pattern A typed keys; Pattern B runtime fallback for non-en locales). Course titles, tier names (Bronze/Silver/Gold are translated display labels, the stored enum stays English), badge tooltips, and fee-discount explanations are translated. Zero hardcoded user-facing strings.

### Brand & design system
Henry Onyx brand via `@henryco/config` (Learn = "Henry Onyx Learn", Marketplace = "Henry Onyx Marketplace") — never "Henry & Co.", never hardcoded. Badges use locked design-system tokens (Learn/Marketplace accents from `company.ts`), Fraunces display where editorial, light + dark, CLS ≈ 0, `pnpm a11y:contrast` clean. Zero hardcoded domains.

## Validation gates
1. **CI** green: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.
2. **Tier-engine unit tests** (~10 cases): each Bronze/Silver/Gold threshold boundary (49 vs 50 txns, 4.49 vs 4.5 rating, partial-course completion), downgrade on signal loss, `inputs` snapshot correctness.
3. **RLS suite** (`pnpm test:rls`): non-member cannot read another business's `seller_tiers`; no client write path.
4. **Pricing test**: `sellerTierDiscount` resolves the D9-configured amount per tier/division; `none`/Bronze → 0%; ledger entry shape unchanged.
5. **e2e**: enrol → complete 3 courses → cross transaction/rating thresholds → tier recomputes to Gold → badge renders on profile + a listing → fee breakdown reflects the configured discount.
6. **i18n gate** passes; `surface:seller-academy` in 12 locales.
7. **Real-browser UI**: academy track + badges in light + dark, mobile + desktop, CLS ≈ 0, contrast clean.

## Deployment gate
All gates green. **Confirm D9 ratification before enabling non-zero fee discounts**; if D9 is unratified, ship with the 0% default and flag the live-discount enablement as a follow-up. Owner review of badge visuals from screenshots. Branch off `origin/main` → PR → CI green → squash-merge; no force-push. 14-day soak on the tier-recompute + fee-discount path.

## Final report contract
`.codex-temp/v3-58-product-seller-academy/report.md` with the standard 9 sections: exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline (the 3 `henry.seller.*` events) · deferred items (D9 live-discount enablement if unratified; native academy → V3-87) · pass-closure assertion.

## Self-verification
- [ ] S1: three seller-academy courses live in Learn (`track=seller_academy`) with verified completion.
- [ ] S2: `seller_tiers` + `recompute_seller_tier` `SECURITY DEFINER` RPC; tier derived from verified signals only; boundary tests pass.
- [ ] S3: tier badge renders on business profile + marketplace listings; `none` tier shows nothing (not a placeholder).
- [ ] S4: `sellerTierDiscount(tier, division)` resolves from ratified D9 config (0% default if unratified); fee breakdown reflects it; ledger shape unchanged.
- [ ] S5: 3 `henry.seller.*` telemetry events added to `HenryEventNames` and firing.
- [ ] D9 read + confirmed (not re-litigated); no hardcoded rates; brand = Henry Onyx via `@henryco/config`; zero hardcoded domains/strings; `surface:seller-academy` in 12 locales.
- [ ] CI + tier-engine + RLS + pricing + e2e + i18n + real-browser gates green.
- [ ] `.codex-temp/v3-58-product-seller-academy/report.md` written with all 9 sections.
