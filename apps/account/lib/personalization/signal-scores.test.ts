import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  coerceModuleSlug,
  deriveSignalScores,
  deriveBlockedModules,
  deriveModuleDefaultWeights,
} from "./signal-scores";
import type { ModuleSlug } from "@henryco/dashboard-shell";
import type { SignalFeedItem } from "@henryco/data";
import type { LifecycleSnapshot } from "@henryco/lifecycle";
import type { AnnotatedHomeWidget } from "@/lib/smart-home/widgets";

const KNOWN = new Set<ModuleSlug>([
  "customer-overview",
  "care",
  "marketplace",
  "studio",
  "jobs",
  "wallet",
  "settings",
]);

function sig(over: Partial<SignalFeedItem>): SignalFeedItem {
  return {
    id: "x",
    kind: "activity",
    source: "customer_activity",
    division: "care",
    priority: "normal",
    title: "t",
    body: null,
    actionUrl: null,
    createdAt: "2026-07-18T00:00:00.000Z",
    score: 1,
    emailDispatched: false,
    ...over,
  };
}

function widget(slug: ModuleSlug, weight: number): AnnotatedHomeWidget {
  return {
    id: `${slug}-w`,
    source: slug,
    title: "w",
    size: "sm",
    weight,
    render: async () => null,
    module: { slug } as AnnotatedHomeWidget["module"],
  } as AnnotatedHomeWidget;
}

describe("coerceModuleSlug", () => {
  it("passes through a known slug", () => {
    assert.equal(coerceModuleSlug("care", KNOWN), "care");
  });
  it("aliases account → customer-overview", () => {
    assert.equal(coerceModuleSlug("account", KNOWN), "customer-overview");
  });
  it("aliases payments/security → wallet/settings", () => {
    assert.equal(coerceModuleSlug("payments", KNOWN), "wallet");
    assert.equal(coerceModuleSlug("security", KNOWN), "settings");
  });
  it("drops unknown / empty labels", () => {
    assert.equal(coerceModuleSlug("nonsense", KNOWN), null);
    assert.equal(coerceModuleSlug("", KNOWN), null);
    assert.equal(coerceModuleSlug(null, KNOWN), null);
  });
  it("drops a real slug the viewer is not entitled to", () => {
    assert.equal(coerceModuleSlug("property", KNOWN), null); // not in KNOWN
  });
});

describe("deriveSignalScores", () => {
  it("takes the MAX score per module across items", () => {
    const scores = deriveSignalScores(
      [
        sig({ division: "care", score: 3 }),
        sig({ division: "care", score: 9 }),
        sig({ division: "marketplace", score: 5 }),
      ],
      KNOWN,
    );
    assert.equal(scores.get("care"), 9);
    assert.equal(scores.get("marketplace"), 5);
  });
  it("maps via division alias and drops unmappable items", () => {
    const scores = deriveSignalScores(
      [
        sig({ division: "account", score: 4 }),
        sig({ division: "totally-unknown", score: 99 }),
      ],
      KNOWN,
    );
    assert.equal(scores.get("customer-overview"), 4);
    assert.equal(scores.size, 1);
  });
  it("is empty for an empty feed (the consent-off input)", () => {
    assert.equal(deriveSignalScores([], KNOWN).size, 0);
  });
});

describe("deriveBlockedModules", () => {
  it("blocks a module with a security/urgent signal", () => {
    const blocked = deriveBlockedModules(
      [
        sig({ division: "wallet", priority: "security" }),
        sig({ division: "care", priority: "urgent" }),
        sig({ division: "studio", priority: "normal" }),
      ],
      null,
      KNOWN,
    );
    assert.ok(blocked.has("wallet"));
    assert.ok(blocked.has("care"));
    assert.ok(!blocked.has("studio"));
  });
  it("blocks a module with a critical lifecycle actionable (by pillar)", () => {
    const lifecycle = {
      actionables: [
        { priority: "critical", pillar: "wallet" },
        { priority: "high", pillar: "care" },
      ],
    } as unknown as LifecycleSnapshot;
    const blocked = deriveBlockedModules([], lifecycle, KNOWN);
    assert.ok(blocked.has("wallet"));
    assert.ok(!blocked.has("care")); // "high" is not a blocker
  });
});

describe("deriveModuleDefaultWeights", () => {
  it("takes the MAX widget weight per module", () => {
    const weights = deriveModuleDefaultWeights([
      widget("care", 20),
      widget("care", 80),
      widget("wallet", 50),
    ]);
    assert.equal(weights.get("care"), 80);
    assert.equal(weights.get("wallet"), 50);
  });
});
