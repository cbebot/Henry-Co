# Delivery Promises (V3-FREESHIP-02) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sellers earn delivery reach through their verified tier and promise ₦0 delivery to covered Nigerian states; the checkout honors it through the proven money-safe waiver (`lib/checkout/free-delivery.ts`).

**Architecture:** A shared Nigeria geography module + a pure reach-resolution/tier-ceiling module feed (a) a server-only, tier-clamping RPC that writes one `marketplace_delivery_promises` row per store, and (b) a location-aware extension of the existing checkout waiver. Seller config UI in `vendor/settings`; buyer state-picker + promise badge. The waiver, VAT carve, and server `grand_total` are unchanged from V3-FREESHIP-CLOSE-01.

**Tech Stack:** Next.js (App Router, server components + route handlers), TypeScript, Supabase Postgres (RLS + SECURITY DEFINER RPC), `node:test` + `tsx` for unit tests, Tailwind with `--market-*` tokens.

## Global Constraints

- Money-adjacent: NO raw money writes; do not touch `post_sale_revenue`/`record_customer_receipt`/receipts/ledger/frozen account flows. The waiver only sets `deliveryAmount: 0` — the proven path.
- Migration is **committed-NOT-applied** (owner-gated apply). Code must be dormant-safe: no promises ⇒ no waivers ⇒ current behavior.
- Reach ceiling by tier is enforced **server-side** (RPC) AND re-checked at checkout. Bronze/unset → own state; Silver → own geopolitical zone; Gold → nationwide.
- Money values in whole **kobo** (BIGINT). State codes are lowercase slugs.
- Brand/provider rules: no vendor/provider names in buyer copy; Henry Onyx voice (calm, premium). i18n strict (surface labels via the existing pattern).
- `packages/config` changes ⇒ all ten apps must build. Typecheck 0, lint 0, tests green at every task.
- Money-safe invariants proven by `order-vat.test.ts` must stay green.

---

### Task 1: Nigeria geography module

**Files:**
- Create: `packages/config/src/geography-ng.ts`
- Create: `packages/config/src/__tests__/geography-ng.test.ts`
- Modify: `packages/config/src/index.ts` (re-export)

**Interfaces:**
- Produces:
  - `type NgStateCode = string` (lowercase slug, e.g. `"enugu"`, `"fct"`)
  - `type NgZone = "north_central"|"north_east"|"north_west"|"south_east"|"south_south"|"south_west"`
  - `const NG_STATES: ReadonlyArray<{ code: NgStateCode; name: string; zone: NgZone }>` (36 states + FCT = 37)
  - `const NG_ZONES: Record<NgZone, { label: string; states: NgStateCode[] }>`
  - `function zoneForState(code: NgStateCode): NgZone | null`
  - `function statesInZone(zone: NgZone): NgStateCode[]`
  - `function normalizeStateInput(text: string | null | undefined): NgStateCode | null` (trims, lowercases, strips a trailing `" state"`, matches by code or name; returns `null` when unrecognized — never a guess)

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NG_STATES, NG_ZONES, zoneForState, statesInZone, normalizeStateInput } from "../geography-ng";

