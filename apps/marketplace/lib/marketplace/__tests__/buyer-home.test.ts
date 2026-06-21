// V3-INNER-L-MARKETPLACE — proof for the buyer-home editorial masthead model.
//
// The buyer dashboard's above-the-fold answer (Q1 "what's happening with my
// stuff" + Q2 "what next") is derived from pure functions so the page body
// stays a thin compose and the state→copy contract is testable. Copy flows
// through an injected translator (the page passes translateSurfaceLabel) so
// these tests run with an identity translator and assert structure, not prose.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { MarketplaceOrder } from "../types";
import {
  buyerDashboardStats,
  buyerHomeState,
  buildBuyerHero,
  buildBuyerNextStep,
  type BuyerDashboardInput,
} from "../buyer-home";

const identity = (s: string) => s;

function order(status: MarketplaceOrder["status"], extra: Partial<MarketplaceOrder> = {}): MarketplaceOrder {
  return {
    id: `o-${status}-${Math.random().toString(36).slice(2, 7)}`,
    orderNo: extra.orderNo ?? "HX-1001",
    status,
    grandTotal: 19500,
    currency: "NGN",
    placedAt: "2026-06-20T10:00:00.000Z",
    groups: [],
    ...extra,
  } as unknown as MarketplaceOrder;
}

function input(partial: Partial<BuyerDashboardInput> = {}): BuyerDashboardInput {
  return {
    orders: [],
    wishlist: [],
    follows: [],
    notifications: [],
    application: null,
    ...partial,
  } as BuyerDashboardInput;
}

describe("buyerDashboardStats", () => {
  it("counts active / in-transit / delivered / needs-action / saved / following / unread", () => {
    const stats = buyerDashboardStats(
      input({
        orders: [
          order("placed"),
          order("shipped"),
          order("partially_shipped"),
          order("delivered"),
          order("delivered_pending_confirmation"),
          order("awaiting_payment"),
          order("cancelled"),
        ],
        wishlist: [{ id: "p1" }, { id: "p2" }] as unknown as BuyerDashboardInput["wishlist"],
        follows: [{ id: "v1" }] as unknown as BuyerDashboardInput["follows"],
        notifications: [
          { id: "n1", readAt: null },
          { id: "n2", readAt: "2026-06-20T00:00:00Z" },
        ] as unknown as BuyerDashboardInput["notifications"],
      }),
    );

    assert.equal(stats.totalOrders, 7);
    // active = placed, shipped, partially_shipped, awaiting_payment (in-flight set)
    assert.equal(stats.activeOrders, 4);
    assert.equal(stats.inTransit, 2); // shipped + partially_shipped
    assert.equal(stats.delivered, 2); // delivered + delivered_pending_confirmation
    assert.equal(stats.awaitingPayment, 1);
    assert.equal(stats.awaitingConfirmation, 1);
    assert.equal(stats.needsAction, 2); // awaiting_payment + delivered_pending_confirmation
    assert.equal(stats.saved, 2);
    assert.equal(stats.following, 1);
    assert.equal(stats.unread, 1);
  });

  it("marks sellerActive only when the application is approved", () => {
    const idle = buyerDashboardStats(input());
    assert.equal(idle.hasApplication, false);
    assert.equal(idle.sellerActive, false);

    const pending = buyerDashboardStats(
      input({ application: { status: "under_review" } as unknown as BuyerDashboardInput["application"] }),
    );
    assert.equal(pending.hasApplication, true);
    assert.equal(pending.sellerActive, false);
    assert.equal(pending.applicationStatus, "under_review");

    const active = buyerDashboardStats(
      input({ application: { status: "approved" } as unknown as BuyerDashboardInput["application"] }),
    );
    assert.equal(active.sellerActive, true);
  });
});

