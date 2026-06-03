# V3-64 — Product Expansion: Logistics Network Maturity

**Pass ID:** V3-64  ·  **Phase:** G (Product Expansion)  ·  **Pillar:** P1 (Service Breadth)
**Dependencies:** V3-12 (Foundation Lock acceptance — CERTIFIED, PR #168)  ·  **Effort:** L  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** —

---

## Role

You are the V3 logistics-network engineer for Henry Onyx. You execute exactly this one pass, then stop and report. The logistics division already has the operator spine — rider/dispatcher/manager/owner workspaces, quote→book→track→POD, a multi-leg shipment graph, and a fleet model. This pass matures it into a real network: multi-rider route optimization that assigns deliveries to riders by proximity + capacity + time-window, cross-division shipment bundling, polished real-time customer tracking, and SLA enforcement where a breach triggers a refund through the money spine. The line you must not cross: the **SLA-breach refund is real money** — it flows only through the behavior-locked `@henryco/payment-router` / `@henryco/payment-surface` as an idempotent, provider-confirmed, ledger-true refund (never an optimistic UI credit), and the customer tracking surface never exposes a rider's precise home location or any data beyond the operationally necessary (name, photo, rating, live ETA). Routing is an operator-side optimization; it never fabricates GPS the rider app did not post.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/64-product-logistics-network-maturity` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

V3 PASS 21 shipped the logistics operator platform; this pass adds the network-intelligence layer on top of it.

- **Shipment + leg graph:** `public.logistics_shipments` (the `LogisticsShipment` shape in `apps/logistics/lib/logistics/types.ts`: `trackingCode`, `serviceType ∈ {same_day,scheduled,dispatch,inter_city,business_route}`, `lifecycleStatus` over a 14-state machine, `paymentStatus`, `zoneId`, `weightKg`, `sizeTier`, `urgency`, `scheduledPickupAt/DeliveryAt`, `assignedRiderUserId`, `pricingBreakdown` with `promiseWindowHours`/`promiseConfidence`, `requiresPod`) and `public.logistics_shipment_legs` (multi-leg pickup→handoff graph: `leg_index`, `origin/dest_kind`, `*_address_snapshot jsonb`, `status`, `rider_user_id`, `vehicle_id`, `eta_at`, RLS scoping customer→own, rider→assigned, staff→all).
- **Fleet model:** `public.logistics_fleet_vehicles` (`vehicle_type`, `capacity_kg`, `capacity_volume_m3`, `status`), `public.logistics_fleet_riders` (`user_id`, `status`, `primary_zone_id`, `trust_score`), `public.logistics_rider_assignments` (rider × vehicle × shift window). `public.logistics_zones` (`LogisticsZone`: `city`, `region`, `baseFee`, `etaHoursMin/Max`).
- **Quote/booking + POD:** `public.logistics_quotes` (24h persistent quote ledger, `total_minor bigint`, `currency`, hydrates `/book`), `public.logistics_pod` (signature/photo/code/hybrid + geo), `public.logistics_claims`, `public.logistics_b2b_accounts`, and a realtime publication. Routes: `app/api/logistics/{quote,book,pod,claims}/route.ts`, `app/api/logistics/dispatch/assign/route.ts`, `app/api/logistics/track/[code]/route.ts`. Customer tracking: `components/tracking/{LogisticsTimeline,TrackingMapPanel,RecentShipmentCards}.tsx`; map vendor in `lib/logistics/map-provider.ts`.
- **Ops automation + SLA today:** `lib/logistics/automation.ts` runs an idempotent stale-shipment cron (flags idle shipments, opens issues — fingerprinted, never spoofs GPS) via `app/api/cron/logistics-automation/route.ts`. The manager SLA page (`app/(staff)/manager/sla/page.tsx`) is **read-only**: an on-time delivered-% by zone view, color-graded at 80/90%. There is **no per-tier delivery promise, no breach detection, and no breach→refund link**.
- **The gap this pass closes:** assignment is one-rider-at-a-time (`dispatch/assign`); there is no multi-delivery route optimization, no capacity/time-window batching, no cross-division bundling, no live customer ETA stream, and the SLA surface only *grades* the past — it does not *enforce* a promise. V3-64 adds the routing optimizer, the bundle model, the live tracking polish, and the SLA promise→breach→refund chain.

## Mandatory scope

### S1 — Multi-rider route optimization

A server-side optimizer that assigns a batch of pending deliveries to available riders by proximity + capacity + time-window. New module `apps/logistics/lib/logistics/routing.ts` + a migration `apps/logistics/supabase/migrations/<ts>_logistics_routing.sql`:

```sql
create table public.logistics_routes (
  id uuid primary key default gen_random_uuid(),
  rider_user_id uuid references auth.users (id) on delete set null,
  vehicle_id uuid references public.logistics_fleet_vehicles (id) on delete set null,
  zone_id uuid references public.logistics_zones (id),
  status text not null default 'planned',          -- planned | dispatched | in_progress | completed | cancelled
  planned_for timestamptz not null,
  total_legs int not null default 0,
  total_weight_kg numeric not null default 0,
  optimization_meta jsonb not null default '{}'::jsonb,  -- algorithm version, score, inputs hash (auditable)
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create table public.logistics_route_stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.logistics_routes (id) on delete cascade,
  leg_id uuid not null references public.logistics_shipment_legs (id) on delete cascade,
  stop_index int not null,                          -- optimized visit order
  planned_eta_at timestamptz,
  status text not null default 'pending',
  unique (route_id, stop_index),
  unique (route_id, leg_id)
);
-- RLS mirrors logistics_shipment_legs: service-role full; rider reads/updates own route + stops; staff is_staff_in('logistics') full.
```

The optimizer respects: rider `primary_zone_id` + `logistics_rider_assignments` shift window (a rider only gets a route inside their shift), `logistics_fleet_vehicles.capacity_kg` / `capacity_volume_m3` (a route never exceeds the assigned vehicle's capacity), the shipment `urgency` + `scheduledPickupAt/DeliveryAt` time-windows (rush before standard; promised windows honored), and proximity (minimize total travel, greedy nearest-neighbor with a 2-opt improvement pass is sufficient — document the algorithm + version in `optimization_meta`). It is **advisory + dispatcher-confirmed**: the optimizer proposes a route; a dispatcher reviews and confirms on the dispatcher workspace before it dispatches (never auto-dispatches a rider without a human gate). Distance comes from the existing map provider (`lib/logistics/map-provider.ts`) — no second vendor. Pure functions are unit-tested with fixture deliveries.

### S2 — Cross-division shipment bundling

Bundle independently-created shipments that share a destination + time-window into one rider route, even across divisions (a marketplace order delivery + a care-service equipment shipment to the same address in the same window):

- A `public.logistics_shipment_bundles` table (`id`, `bundle_key`, `destination_hash` derived from the normalized drop-off + window, `status`, `created_at`) and a `bundle_id` nullable FK on `logistics_shipments`. The `destination_hash` is computed from the normalized drop-off address + the overlapping delivery window — only shipments that genuinely converge bundle.
- A bundling candidate detector (extend `lib/logistics/automation.ts` cron pattern, idempotent + fingerprinted): finds same-destination/same-window pending shipments across divisions and proposes a bundle. Bundling is **opt-in per the receiving customer** where the shipments belong to different customers (never silently co-mingle two customers' parcels without consent); same-customer multi-division shipments bundle automatically. Bundled legs feed S1 as a single route segment.
- Telemetry: `henry.logistics.bundle.created` on bundle formation with `{ shipment_count, divisions, zone }`.

### S3 — Customer tracking polish (real-time)

Elevate the customer-facing track surface (`components/tracking/*` + `app/track/page.tsx` + `app/api/logistics/track/[code]/route.ts`):

- **Real-time ETA updates** streamed via the existing Supabase realtime publication on `logistics_shipment_legs` / route stops — the ETA the customer sees is the live `planned_eta_at` / `eta_at`, updated as the route progresses, never a static estimate. Falls back gracefully to the last-known ETA when no live signal (honest "as of <time>" labeling, never a fake live indicator).
- **In-app map view** of the active leg using `TrackingMapPanel.tsx` + `map-provider.ts` — shows the rider's **last posted GPS breadcrumb only** (`LogisticsTrackingPoint`, real coordinates the rider app posted; empty until posted — never spoofed) and the drop-off pin. Never the rider's home; only their live in-transit position during an active delivery.
- **Rider identity card** — photo + display name + rating (`trust_score`) + vehicle type from `logistics_fleet_riders`, shown only while the leg is `in_transit`/`out_for_delivery`. No phone-number exposure beyond the existing masked-contact path.
- All responsive, mobile-first; CLS ≈ 0 (reserve map height); degrades to the timeline (`LogisticsTimeline.tsx`) if the map fails.

### S4 — SLA enforcement (promise → breach → refund)

Turn the read-only SLA view into an enforced promise with a money consequence:

- A `public.logistics_sla_policies` table (`service_type`, `tier ∈ {same_day,next_day,scheduled}`, `promise_window_hours`, `breach_refund_pct` or `breach_refund_minor`, `currency`, `is_active`) — owner/finance-authored, the per-tier promise. RLS: public read of the *promise* (so the booking surface can display it), staff/service-role write.
- On booking, persist the resolved promise (deadline timestamp) on the shipment (reuse `pricingBreakdown.promiseWindowHours`; persist a concrete `sla_deadline_at`). A breach-detection cron (extend the logistics-automation pattern, idempotent + fingerprinted) marks shipments delivered after `sla_deadline_at` (or still undelivered past it) as **SLA-breached** and opens a `logistics_issues` row of type `sla_breach`.
- **Breach → refund** flows only through the money spine: the refund is initiated via `@henryco/payment-router` `refund()` against the original `payment_intents` row, idempotent (keyed on `(shipment_id, sla_breach)`), ledger-true, provider-confirmed; the customer sees the refund via the behavior-locked `@henryco/payment-surface`. **No optimistic credit** — `paymentStatus` flips to `refunded` only on provider confirmation. Every refund is `requireSensitiveAction`-gated (on the staff approval path where the policy requires review) and audit-logged via `@henryco/observability/audit-log`. The manager SLA page (`app/(staff)/manager/sla/page.tsx`) gains a per-tier breach + refund-issued view alongside the existing on-time %.
- Telemetry: `henry.logistics.sla.breach` on detection with `{ service_type, tier, hours_late, refund_minor, currency }`.

### S5 — Telemetry + observability

Register in the `HenryEventNames` registry and emit via `@henryco/intelligence` (validated by `henryEventNameSchema`):
- `henry.logistics.routing.optimized` (S1 — a route plan is produced) with `{ rider_count, delivery_count, zone, algorithm_version }`.
- `henry.logistics.bundle.created` (S2).
- `henry.logistics.sla.breach` (S4).

Owner/manager observability: routes planned vs dispatched, average deliveries-per-route (the bundling efficiency signal — measured against single-delivery baseline), bundle rate, SLA breach rate per tier, and total breach-refund value over the window.

## Out of scope

- The **logistics public API** (quote/book/track/cancel + signed callbacks) — **V3-78** (this pass blocks it: the API exposes this matured network).
- The **B2B logistics business dashboard** (contracts, bulk shipments, statements) — **V3-74** (this pass blocks it).
- The payment-router contract, providers, refund engine internals, and ledger — **V3-13/15/19/17**; this pass *consumes* `refund()` and the payment surface, never modifies money behavior.
- Predictive workload/quality scoring of riders — **V3-41**.
- The verified-provider model — **V3-50** (logistics riders are operator-side here, not marketplace providers).

## Dependencies

Depends on **V3-12** (Foundation Lock — CERTIFIED) and consumes **V3-13/15** (`@henryco/payment-router` `refund()` + `payment_intents`) for the S4 breach refund. **Blocks V3-74** (B2B dashboard reads the bundle + SLA + route truth) and **V3-78** (the logistics API exposes routing/tracking/SLA). The S4 refund path requires a live payment provider (Paystack, V3-15) to be active in production; until then SLA-breach refunds are recorded as owed and queued (no silent drop), and the cron is dormant for the live-refund step.

## Inheritance

- The logistics schema — `logistics_shipments`, `logistics_shipment_legs`, `logistics_fleet_vehicles/riders/assignments`, `logistics_zones`, `logistics_quotes`, `logistics_pod`, `logistics_issues`, the realtime publication.
- `apps/logistics/lib/logistics/` — `automation.ts` (idempotent cron pattern), `data.ts` / `write.ts`, `map-provider.ts`, `pricing.ts`, `types.ts`, `notify-customer.ts`.
- `components/tracking/{LogisticsTimeline,TrackingMapPanel,RecentShipmentCards}.tsx`.
- `@henryco/payment-router` (`refund()`) + `@henryco/payment-surface` (behavior-locked) for the SLA refund (V3-13/15).
- `@henryco/observability` — `audit-log` on the refund + the cron pattern; `@henryco/intelligence` analytics envelope.
- `@henryco/i18n` — `translateSurfaceLabel` / `resolveLocalizedDynamicField` (the established logistics i18n pattern).
- `@henryco/config` — division names + every URL via `henryDomain('logistics')` / `henryWebRoot()` / `getAccountUrl()`.

## Implementation requirements

### Files

- `apps/logistics/supabase/migrations/<ts>_logistics_routing.sql` (S1), `<ts>_logistics_bundles.sql` (S2), `<ts>_logistics_sla_policies.sql` (S4)
- `apps/logistics/lib/logistics/routing.ts` (new — optimizer) + `routing.test.ts`
- `apps/logistics/lib/logistics/bundling.ts` (new) + bundle detector in the automation cron
- `apps/logistics/lib/logistics/sla.ts` (new — promise resolution + breach detection + refund initiation)
- Dispatcher route-review/confirm UI on `app/(staff)/dispatcher/` (S1)
- Real-time tracking polish in `components/tracking/*` + `app/track/page.tsx` + `app/api/logistics/track/[code]/route.ts` (S3)
- Manager SLA breach/refund view extension in `app/(staff)/manager/sla/page.tsx` (S4)
- Breach-detection + bundling + routing cron handlers under `app/api/cron/logistics-automation/route.ts` (extend) (S2/S4)
- i18n copy under `surface:logistics`

### Trust / safety / compliance

The SLA-breach refund is **real money**: it flows only through `@henryco/payment-router` `refund()` against the original `payment_intents`, idempotent (keyed on `(shipment_id, sla_breach)` so a re-running cron never double-refunds), provider-confirmed, ledger-true; `paymentStatus → refunded` only on provider confirmation — never an optimistic UI credit. The staff refund-approval path (where the policy requires review) is `requireSensitiveAction`-gated; every refund is audit-logged. Riders are identity-verified (`logistics_fleet_riders.user_id` → `auth.users`); the customer surface exposes only operationally-necessary rider data (name, photo, rating, live in-transit GPS), never a home address or unmasked phone. Routing/bundling never spoof GPS — tracking shows only real rider-posted breadcrumbs (`LogisticsTrackingPoint`). L8 insurance coverage applies to bundled cross-division shipments (the bundle does not change liability). RLS on the new tables mirrors `logistics_shipment_legs` (customer→own, rider→assigned, staff→all).

### Mobile + desktop parity

The customer tracking surface is **mobile-first** (most tracking happens on a phone): live ETA, the map, and the rider card render correctly mobile + desktop, light + dark, CLS ≈ 0 (reserved map height), degrading to the timeline on map failure. The rider app surfaces (route, stops, navigation hand-off) are responsive for the rider's phone. The dispatcher route-review UI is desktop staff-shell. Forward: the Expo super-app consumes the same `track/[code]` data + realtime channel for native tracking (V3-87) — note the contract, build no native screen here.

### i18n

Namespace `surface:logistics` (extend the existing logistics copy): route/stop status names, the dispatcher route-review labels, live-ETA + "as of <time>" labeling, the rider-card labels, the SLA tier promises + breach + "refund issued" copy, and all empty/loading/error states flow through `@henryco/i18n` via the established `translateSurfaceLabel` / `resolveLocalizedDynamicField` pattern. Zone names, city names, and rider names are dynamic — machine-translate via `resolveLocalizedDynamicField`, never hardcode. 12 locales.

### Brand & design system

Brand strings ("Henry Onyx Logistics") read from `@henryco/config` (`COMPANY.divisions['logistics']`) — never hardcoded, never "Henry & Co." (the existing `automation.ts` `actor_name` literal "Henry & Co. Logistics automation" is internal/system actor metadata, not a user-facing string; if this pass touches that line, source it from config). Customer tracking + booking surfaces use the locked logistics tokens (`--logistics-*` / `--accent`, per-division accent from `company.ts`) — no ad-hoc hex; Fraunces for any display text on public surfaces. Every URL (track links, refund-receipt links, customer notifications) resolves through `henryDomain('logistics')` / `henryWebRoot()` / `getAccountUrl()`; zero `henrycogroup.com` literals. Light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` not regressed. The payment surface is behavior-locked — the SLA refund uses it as-is, styled only.

## Validation gates

1. **Standard CI** — `pnpm typecheck && pnpm lint && pnpm test && pnpm build` green across the logistics app + touched packages (the only required branch-protection context: `Lint, typecheck, test, build`).
2. **Routing optimization** — a fixture of 10 pending deliveries is assigned across available riders honoring zone, shift window, vehicle capacity, and urgency time-windows; the optimized order reduces total travel vs the naive order; `optimization_meta` records the algorithm version + score. Unit-tested with deterministic fixtures.
3. **Bundling smoke** — two same-destination/same-window shipments across divisions are detected and bundled (same-customer auto; cross-customer requires consent); the bundle feeds one route segment; idempotent on cron re-run.
4. **Customer tracking** — live ETA updates over realtime, the map shows only real rider breadcrumbs + drop-off, the rider card shows name/photo/rating only while in-transit, and the surface degrades to the timeline on map failure — verified in a real browser, mobile + desktop, light + dark, CLS ≈ 0.
5. **SLA breach → refund** — a shipment delivered past `sla_deadline_at` is marked breached, opens an `sla_breach` issue, and initiates a refund through `@henryco/payment-router` `refund()` that is idempotent (re-running the cron does not double-refund) and flips `paymentStatus` to `refunded` only on provider confirmation; the manager SLA page shows the breach + refund.
6. **RLS verification** — `logistics_routes` / `logistics_route_stops` / `logistics_shipment_bundles` / `logistics_sla_policies` enforce customer→own, rider→assigned, staff→all (and public read of the SLA promise); prove with SQL against the project.
7. **Telemetry** — the three events validate against `henryEventNameSchema`; the deliveries-per-route efficiency metric reports against the single-delivery baseline.
8. **Money safety** — no double refund under concurrent/re-run cron; no optimistic credit; every refund audit-logged.

## Deployment gate

All validation gates green; PR `v3/64-product-logistics-network-maturity` off `origin/main` → squash-merge via CI (no branch-protection bypass, no force-push). Owner reviews the routing optimizer's auto-dispatch human gate, the cross-customer bundling consent posture, and the SLA breach-refund policy (refund %/amount per tier) before stable declaration. The S4 live-refund step requires Paystack (V3-15) active in production; until then breach refunds are recorded-as-owed and queued (never silently dropped). Ship behind a kill switch (routing optimizer + bundling + SLA auto-refund each independently disableable). **30-day soak** measuring bundling cost vs single-delivery cost, routing efficiency, and SLA-breach/refund rates before declaring stable.

## Final report contract

`.codex-temp/v3-64-product-logistics-network-maturity/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion).

## Self-verification

- [ ] S1: `logistics_routes` / `logistics_route_stops` migrated with leg-mirroring RLS; `routing.ts` optimizer honors zone + shift + capacity + time-window + proximity; dispatcher-confirmed (no auto-dispatch); `optimization_meta` auditable; unit-tested.
- [ ] S2: `logistics_shipment_bundles` + `bundle_id`; cross-division same-destination/same-window detection (same-customer auto, cross-customer consented); feeds one route segment; idempotent.
- [ ] S3: live ETA over realtime (honest "as of" fallback), map shows only real rider breadcrumbs + drop-off (never home), rider card only while in-transit, degrades to timeline; mobile-first, CLS ≈ 0.
- [ ] S4: `logistics_sla_policies` (public-read promise, staff-write); per-tier promise persisted as `sla_deadline_at`; breach cron marks breaches; breach refund via `@henryco/payment-router` `refund()` — idempotent, provider-confirmed, ledger-true, no optimistic credit, audited; manager SLA page shows breach + refund.
- [ ] S5: three telemetry events registered + validating; deliveries-per-route + breach-refund-value owner signals live.
- [ ] No money behavior changed beyond initiating refunds through the behavior-locked surface; no double-refund under re-run; no GPS spoofing; no rider home/contact exposure; L8 insurance unaffected by bundling.
- [ ] All copy via `surface:logistics` (`translateSurfaceLabel`/`resolveLocalizedDynamicField`); brand via `@henryco/config` (Henry Onyx, never "Henry & Co."); zero hardcoded domains/strings; light + dark, mobile + desktop, CLS ≈ 0.
- [ ] Kill switches wired (routing/bundling/auto-refund independently); 30-day soak measures bundling cost vs single-delivery; report written. Hand-off: V3-74 (B2B dashboard), V3-78 (logistics API).