describe("NG geography", () => {
  it("has 37 states (36 + FCT), each in a real zone", () => {
    assert.equal(NG_STATES.length, 37);
    for (const s of NG_STATES) assert.ok(NG_ZONES[s.zone], `${s.code} → unknown zone ${s.zone}`);
  });
  it("zones partition the states with no overlap", () => {
    const fromZones = Object.values(NG_ZONES).flatMap((z) => z.states).sort();
    assert.deepEqual(fromZones, NG_STATES.map((s) => s.code).sort());
  });
  it("zoneForState / statesInZone round-trip", () => {
    assert.equal(zoneForState("enugu"), "south_east");
    assert.ok(statesInZone("south_east").includes("enugu"));
    assert.equal(zoneForState("not-a-state"), null);
  });
  it("normalizeStateInput is strict — maps messy text or returns null", () => {
    assert.equal(normalizeStateInput("Enugu"), "enugu");
    assert.equal(normalizeStateInput(" enugu state "), "enugu");
    assert.equal(normalizeStateInput("FCT"), "fct");
    assert.equal(normalizeStateInput("Abuja"), "fct"); // common alias
    assert.equal(normalizeStateInput("Amama"), null);  // a town, not a state
    assert.equal(normalizeStateInput(""), null);
    assert.equal(normalizeStateInput(null), null);
  });
});
```

- [ ] **Step 2: Run → FAIL** — `cd packages/config && npx tsx --test src/__tests__/geography-ng.test.ts` → "Cannot find module '../geography-ng'".

- [ ] **Step 3: Implement `geography-ng.ts`** — the full 37-entry `NG_STATES` table (canonical NG states + FCT with correct zones), derive `NG_ZONES` from it, and the four helpers. `normalizeStateInput`: trim→lowercase→strip trailing `" state"`; match by `code`, then by `name` (lowercased), then a small alias map (`abuja`→`fct`); else `null`. Pure, no deps.

- [ ] **Step 4: Run → PASS.** Re-export from `index.ts`. Run `pnpm --filter @henryco/config typecheck` → 0.

- [ ] **Step 5: Commit** — `feat(config): NG geography module (states + geopolitical zones)`.

---

### Task 2: Reach resolution + tier ceiling (pure)

**Files:**
- Create: `apps/marketplace/lib/checkout/delivery-reach.ts`
- Create: `apps/marketplace/lib/checkout/__tests__/delivery-reach.test.ts`

**Interfaces:**
- Consumes: `NG_STATES`, `zoneForState`, `statesInZone` from `@henryco/config`.
- Produces:
  - `type SellerTier = "bronze"|"silver"|"gold"` (+ unknown→bronze)
  - `type ReachKind = "own_state"|"own_zone"|"states"|"nationwide"`
  - `function tierCeiling(tier: string | null): ReachKind` (bronze→own_state, silver→own_zone, gold→nationwide)
  - `function resolveCoveredStates(input: { reachKind: ReachKind; originState: NgStateCode; explicitStates?: NgStateCode[]; tier: string | null }): { coveredStates: NgStateCode[]; clampedTo: ReachKind }` — resolves the covered set from reachKind+origin, then **clamps** to the tier ceiling (intersect/limit); `clampedTo` reports the effective reach if clamped down.

- [ ] **Step 1: Write failing tests** — bronze can only cover its own state even if it asks nationwide (clampedTo own_state); silver→own_zone covers the zone's states; gold→nationwide = all 37; `states` subset is clamped to the ceiling's allowed set; unknown tier → bronze ceiling.

```ts
import { resolveCoveredStates, tierCeiling } from "../delivery-reach";
import assert from "node:assert/strict"; import { describe, it } from "node:test";
import { statesInZone } from "@henryco/config";
describe("delivery reach + tier ceiling", () => {
  it("bronze nationwide ask is clamped to own state", () => {
    const r = resolveCoveredStates({ reachKind: "nationwide", originState: "enugu", tier: "bronze" });
    assert.deepEqual(r.coveredStates, ["enugu"]); assert.equal(r.clampedTo, "own_state");
  });
  it("silver own_zone covers the geopolitical zone", () => {
    const r = resolveCoveredStates({ reachKind: "own_zone", originState: "enugu", tier: "silver" });
    assert.deepEqual(r.coveredStates.sort(), statesInZone("south_east").sort()); assert.equal(r.clampedTo, "own_zone");
  });
  it("gold nationwide covers all 37", () => {
    const r = resolveCoveredStates({ reachKind: "nationwide", originState: "lagos", tier: "gold" });
    assert.equal(r.coveredStates.length, 37);
  });
  it("explicit states are clamped to the ceiling", () => {
    const r = resolveCoveredStates({ reachKind: "states", originState: "enugu", explicitStates: ["enugu","lagos"], tier: "bronze" });
    assert.deepEqual(r.coveredStates, ["enugu"]); // lagos outside own_state ceiling → dropped
  });
});
```

- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement** — `tierCeiling`; `resolveCoveredStates` computes the requested set (own_state→[origin], own_zone→statesInZone(zoneForState(origin)), states→explicit, nationwide→all), computes the ceiling's allowed set the same way, intersects, and sets `clampedTo` to the narrowest reachKind whose allowed set ⊇ the result.
- [ ] **Step 4: Run → PASS.** `pnpm --filter @henryco/marketplace typecheck` → 0.
- [ ] **Step 5: Commit** — `feat(marketplace): tier-clamped delivery reach resolution`.

---

### Task 3: Migration — `marketplace_delivery_promises` + RLS + RPC (committed-NOT-applied)

**Files:**
- Create: `apps/marketplace/supabase/migrations/<ts>_delivery_promises.sql`
- Create: `apps/marketplace/scripts/prove-delivery-promises-rls.sql` (proof, runs on a throwaway PG)

**Interfaces:**
- Produces (DB): table `marketplace_delivery_promises(id, vendor_id UNIQUE, reach_kind, covered_states text[], min_order_minor bigint null, is_active bool, origin_state text, created_at, updated_at)`; RPC `public.upsert_delivery_promise(p_vendor_id uuid, p_reach_kind text, p_explicit_states text[], p_min_order_minor bigint, p_origin_state text, p_is_active bool) returns marketplace_delivery_promises`.

- [ ] **Step 1: Write the migration** — create table; `enable row level security`; policies: public `select` (all columns are non-sensitive); seller `select/update/insert` WHERE the vendor's `owner_user_id = auth.uid()` (via a subselect on `marketplace_vendors`). Revoke `insert/update/delete` on the table from `anon, authenticated` (writes go through the RPC). RPC is `SECURITY DEFINER`, `set search_path = public, pg_temp`: (a) assert caller owns `p_vendor_id`; (b) read the vendor's `seller_tier`; (c) resolve+clamp `covered_states` in SQL mirroring `resolveCoveredStates` (origin/zone/nationwide intersected with the tier ceiling — uses a SQL zone map seeded in the migration); (d) upsert one row per vendor. Grant execute to `authenticated`.
- [ ] **Step 2: Write the RLS/RPC proof SQL** — seed two vendors (bronze, gold) with owners; assert: a bronze vendor's RPC nationwide ask persists only its own state; a non-owner RPC call raises; a direct `insert` as `authenticated` is denied; public `select` returns rows; covered_states for gold nationwide = 37.
- [ ] **Step 3: Run the proof** on a throwaway PG (`docker run` postgres or the repo's shadow harness): `psql -f migration.sql -f prove-...sql`. Expected: all asserts pass.
- [ ] **Step 4: Advisor/grant sanity** — confirm RPC has pinned search_path; no broad table writes. (No prod apply — committed-NOT-applied.)
- [ ] **Step 5: Commit** — `feat(marketplace): delivery_promises table + tier-clamping RPC (committed-NOT-applied)`.

---

### Task 4: Location-aware checkout waiver

**Files:**
- Modify: `apps/marketplace/lib/checkout/free-delivery.ts` (add the location-aware predicate; keep the existing primitives)
- Create: extend `apps/marketplace/lib/checkout/__tests__/free-delivery.test.ts`
- Modify: `apps/marketplace/app/api/marketplace/route.ts` (load promises + buyer state; call the predicate)

**Interfaces:**
- Consumes: `normalizeStateInput` (`@henryco/config`); `isFreeDeliveryProduct` (existing override).
- Produces: `function cartQualifiesForFreeDelivery(input: { cartProductIds: string[]; buyerState: NgStateCode | null; vendorByProduct: Map<string,string>; activePromiseByVendor: Map<string,{ coveredStates: string[]; minOrderMinor: number | null; isActive: boolean }>; manualFreeProductIds: ReadonlySet<string>; goodsSubtotalMinor: number }): boolean` — true only when cart non-empty, `buyerState` recognized, and EVERY product is covered (its vendor's active promise covers `buyerState` AND min-order met) OR carries the manual override.

  > This **supersedes** the old 2-arg `cartQualifiesForFreeDelivery(ids, set)` — update its one caller in `route.ts`. Keep `isFreeDeliveryProduct` + `MARKETPLACE_FREE_DELIVERY_FLAG` unchanged.

- [ ] **Step 1: Write failing tests** — covered state → true; uncovered/unknown state → false; one vendor in a multi-vendor cart not covering → false; min-order not met → false; manual override line counts as covered; inactive promise → not covered.
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement the predicate** (pure) + wire `route.ts`: after the existing product read (now also select `vendor_id`), build `vendorByProduct`; load `marketplace_delivery_promises` for the cart's vendor ids (one `.in()` read, `is_active=true`) → `activePromiseByVendor`; `buyerState = normalizeStateInput(shippingRegion)`; `goodsSubtotalMinor = subtotal*100`; `const allItemsFreeShipping = cartQualifiesForFreeDelivery({...})`. A failed promise read → treat as no promises (normal delivery), never throw the checkout (the VAT read still guards classification). Pass `deliveryAmount: allItemsFreeShipping ? 0 : undefined` (unchanged).
- [ ] **Step 4: Run → PASS** (new predicate tests + existing `order-vat` + `free-delivery` green). Typecheck/lint 0.
- [ ] **Step 5: Commit** — `feat(marketplace): location-aware free-delivery waiver at checkout`.

---

### Task 5: Seller UI — Delivery Promise card (`vendor/settings`)

**Files:**
- Create: `apps/marketplace/components/vendor/DeliveryPromiseCard.tsx` (client)
- Modify: `apps/marketplace/app/vendor/settings/page.tsx` (mount it; load current promise + tier + origin)
- Modify: `apps/marketplace/app/api/marketplace/route.ts` (new intent `vendor_delivery_promise_upsert` → calls the RPC)

**Interfaces:**
- Consumes: `NG_STATES`, `NG_ZONES` (picker); `tierCeiling` (gate the controls); the RPC via the intent.

- [ ] **Step 1:** Server-load the vendor's tier + origin_state + current promise in `settings/page.tsx`; pass to the card.
- [ ] **Step 2:** Build `DeliveryPromiseCard` — reach control limited to `tierCeiling(tier)`, higher tiers shown locked ("Unlock at Gold"); optional min-order (naira→kobo); live preview sentence built from `NG_ZONES`/state names; pause toggle; posts the `vendor_delivery_promise_upsert` intent (form POST, dual-mode per the app's action pattern).
- [ ] **Step 3:** Add the route intent → `upsert_delivery_promise` RPC (caller JWT, so the RPC's ownership + clamp apply); revalidate `/vendor/settings`.
- [ ] **Step 4:** Typecheck/lint 0; i18n surface labels added; both themes sane (manual check or the auth-free harness).
- [ ] **Step 5: Commit** — `feat(marketplace): seller Delivery Promise settings`.

---

### Task 6: Buyer UX — checkout state picker + promise badge

**Files:**
- Modify: `apps/marketplace/components/marketplace/checkout-experience.tsx` (region free-text → `NG_STATES` picker, writing the state code to `shipping_region`)
- Create: `apps/marketplace/components/marketplace/DeliveryPromiseBadge.tsx`
- Modify: product + store card components to render the badge from the public promise read.

**Interfaces:**
- Consumes: `NG_STATES` (picker); public `marketplace_delivery_promises` read (badge); `normalizeStateInput` (viewer state).

- [ ] **Step 1:** Replace the region input with a state `<select>` (NG_STATES); keep `shipping_region` hidden field populated with the chosen code; preserve the saved-address path (map `state`→code via `normalizeStateInput`).
- [ ] **Step 2:** `DeliveryPromiseBadge` — given a vendor's public promise + the viewer's state (if known): "Free delivery to {state}" when covered, else the honest reach line ("Free delivery across the South-East"). Quiet styling, `--market-*` tokens.
- [ ] **Step 3:** Render the badge on product + store cards (data already loaded server-side; add the promise to those reads).
- [ ] **Step 4:** Typecheck/lint 0; i18n; both themes; the honored checkout line "Delivery covered by {store} — ₦0" when waived.
- [ ] **Step 5: Commit** — `feat(marketplace): buyer state picker + delivery promise badge`.

---

## Final gate (after all tasks)
- [ ] `apps/marketplace` typecheck 0 / lint 0; `packages/config` typecheck 0; checkout tests (order-vat + free-delivery + delivery-reach + geography) green.
- [ ] All ten apps build (packages/config changed) — CI on the PR.
- [ ] Update `docs/marketplace/free-shipping-capability.md` (capability now seller+location) + PASS-REGISTER V3-FREESHIP-02 → built.
- [ ] PR; migration noted committed-NOT-applied; feature flag `MARKETPLACE_DELIVERY_PROMISES` off until owner applies the migration.

## Self-review notes
- **Spec coverage:** geography (T1), tier-earned reach (T2+T3 clamp), table/RLS/RPC (T3), location-aware waiver (T4), seller UI (T5), buyer picker+badge (T6), money-safety (T4 reuses the proven waiver; no money writes). ✓
- **Type consistency:** `cartQualifiesForFreeDelivery` is intentionally redefined in T4 (superseding the 2-arg CLOSE-01 version) — its sole caller is updated in the same task. `ReachKind`/`NgStateCode`/`SellerTier` are shared from T1/T2.
- **Dormant-safe:** with no promises rows + flag off, T4's predicate yields false for every cart → current delivery behavior. ✓