describe("buyerHomeState", () => {
  it("is empty only when there are no orders, saved items, or follows", () => {
    assert.equal(buyerHomeState(buyerDashboardStats(input())), "empty");
    // a saved item alone lifts the page out of empty (there IS something)
    assert.equal(
      buyerHomeState(
        buyerDashboardStats(input({ wishlist: [{ id: "p1" }] as unknown as BuyerDashboardInput["wishlist"] })),
      ),
      "calm",
    );
  });

  it("is attention when an order needs the buyer to act (pay / confirm receipt)", () => {
    assert.equal(buyerHomeState(buyerDashboardStats(input({ orders: [order("awaiting_payment")] }))), "attention");
    assert.equal(
      buyerHomeState(buyerDashboardStats(input({ orders: [order("delivered_pending_confirmation")] }))),
      "attention",
    );
  });

  it("is active when orders are in flight with nothing needing action", () => {
    assert.equal(buyerHomeState(buyerDashboardStats(input({ orders: [order("shipped")] }))), "active");
  });

  it("is calm with delivered history and nothing pending", () => {
    assert.equal(buyerHomeState(buyerDashboardStats(input({ orders: [order("delivered")] }))), "calm");
  });

  it("attention outranks active when both are present", () => {
    const stats = buyerDashboardStats(input({ orders: [order("shipped"), order("awaiting_payment")] }));
    assert.equal(buyerHomeState(stats), "attention");
  });
});

describe("buildBuyerHero", () => {
  it("mirrors the page state as the hero tone and renders four real-number tiles", () => {
    const stats = buyerDashboardStats(input({ orders: [order("shipped"), order("shipped")] }));
    const hero = buildBuyerHero(stats, identity);
    assert.equal(hero.tone, "active");
    assert.equal(hero.tiles.length, 4);
    const values = hero.tiles.map((t) => t.value);
    assert.ok(values.includes(stats.activeOrders));
    assert.ok(values.includes(stats.inTransit));
    assert.ok(hero.ctaPrimary && typeof hero.ctaPrimary.href === "string");
  });

  it("filters zero-count breakdown rows out of the side panel", () => {
    const stats = buyerDashboardStats(input({ orders: [order("delivered")] }));
    const hero = buildBuyerHero(stats, identity);
    const rows = hero.side.breakdown?.rows ?? [];
    assert.ok(rows.every((r) => r.count > 0));
    // delivered:1 present, in-motion:0 absent
    assert.ok(rows.some((r) => r.count === 1));
  });

  it("every breakdown dot color is a CSS variable expression (never a raw hex)", () => {
    const stats = buyerDashboardStats(
      input({ orders: [order("shipped"), order("delivered"), order("awaiting_payment")] }),
    );
    const hero = buildBuyerHero(stats, identity);
    for (const row of hero.side.breakdown?.rows ?? []) {
      assert.match(row.color, /^var\(--/);
    }
  });
});

describe("buildBuyerNextStep", () => {
  it("returns null when there is nothing pending (calm/empty carry Q2 via the hero CTA)", () => {
    assert.equal(buildBuyerNextStep(input(), buyerDashboardStats(input()), identity), null);
    const calm = input({ orders: [order("delivered")] });
    assert.equal(buildBuyerNextStep(calm, buyerDashboardStats(calm), identity), null);
  });

  it("asks the buyer to confirm receipt first, naming the specific order", () => {
    const data = input({ orders: [order("delivered_pending_confirmation", { orderNo: "HX-2048" })] });
    const step = buildBuyerNextStep(data, buyerDashboardStats(data), identity);
    assert.ok(step);
    assert.equal(step!.tone, "attention");
    assert.equal(step!.iconKey, "confirm");
    assert.match(step!.title, /HX-2048/);
    assert.ok(step!.cta.href.includes("HX-2048"));
  });

  it("surfaces a tracking step when an order is moving and nothing needs action", () => {
    const data = input({ orders: [order("shipped", { orderNo: "HX-3001" })] });
    const step = buildBuyerNextStep(data, buyerDashboardStats(data), identity);
    assert.ok(step);
    assert.equal(step!.iconKey, "track");
  });
});
