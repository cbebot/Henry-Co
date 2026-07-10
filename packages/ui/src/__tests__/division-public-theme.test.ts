import test from "node:test";
import assert from "node:assert/strict";

import {
  createDivisionPublicThemeStyle,
  type DivisionPublicThemeOptions,
} from "../public-shell/division-public-theme";

/**
 * Pixel-identity proof for the token consolidation (2026-07-10).
 *
 * Every `expected` block below is transcribed VERBATIM from the legacy
 * per-app `*_PUBLIC_THEME_STYLE` literals as they existed before the
 * factory migration (interim / pre-owned-type branch). If the factory
 * ever emits anything else for these inputs, a public surface changed
 * pixels — the test failing IS the review gate.
 */

const SERIF_TAIL =
  '"Iowan Old Style", "Palatino Linotype", "Baskerville", "Times New Roman", Times, serif';
const INTERIM_SANS =
  'var(--font-manrope-public), system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const SEAM_BRIDGE = {
  "--hc-font-display": "var(--home-font-display)",
  "--hc-font-body": "var(--home-font-sans)",
  "--hc-font-reading": "var(--home-font-display)",
};

type Fixture = {
  options: DivisionPublicThemeOptions;
  expected: Record<string, string>;
};

function interimCore(
  accent: string,
  accentText: string,
  accentTextDark: string,
  serifVar: string,
  aliasVars: string[],
  displayOverride?: string,
): Record<string, string> {
  const display = displayOverride ?? `var(${serifVar}), ${SERIF_TAIL}`;
  const core: Record<string, string> = {
    fontFamily: "var(--home-font-sans)",
    "--home-font-sans": INTERIM_SANS,
    "--accent": accent,
    "--accent-text": accentText,
    "--accent-text-dark": accentTextDark,
    "--home-font-display": display,
  };
  for (const v of aliasVars) core[v] = display;
  return { ...core, ...SEAM_BRIDGE };
}

const FIXTURES: Record<string, Fixture> = {
  marketplace: {
    options: {
      division: "marketplace",
      serifFontVar: "--font-marketplace-display",
      displayAliasVars: ["--font-marketplace-display"],
    },
    expected: interimCore("#B2863B", "#7E5E1F", "#E3C088", "--font-marketplace-display", [
      "--font-marketplace-display",
    ]),
  },
  care: {
    options: { division: "care", displayAliasVars: ["--font-display"] },
    expected: interimCore("#6B7CFF", "#4F5BD0", "#AAB4FF", "--font-fraunces", [
      "--font-display",
    ]),
  },
  studio: {
    options: { division: "studio", displayAliasVars: ["--font-studio-display"] },
    expected: interimCore("#4AC1C5", "#1F7375", "#63D2D5", "--font-fraunces", [
      "--font-studio-display",
    ]),
  },
  jobs: {
    options: {
      division: "jobs",
      displayAliasVars: ["--font-jobs-display"],
      // Jobs hand-tunes AA below the config value on warm paper — the
      // override documents the divergence (config accentText #0E7C86 is
      // also the fill accent and does not clear AA as text).
      accentTextOverride: "#0B6B74",
    },
    expected: interimCore("#0E7C86", "#0B6B74", "#5CC9D0", "--font-fraunces", [
      "--font-jobs-display",
    ]),
  },
  learn: {
    options: { division: "learn", displayAliasVars: ["--font-learn-display"] },
    expected: interimCore("#3C8C7A", "#2E6E5F", "#6FD0B6", "--font-fraunces", [
      "--font-learn-display",
    ]),
  },
  property: {
    // Property's interim fallback chain inserts "Cormorant Garamond" ahead of
    // the shared tail — preserved verbatim via serifStackOverride.
    options: {
      division: "property",
      serifStackOverride:
        'var(--font-property-display), "Cormorant Garamond", "Iowan Old Style", "Palatino Linotype", "Baskerville", "Times New Roman", Times, serif',
      displayAliasVars: ["--font-property-display"],
    },
    expected: interimCore(
      "#B06C3E",
      "#7A4924",
      "#E8B894",
      "--font-property-display",
      ["--font-property-display"],
      'var(--font-property-display), "Cormorant Garamond", "Iowan Old Style", "Palatino Linotype", "Baskerville", "Times New Roman", Times, serif',
    ),
  },
  logistics: {
    options: { division: "logistics", displayAliasVars: ["--font-logistics-display"] },
    expected: interimCore("#D06F32", "#9D4F1F", "#F3A877", "--font-fraunces", [
      "--font-logistics-display",
    ]),
  },
};

test("interim (flag dark): factory core equals every legacy literal verbatim", () => {
  delete process.env.NEXT_PUBLIC_ONYX_TYPE_LIVE;
  for (const [name, fixture] of Object.entries(FIXTURES)) {
    assert.deepEqual(
      createDivisionPublicThemeStyle(fixture.options),
      fixture.expected,
      `${name} core drifted from the legacy literal`,
    );
  }
});

test("owned-type live: display/sans route through the brand family tokens", () => {
  process.env.NEXT_PUBLIC_ONYX_TYPE_LIVE = "1";
  try {
    const style = createDivisionPublicThemeStyle({
      division: "care",
      displayAliasVars: ["--font-display"],
    }) as Record<string, string>;
    assert.equal(style["--home-font-display"], "var(--hc-font-serif)");
    assert.equal(style["--home-font-sans"], "var(--hc-font-sans)");
    assert.equal(style["--font-display"], "var(--hc-font-serif)");
    // Accent truth is flag-independent.
    assert.equal(style["--accent"], "#6B7CFF");
  } finally {
    delete process.env.NEXT_PUBLIC_ONYX_TYPE_LIVE;
  }
});

test("extra spreads last and may override core (division remap blocks win)", () => {
  delete process.env.NEXT_PUBLIC_ONYX_TYPE_LIVE;
  const style = createDivisionPublicThemeStyle({
    division: "marketplace",
    serifFontVar: "--font-marketplace-display",
    extra: {
      "--market-brass": "var(--home-accent)",
      "--hc-font-body": "overridden",
    },
  }) as Record<string, string>;
  assert.equal(style["--market-brass"], "var(--home-accent)");
  assert.equal(style["--hc-font-body"], "overridden");
});

test("accentTextOnDark falls back to accentText when config omits it", () => {
  delete process.env.NEXT_PUBLIC_ONYX_TYPE_LIVE;
  // hub has no public *_PUBLIC_THEME_STYLE and no accentTextOnDark.
  const style = createDivisionPublicThemeStyle({ division: "hub" }) as Record<
    string,
    string
  >;
  assert.equal(style["--accent-text-dark"], style["--accent-text"]);
});
