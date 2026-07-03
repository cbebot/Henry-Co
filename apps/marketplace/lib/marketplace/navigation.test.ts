import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { vendorWorkspaceNav } from "./navigation";

describe("vendorWorkspaceNav — grouped vendor navigation", () => {
  it("returns flat nav AND groups covering the same routes", () => {
    const { nav, navGroups } = vendorWorkspaceNav("/vendor/products", "en");
    const flatHrefs = new Set(nav.map((i) => i.href));
    const groupedHrefs = navGroups.flatMap((g) => g.items.map((i) => i.href));
    assert.equal(groupedHrefs.length, flatHrefs.size, "every route grouped exactly once");
    for (const href of groupedHrefs) assert.ok(flatHrefs.has(href), `${href} exists in flat nav`);
    assert.ok(navGroups.length >= 3, "mobile drawer gets real groups");
  });

  it("marks the active route in both shapes", () => {
    const { nav, navGroups } = vendorWorkspaceNav("/vendor/payouts", "en");
    assert.ok(nav.find((i) => i.href === "/vendor/payouts")?.active);
    assert.ok(navGroups.flatMap((g) => g.items).find((i) => i.href === "/vendor/payouts")?.active);
  });

  it("gates intelligence on its flag", () => {
    delete process.env.MARKETPLACE_AI_CHAT;
    delete process.env.NEXT_PUBLIC_HENRY_FLAG_AI_GATEWAY;
    assert.ok(!vendorWorkspaceNav("/vendor", "en").nav.some((i) => i.href === "/vendor/intelligence"));
    process.env.NEXT_PUBLIC_HENRY_FLAG_AI_GATEWAY = "true";
    assert.ok(vendorWorkspaceNav("/vendor", "en").nav.some((i) => i.href === "/vendor/intelligence"));
    delete process.env.NEXT_PUBLIC_HENRY_FLAG_AI_GATEWAY;
  });
});
