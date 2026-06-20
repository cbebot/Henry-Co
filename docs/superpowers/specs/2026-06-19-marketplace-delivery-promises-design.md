# Delivery Promises — seller-controlled, location-aware free delivery

**Pass:** V3-FREESHIP-02 · **Date:** 2026-06-19 · **Risk:** money-adjacent (delivery is part of the order total + the VAT composite base) + pricing.
**Builds on:** V3-FREESHIP-CLOSE-01 (the money-safe checkout waiver + `lib/checkout/free-delivery.ts`).
**Owner decisions (locked):** reach is **tier-earned**; rollout is **store-wide first**.

---

## 1. Goal

Let a seller make a **Delivery Promise** — a deliberate, trustworthy commitment that a buyer in a covered location pays **₦0 delivery**. Not a generic "free shipping over ₦X" coupon: a Nigeria-native, verified-tier-earned signal of a serious seller. It plugs into the proven money-safe waiver, so VAT stays correct and the buyer can never forge it.

**Success:** a Gold seller in Enugu can promise *"Free delivery nationwide on orders from ₦10,000."* A buyer in Lagos sees the badge, checks out, and pays ₦0 delivery — settled correctly (goods revenue + VAT, delivery 0), with zero risk to the books. A Bronze seller can only promise their own state. No buyer can trick the waiver.

## 2. The model

A **Delivery Promise** is one record per store (v1):

- **Reach** — the set of Nigerian states the promise covers, expressed as one of: `OWN_STATE`, `OWN_ZONE` (their geopolitical zone), `STATES[...]` (an explicit subset), or `NATIONWIDE`. Persisted as the resolved **list of state codes** (so evaluation is a simple membership test) plus the chosen `reach_kind` (for re-editing/labelling).
- **Minimum order** (optional) — `min_order_minor`; the promise applies only when the cart's goods subtotal ≥ this.
- **Active** — sellers can pause a promise.
- **Origin state** — the seller's dispatch state (needed for `OWN_STATE` / `OWN_ZONE` and for honest buyer copy). Captured on the store.

**Tier-earned reach (the signature).** The maximum reach a seller may save is bounded **server-side** by their verified `marketplace_vendors.seller_tier`:

| Tier | Max reach |
|---|---|
| Bronze (or unset) | `OWN_STATE` |
| Silver | `OWN_ZONE` (their geopolitical zone) |
| Gold | `NATIONWIDE` |

A seller may always promise *less* than their ceiling (explicit `STATES` subset within the ceiling). The ceiling is enforced at write time and **re-checked at checkout** (a tier downgrade must not keep honoring an over-reach promise). Reach is a privilege that grows with standing — this is what makes it ours.

## 3. Nigeria geography module (`packages/config/src/geography-ng.ts`, shared)

The single source of truth for Nigerian delivery geography — no such list exists in the repo today.

- `NG_STATES`: the 36 states + FCT, each `{ code, name, zone }` (code = stable slug, e.g. `enugu`, `fct`).
- `NG_ZONES`: the 6 geopolitical zones (`north_central`, `north_east`, `north_west`, `south_east`, `south_south`, `south_west`) → their states.
- `zoneForState(code)`, `statesInZone(zone)`, `normalizeStateInput(text)` (maps messy free-text like "Enugu"/"enugu state" → `enugu`; returns `null` when unrecognized — never a guess).
- Pure, dependency-free, unit-tested. Lives in `@henryco/config` so checkout, seller UI, and the buyer picker share one list.

## 4. Data model — `marketplace_delivery_promises`

```
id              uuid pk
vendor_id       uuid  -> marketplace_vendors(id)   (one active promise per vendor in v1; UNIQUE(vendor_id) )
reach_kind      text  check in (own_state, own_zone, states, nationwide)
covered_states  text[]   -- resolved state codes the promise covers (the evaluation set)
min_order_minor bigint   null  -- optional goods-subtotal floor (kobo)
is_active       boolean  default true
created_at / updated_at timestamptz
```

