import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  computeHomeLayout,
  type HomeLayoutInput,
  type HomeLayoutPreference,
  type LayoutModuleInput,
} from "../compute-layout";
import type { ModuleSlug } from "../../register";

const NOW = "2026-07-18T00:00:00.000Z";

function mod(
  slug: ModuleSlug,
  defaultWeight: number,
  hasOpenBlocker = false,
): LayoutModuleInput {
  return { slug, defaultWeight, hasOpenBlocker };
}

function emptyPref(
  over: Partial<HomeLayoutPreference> = {},
): HomeLayoutPreference {
  return {
    desktopOrder: [],
    mobileOrder: [],
    hidden: [],
    pinned: [],
    ...over,
  };
}

function run(
  over: Partial<HomeLayoutInput> & {
    registeredModules: ReadonlyArray<LayoutModuleInput>;
  },
): ReturnType<typeof computeHomeLayout> {
  return computeHomeLayout({
    signalScores: new Map(),
    preference: null,
    device: "desktop",
    now: NOW,
    ...over,
  });
}

const orderedSlugs = (r: ReturnType<typeof computeHomeLayout>) =>
  r.ordered.map((e) => e.slug);
const reasonOf = (r: ReturnType<typeof computeHomeLayout>, slug: ModuleSlug) =>
  r.ordered.find((e) => e.slug === slug)?.reason;

