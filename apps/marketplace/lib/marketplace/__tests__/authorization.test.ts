// V3-FIRE-MARKETPLACE-FIX — proof for the service_role multiplexer authorization
// predicates. Every marketplace write flows through one `service_role` handler
// (`app/api/marketplace/route.ts`) and the force-dynamic order surfaces, so RLS
// is NOT a backstop: ownership has to be proven in TypeScript. These pure
// predicates concentrate that logic so the handlers can no longer drift apart
// (which is exactly how `dispute_create` shipped without the check its sibling
// `order_confirm_completion` already had — finding F-02).
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  isMarketplaceOrderOwner,
  resolveVendorProductUpsert,
  cartItemOwnerMatches,
} from "../authorization";

describe("isMarketplaceOrderOwner (F-01 /track, F-02 dispute_create)", () => {
  const viewer = { user: { id: "user-a", email: "Buyer@Example.com" } };

  it("denies an unauthenticated viewer (the /track brute-force vector)", () => {
    assert.equal(isMarketplaceOrderOwner({ user_id: "user-a" }, { user: null }), false);
    assert.equal(isMarketplaceOrderOwner({ user_id: "user-a" }, null), false);
  });

  it("denies when the order is missing", () => {
    assert.equal(isMarketplaceOrderOwner(null, viewer), false);
    assert.equal(isMarketplaceOrderOwner(undefined, viewer), false);
  });

  it("grants the bound owner by user_id", () => {
    assert.equal(isMarketplaceOrderOwner({ user_id: "user-a" }, viewer), true);
  });

  it("denies a different authenticated user (cross-order IDOR)", () => {
    assert.equal(
      isMarketplaceOrderOwner(
        { user_id: "user-b", normalized_email: "someone@else.com" },
        viewer,
      ),
      false,
    );
  });

  it("grants by normalized email when user_id is unbound, case/space-insensitive", () => {
    assert.equal(
      isMarketplaceOrderOwner({ user_id: null, normalized_email: " buyer@example.com " }, viewer),
      true,
    );
  });

  it("never treats two empty emails as a match", () => {
    assert.equal(
      isMarketplaceOrderOwner(
        { user_id: null, normalized_email: null },
        { user: { id: "user-a", email: null } },
      ),
      false,
    );
    assert.equal(
      isMarketplaceOrderOwner(
        { user_id: null, normalized_email: "" },
        { user: { id: "user-a", email: "" } },
      ),
      false,
    );
  });

  it("never falls through to email when the order is bound to a DIFFERENT user_id", () => {
    // Contract: the email branch is only for orders WITHOUT a bound user. An
    // order owned by user-b must never be granted to user-a just because the
    // email column happens to match (defense-in-depth against any future path
    // that sets normalized_email from buyer-supplied input).
    assert.equal(
      isMarketplaceOrderOwner(
        { user_id: "user-b", normalized_email: "buyer@example.com" },
        viewer,
      ),
      false,
    );
  });

  it("does not match a null order user_id against a real viewer id", () => {
    assert.equal(
      isMarketplaceOrderOwner(
        { user_id: null, normalized_email: "nope@example.com" },
        viewer,
      ),
      false,
    );
  });
});

describe("resolveVendorProductUpsert (F-04 onConflict:slug takeover)", () => {
  it("rejects when no vendor scope resolves (no silent attribution)", () => {
    assert.deepEqual(resolveVendorProductUpsert({ vendorScopeId: null, existing: null }), {
      ok: false,
      code: "missing-vendor-scope",
    });
    assert.deepEqual(resolveVendorProductUpsert({ vendorScopeId: undefined, existing: null }), {
      ok: false,
      code: "missing-vendor-scope",
    });
  });

  it("allows inserting a brand-new slug under the caller's vendor", () => {
    assert.deepEqual(resolveVendorProductUpsert({ vendorScopeId: "vendor-a", existing: null }), {
      ok: true,
    });
  });

  it("allows the caller to update their own existing product", () => {
    assert.deepEqual(
      resolveVendorProductUpsert({
        vendorScopeId: "vendor-a",
        existing: { id: "p1", vendor_id: "vendor-a" },
      }),
      { ok: true },
    );
  });

  it("rejects overwriting another vendor's product (the takeover)", () => {
    assert.deepEqual(
      resolveVendorProductUpsert({
        vendorScopeId: "vendor-a",
        existing: { id: "p1", vendor_id: "vendor-b" },
      }),
      { ok: false, code: "listing-conflict" },
    );
  });

  it("rejects hijacking a company-owned product's slug (vendor_id null)", () => {
    assert.deepEqual(
      resolveVendorProductUpsert({
        vendorScopeId: "vendor-a",
        existing: { id: "p1", vendor_id: null },
      }),
      { ok: false, code: "listing-conflict" },
    );
  });
});

describe("cartItemOwnerMatches (F-05 cart_update IDOR)", () => {
  const authed = { user: { id: "user-a", email: "a@example.com" } };

  it("denies when the cart is missing", () => {
    assert.equal(cartItemOwnerMatches(null, authed, null), false);
  });

  it("grants the authenticated owner by user_id", () => {
    assert.equal(cartItemOwnerMatches({ user_id: "user-a" }, authed, null), true);
  });

  it("denies another authenticated user's cart", () => {
    assert.equal(cartItemOwnerMatches({ user_id: "user-b" }, authed, null), false);
  });

  it("grants a guest by matching session_token", () => {
    assert.equal(
      cartItemOwnerMatches({ user_id: null, session_token: "tok-1" }, { user: null }, "tok-1"),
      true,
    );
  });

  it("denies a guest whose session_token does not match", () => {
    assert.equal(
      cartItemOwnerMatches({ user_id: null, session_token: "tok-1" }, { user: null }, "tok-2"),
      false,
    );
  });

  it("never matches on an empty/absent token", () => {
    assert.equal(cartItemOwnerMatches({ user_id: null, session_token: null }, { user: null }, null), false);
    assert.equal(cartItemOwnerMatches({ user_id: null, session_token: "" }, { user: null }, ""), false);
  });
});
