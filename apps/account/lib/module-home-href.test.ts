/**
 * resolveModuleHomeHref probes.
 *
 * Pure logic that decides where the rail / mobile Modules drawer /
 * Cmd-jump entries link. Regressing this re-breaks the "wallet never
 * opens from the mobile Modules navigator" bug, so it earns a focused
 * node:test (run via `tsx --test lib/*.test.ts`).
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { resolveModuleHomeHref } from "./module-home-href";

describe("resolveModuleHomeHref", () => {
  it("routes a module with a declared homeHref straight to that surface", () => {
    assert.equal(
      resolveModuleHomeHref({ slug: "wallet", homeHref: "/wallet" }),
      "/wallet",
    );
  });

  it("falls back to the /modules/<slug> catch-all when no homeHref is set", () => {
    assert.equal(
      resolveModuleHomeHref({ slug: "marketplace" }),
      "/modules/marketplace",
    );
    assert.equal(
      resolveModuleHomeHref({ slug: "marketplace", homeHref: undefined }),
      "/modules/marketplace",
    );
  });

  it("always keeps customer-overview at the account home, ignoring homeHref", () => {
    assert.equal(resolveModuleHomeHref({ slug: "customer-overview" }), "/");
    assert.equal(
      resolveModuleHomeHref({ slug: "customer-overview", homeHref: "/somewhere" }),
      "/",
    );
  });
});