describe("computeHomeLayout — deterministic floor", () => {
  it("1. new user (null preference) falls back to defaultWeight order", () => {
    const r = run({
      registeredModules: [
        mod("care", 40),
        mod("wallet", 80),
        mod("studio", 60),
      ],
    });
    assert.deepEqual(orderedSlugs(r), ["wallet", "studio", "care"]);
    assert.equal(reasonOf(r, "wallet"), "default_order");
    assert.deepEqual(r.hidden, []);
    assert.equal(r.computedAt, NOW);
  });

  it("2. empty preference arrays behave like the null fallback", () => {
    const r = run({
      registeredModules: [mod("care", 40), mod("wallet", 80)],
      preference: emptyPref(),
    });
    assert.deepEqual(orderedSlugs(r), ["wallet", "care"]);
  });

  it("3. a pin overrides a higher signal score", () => {
    const r = run({
      registeredModules: [mod("care", 40), mod("wallet", 80)],
      preference: emptyPref({ pinned: ["care"] }),
      signalScores: new Map<ModuleSlug, number>([["wallet", 999]]),
    });
    assert.deepEqual(orderedSlugs(r), ["care", "wallet"]);
    assert.equal(reasonOf(r, "care"), "user_pinned");
  });

  it("4. a blocker module cannot be hidden — it is force-shown", () => {
    const r = run({
      registeredModules: [mod("care", 40), mod("wallet", 80, true)],
      preference: emptyPref({ hidden: ["wallet"] }),
    });
    assert.ok(orderedSlugs(r).includes("wallet"));
    assert.equal(reasonOf(r, "wallet"), "open_blocker");
    assert.deepEqual(r.hidden, []);
  });

  it("5. device divergence — mobile vs desktop yield different orders", () => {
    const base = {
      registeredModules: [
        mod("care", 10),
        mod("wallet", 10),
        mod("studio", 10),
      ],
      preference: emptyPref({
        desktopOrder: ["studio", "care", "wallet"],
        mobileOrder: ["wallet", "care", "studio"],
      }),
    };
    const desktop = run({ ...base, device: "desktop" });
    const mobile = run({ ...base, device: "mobile" });
    assert.deepEqual(orderedSlugs(desktop), ["studio", "care", "wallet"]);
    assert.deepEqual(orderedSlugs(mobile), ["wallet", "care", "studio"]);
  });

  it("6. unknown slugs in preference arrays are pruned, not crashed", () => {
    const r = run({
      registeredModules: [mod("care", 40)],
      // "hotel" is a valid ModuleSlug but NOT registered for this viewer.
      preference: emptyPref({ pinned: ["hotel"], desktopOrder: ["hotel"] }),
    });
    assert.deepEqual(orderedSlugs(r), ["care"]);
  });

  it("7. hidden modules are excluded from ordered and listed in hidden", () => {
    const r = run({
      registeredModules: [mod("care", 40), mod("wallet", 80)],
      preference: emptyPref({ hidden: ["care"] }),
    });
    assert.deepEqual(orderedSlugs(r), ["wallet"]);
    assert.deepEqual(r.hidden, ["care"]);
    assert.ok(!orderedSlugs(r).includes("care"));
  });

  it("8. multiple pins are placed in the user's pinned order", () => {
    const r = run({
      registeredModules: [
        mod("care", 10),
        mod("wallet", 90),
        mod("studio", 50),
      ],
      preference: emptyPref({ pinned: ["studio", "care"] }),
    });
    assert.deepEqual(orderedSlugs(r).slice(0, 2), ["studio", "care"]);
  });

  it("9. pinned + blocker: pinned wins position, no double-listing", () => {
    const r = run({
      registeredModules: [mod("care", 40, true), mod("wallet", 80)],
      preference: emptyPref({ pinned: ["care"] }),
    });
    assert.deepEqual(
      orderedSlugs(r).filter((s) => s === "care").length,
      1,
    );
    assert.equal(orderedSlugs(r)[0], "care");
    assert.equal(reasonOf(r, "care"), "user_pinned");
  });

  it("10. signal score orders the tail, defaultWeight breaks ties", () => {
    const r = run({
      registeredModules: [
        mod("care", 40),
        mod("wallet", 80),
        mod("studio", 60),
      ],
      signalScores: new Map<ModuleSlug, number>([
        ["care", 5],
        ["studio", 5],
      ]),
    });
    // care & studio share score 5 → studio first (higher weight); wallet last (score 0).
    assert.deepEqual(orderedSlugs(r), ["studio", "care", "wallet"]);
    assert.equal(reasonOf(r, "studio"), "high_signal_score");
    assert.equal(reasonOf(r, "wallet"), "default_order");
  });

  it("11. all non-blocker modules hidden → ordered empty, hidden holds them", () => {
    const r = run({
      registeredModules: [mod("care", 40), mod("wallet", 80)],
      preference: emptyPref({ hidden: ["care", "wallet"] }),
    });
    assert.deepEqual(orderedSlugs(r), []);
    assert.deepEqual([...r.hidden].sort(), ["care", "wallet"]);
  });

  it("12. a slug both pinned and hidden → pin wins, not hidden", () => {
    const r = run({
      registeredModules: [mod("care", 40), mod("wallet", 80)],
      preference: emptyPref({ pinned: ["care"], hidden: ["care"] }),
    });
    assert.ok(orderedSlugs(r).includes("care"));
    assert.equal(reasonOf(r, "care"), "user_pinned");
    assert.deepEqual(r.hidden, []);
  });

  it("13. a slug in both device order and pinned is placed once (as pinned)", () => {
    const r = run({
      registeredModules: [mod("care", 40), mod("wallet", 80)],
      preference: emptyPref({ pinned: ["care"], desktopOrder: ["care"] }),
    });
    assert.equal(orderedSlugs(r).filter((s) => s === "care").length, 1);
    assert.equal(reasonOf(r, "care"), "user_pinned");
  });

  it("14. blocker precedes user-ordered but follows pins", () => {
    const r = run({
      registeredModules: [
        mod("care", 40),
        mod("wallet", 80, true),
        mod("studio", 60),
      ],
      preference: emptyPref({
        pinned: ["care"],
        desktopOrder: ["studio", "wallet"],
      }),
    });
    // care (pin) → wallet (blocker) → studio (user-ordered)
    assert.deepEqual(orderedSlugs(r), ["care", "wallet", "studio"]);
    assert.equal(reasonOf(r, "wallet"), "open_blocker");
    assert.equal(reasonOf(r, "studio"), "user_ordered");
  });

  it("15. empty signal scores (consent withheld) → defaultWeight-only tail", () => {
    const r = run({
      registeredModules: [
        mod("care", 40),
        mod("wallet", 80),
        mod("studio", 60),
      ],
      signalScores: new Map(),
    });
    assert.deepEqual(orderedSlugs(r), ["wallet", "studio", "care"]);
    assert.ok(r.ordered.every((e) => e.reason === "default_order"));
  });

  it("16. computedAt reflects the injected clock", () => {
    const r = run({
      registeredModules: [mod("care", 40)],
      now: "2030-01-01T12:00:00.000Z",
    });
    assert.equal(r.computedAt, "2030-01-01T12:00:00.000Z");
  });

  it("17. deterministic — same input yields identical output twice", () => {
    const input: HomeLayoutInput = {
      registeredModules: [
        mod("care", 40),
        mod("wallet", 80),
        mod("studio", 60),
      ],
      signalScores: new Map<ModuleSlug, number>([["care", 3]]),
      preference: emptyPref({ pinned: ["studio"], hidden: ["wallet"] }),
      device: "desktop",
      now: NOW,
    };
    assert.deepEqual(computeHomeLayout(input), computeHomeLayout(input));
  });

  it("18. no duplicate slugs appear in ordered", () => {
    const r = run({
      registeredModules: [
        mod("care", 40, true),
        mod("wallet", 80),
        mod("studio", 60),
      ],
      preference: emptyPref({
        pinned: ["care", "wallet"],
        desktopOrder: ["care", "wallet", "studio"],
      }),
    });
    const slugs = orderedSlugs(r);
    assert.equal(slugs.length, new Set(slugs).size);
  });

  it("19. hidden result keeps only known, non-blocker, non-pinned slugs", () => {
    const r = run({
      registeredModules: [mod("care", 40), mod("wallet", 80, true)],
      // "hotel" unknown, wallet is a blocker → both dropped from hidden.
      preference: emptyPref({ hidden: ["hotel", "wallet", "care"] }),
    });
    assert.deepEqual(r.hidden, ["care"]);
  });

  it("20. an unknown pinned slug is pruned from the pinned set", () => {
    const r = run({
      registeredModules: [mod("care", 40)],
      preference: emptyPref({ pinned: ["building"] }),
    });
    assert.deepEqual(orderedSlugs(r), ["care"]);
    assert.equal(reasonOf(r, "care"), "default_order");
  });

  it("21. defaultWeight strictly orders the pure-fallback tail", () => {
    const r = run({
      registeredModules: [
        mod("a" as ModuleSlug, 1),
        mod("b" as ModuleSlug, 3),
        mod("c" as ModuleSlug, 2),
      ],
    });
    assert.deepEqual(orderedSlugs(r), ["b", "c", "a"]);
  });

  it("22. integration — pin + blocker + hide + signal + default together", () => {
    const r = run({
      registeredModules: [
        mod("care", 40),
        mod("wallet", 80, true), // blocker
        mod("studio", 60),
        mod("jobs", 20),
        mod("learn", 10),
      ],
      signalScores: new Map<ModuleSlug, number>([["studio", 9]]),
      preference: emptyPref({
        pinned: ["jobs"],
        hidden: ["learn"],
        desktopOrder: ["care"],
      }),
      device: "desktop",
    });
    // jobs (pin) → wallet (blocker) → care (user-ordered) → studio (signal) ; learn hidden
    assert.deepEqual(orderedSlugs(r), ["jobs", "wallet", "care", "studio"]);
    assert.deepEqual(r.hidden, ["learn"]);
    assert.equal(reasonOf(r, "jobs"), "user_pinned");
    assert.equal(reasonOf(r, "wallet"), "open_blocker");
    assert.equal(reasonOf(r, "care"), "user_ordered");
    assert.equal(reasonOf(r, "studio"), "high_signal_score");
  });
});
