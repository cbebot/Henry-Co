import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { isPublicAccountRoute } from "./proxy-public-routes";

describe("isPublicAccountRoute — the account proxy's /login-exemption predicate", () => {
  it("exempts the Henry Onyx Intelligence API so free chat is not 307'd to /login", () => {
    // The bug this fixes: an anonymous turn was redirected to
    // /login?next=/api/intelligence/chat and never ran.
    assert.equal(isPublicAccountRoute("/api/intelligence/chat"), true);
    assert.equal(isPublicAccountRoute("/api/intelligence/quote"), true);
    assert.equal(isPublicAccountRoute("/api/intelligence/run"), true);
    assert.equal(isPublicAccountRoute("/api/intelligence/health"), true);
  });

  it("still exempts the routes that were already public (no regression)", () => {
    assert.equal(isPublicAccountRoute("/login"), true);
    assert.equal(isPublicAccountRoute("/api/auth/callback"), true);
    assert.equal(isPublicAccountRoute("/api/payments/webhooks/paystack"), true);
    assert.equal(isPublicAccountRoute("/api/push/subscribe"), true);
    assert.equal(isPublicAccountRoute("/opengraph-image"), true);
    assert.equal(isPublicAccountRoute("/api/health"), true);
    assert.equal(isPublicAccountRoute("/styles/app.css"), true); // has a dot
  });

  it("still protects real authenticated surfaces (the redirect must still fire for these)", () => {
    assert.equal(isPublicAccountRoute("/wallet"), false);
    assert.equal(isPublicAccountRoute("/settings"), false);
    assert.equal(isPublicAccountRoute("/support/thread-123"), false);
    // A lookalike that is NOT the intelligence API prefix stays protected.
    assert.equal(isPublicAccountRoute("/intelligence"), false);
    assert.equal(isPublicAccountRoute("/api/intelligencer"), false);
  });
});