**RLS (default-deny):**
- Seller (the vendor's `owner_user_id`, via a membership/ownership check) may `select/insert/update` **their own** vendor's promise.
- **Public `select`** of `(vendor_id, covered_states, min_order_minor, is_active)` for badges (no sensitive data).
- **No client write path bypasses the tier ceiling** — writes go through a `SECURITY DEFINER` RPC `upsert_delivery_promise(vendor_id, reach_kind, explicit_states, min_order_minor, is_active)` that (a) verifies the caller owns the vendor, (b) resolves `covered_states` from `reach_kind` + the vendor's origin state, (c) **clamps to the tier ceiling**, (d) writes. Direct table writes revoked for `anon`/`authenticated`.
- Migration is **committed-NOT-applied** (owner-gated apply, per project convention for money-adjacent schema). Advisor-clean; pinned `search_path` on the RPC.

## 5. Checkout evaluation — the location-aware waiver

Extend `lib/checkout/free-delivery.ts` (the proven primitive) with a location-aware decision, keeping the money-safe waiver untouched:

```
cartQualifiesForFreeDelivery(cartLines, buyerStateCode, promisesByVendor, goodsSubtotalMinor)
  → true ONLY when:
     - buyerStateCode is a recognized NG state (else false — no waiver on unknown location), AND
     - every cart line's vendor has an ACTIVE promise whose covered_states includes buyerStateCode
       AND (min_order_minor is null OR goodsSubtotalMinor >= min_order_minor)
       AND the promise still fits the vendor's CURRENT tier ceiling (re-check), OR the line has the
         manual owner override (filter_data.free_delivery — CLOSE-01, subsumed as an override)
```

The checkout already does one `marketplace_products` read (VAT + free-ship). It additionally loads the **active promises for the cart's vendors** (one indexed read) and the buyer's state (from `shipping_region`, normalized). If the predicate holds → `deliveryAmount: 0` (the exact proven waiver). VAT carve, server `grand_total`, fail-closed semantics — all unchanged from CLOSE-01. A failed promise read → normal delivery (never a silent waiver); the existing failed-classification read still rejects checkout.

**The buyer can't forge it:** the covered set is the seller's, the buyer's state is their real delivery address (faking it misroutes their own order), and `grand_total` is server-computed.

## 6. Seller UX — `vendor/settings`

A **Delivery Promise** card (premium, calm, Henry Onyx voice):
- A reach control showing only what their tier permits, with the higher tiers visible-but-locked ("Unlock nationwide delivery at Gold") — turning the ceiling into an aspiration, not a wall.
- Optional minimum-order field ("Free delivery on orders from ₦___").
- A live preview sentence: *"Free delivery across the South-East, on orders from ₦10,000."*
- Pause/resume. Origin (dispatch) state set here if not already on the store.
- Posts through the `upsert_delivery_promise` RPC.

## 7. Buyer UX

- **Badge** on product + store cards: *"Free delivery to {buyer's state}"* when the viewer's state is known and covered; otherwise the store page shows the honest reach (*"Free delivery across the South-East"*). Quiet, trustworthy — never shouty.
- **Checkout:** replace the free-text region input with a **NG state picker** (`NG_STATES`) — fixes the existing messy free-text (`"Amama"` as a region) and makes matching reliable. The honored line reads *"Delivery covered by {store} — ₦0"* with the seller credited.

## 8. Money-safety + Lane-1 notes

- **No new on-platform money flow in v1.** A promise WAIVES the buyer's delivery line; the seller has committed to arranging/absorbing delivery off-platform (the Nigerian norm — sellers use their own dispatch). The books are exactly the CLOSE-01 waiver: goods revenue + inclusive VAT, delivery 0, balanced. Re-uses the proven path; no change to `post_sale_revenue`/receipts/ledger.
- The current ₦18,000 flat delivery is a **placeholder**; the promise zeroes it for covered buyers. When a real platform-settled delivery-cost model lands (a logistics integration), this extends to debit the seller's payout for absorbed delivery — **explicitly out of scope for v1, flagged for Lane-1**.
- **VAT proven** for the waiver (CLOSE-01 tests). No promise can change a good's VAT treatment — only whether the (already-zero) delivery rides the base.

## 9. Testing

- **Geography module:** zone/state maps complete (36+FCT), `normalizeStateInput` strict (no guesses).
- **Tier ceiling:** Bronze can't save `OWN_ZONE`/`NATIONWIDE`; resolution from `reach_kind` + origin; downgrade re-check at checkout.
- **Checkout predicate:** covered/uncovered state, multi-vendor cart (all must cover), min-order boundary, unknown buyer state → no waiver, failed promise read → normal delivery, manual override still works. Extends `free-delivery.test.ts`.
- **VAT × waiver:** unchanged green (CLOSE-01 cases).
- **RLS/RPC:** seller writes own only; tier clamp can't be bypassed by a direct write; public read exposes no sensitive columns.

## 10. Rollout

- Migration committed-NOT-applied (owner-gated apply). Code dormant-safe until applied (no promises ⇒ no waivers ⇒ current behavior).
- Ship behind a small readiness check (table present + feature flag `MARKETPLACE_DELIVERY_PROMISES`) so deploy ≠ activation.
- All ten apps build (a `packages/config` change); i18n strict; brand/provider rules; no frozen account-money contact.

## 11. Out of scope (named follow-ons)

- **Per-product** promise overrides (store-wide is v1).
- **Platform-settled delivery cost** / seller payout debit (needs the logistics/payout model — Lane-1).
- **LGA/city granularity** (state-level is v1; messy free-text city data argues for state-first).
- **Buyer-tier perks** (e.g. member free delivery) — a different axis.

---

**One-line:** sellers earn delivery reach through verified standing and promise ₦0 delivery to covered states; the checkout honors it through the proven money-safe waiver — VAT-correct, buyer-unforgeable, books unchanged.
