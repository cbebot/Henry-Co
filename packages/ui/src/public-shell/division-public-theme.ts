import type { CSSProperties } from "react";
import {
  getDivisionConfig,
  type DivisionConfig,
  type DivisionKey,
} from "@henryco/config";
import { onyxTypeAttr } from "../fonts/flag";

/**
 * createDivisionPublicThemeStyle — ONE recipe for the per-division
 * `*_PUBLIC_THEME_STYLE` objects (token consolidation, 2026-07-10).
 *
 * Before this factory, seven apps (marketplace/care/studio/jobs/learn/
 * property/logistics) each hand-maintained an identical core: the accent
 * triplet, the owned-type live/interim display+sans switching, and the
 * READING-01 `--hc-font-*` seam bridge. The copies had already forked once
 * (care hardcoded its accent instead of reading `company.ts`). The factory
 * owns exactly that provably-common core; everything a division does
 * DIFFERENTLY (its legacy `--<division>-*` alias map, its `--hc-*` remap
 * choices) stays app-local via `extra` — those blocks diverge deliberately
 * per division and unifying them would change pixels.
 *
 * Accent truth: `company.ts` (`accent`, `accentText`, `accentTextOnDark`).
 * `accentTextOverride` exists for divisions that hand-tune AA below the
 * config value on the public canvas (jobs) — the override documents the
 * divergence instead of silently forking config.
 */
export type DivisionPublicThemeOptions = {
  division: DivisionKey;
  /**
   * The `next/font` variable the interim serif stack resolves from.
   * Defaults to the shared Fraunces handle; marketplace passes its
   * root-layout handle (`--font-marketplace-display`).
   */
  serifFontVar?: string;
  /**
   * Full interim display stack when the division's fallback chain differs
   * from the shared tail (property inserts "Cormorant Garamond"). Wins over
   * `serifFontVar`. The owned-type live branch is unaffected.
   */
  serifStackOverride?: string;
  /**
   * Division-local var name(s) that must also carry the display stack
   * (e.g. `--font-studio-display` so `.studio-display` adopts the serif).
   */
  displayAliasVars?: readonly string[];
  /**
   * Hand-tuned AA accent-as-text on the public canvas where the division
   * deliberately deviates from `company.ts` `accentText` (jobs: #0B6B74
   * vs config #0E7C86). Prefer fixing config when the deviation is not
   * load-bearing elsewhere.
   */
  accentTextOverride?: string;
  /**
   * Division-local tokens spread LAST (they may override core entries):
   * the legacy `--<division>-*` → `--home-*` alias map and the division's
   * `--hc-*` remap block.
   */
  extra?: Record<string, string>;
};

const SANS_TAIL =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const SERIF_TAIL =
  '"Iowan Old Style", "Palatino Linotype", "Baskerville", "Times New Roman", Times, serif';

export function createDivisionPublicThemeStyle(
  options: DivisionPublicThemeOptions,
): CSSProperties {
  // Widen the const-narrowed literal to just the accent fields so the
  // OPTIONAL accentTextOnDark reads cleanly on divisions that omit it
  // (the full DivisionConfig shape rejects the readonly publicNav literal).
  const division: Pick<
    DivisionConfig,
    "accent" | "accentText" | "accentTextOnDark"
  > = getDivisionConfig(options.division);
  const serifFontVar = options.serifFontVar ?? "--font-fraunces";

  // Owned type — when the flag is live at build, the public marketing
  // subtree routes through the shared brand family tokens instead of the
  // interim Fraunces/Manrope next/font handles. Pre-reveal keeps the
  // interim faces (identical to before). The --hc-font-* entries below
  // reference --home-font-*, so they flip automatically.
  const live = onyxTypeAttr() === "live";
  const homeDisplay = live
    ? "var(--hc-font-serif)"
    : options.serifStackOverride ?? `var(${serifFontVar}), ${SERIF_TAIL}`;
  const homeSans = live
    ? "var(--hc-font-sans)"
    : `var(--font-manrope-public), ${SANS_TAIL}`;

  const style: Record<string, string> = {
    fontFamily: "var(--home-font-sans)",
    "--home-font-sans": homeSans,
    "--accent": division.accent,
    "--accent-text": options.accentTextOverride ?? division.accentText,
    "--accent-text-dark": division.accentTextOnDark ?? division.accentText,
    "--home-font-display": homeDisplay,
  };
  for (const aliasVar of options.displayAliasVars ?? []) {
    style[aliasVar] = homeDisplay;
  }

  // READING-01 seam bridge: the --hc-font-* tokens compute at :root (their
  // inner var() freezes there), so the canonical seam must be re-declared
  // on THIS element — where the font .variable classes resolve — for
  // .hc-prose / .hc-font-display / .hc-font-reading to render the loaded
  // faces.
  style["--hc-font-display"] = "var(--home-font-display)";
  style["--hc-font-body"] = "var(--home-font-sans)";
  style["--hc-font-reading"] = "var(--home-font-display)";

  return { ...style, ...options.extra } as CSSProperties;
}
