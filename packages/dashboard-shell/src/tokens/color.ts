/**
 * @henryco/dashboard-shell — color tokens.
 *
 * Primary palette is HenryCo black/gold/cream — never blue. Closes
 * anti-pattern #15 ("Primary color = blue"). Tailwind defaults are
 * forbidden in shell chrome.
 *
 * The shell exposes tokens as CSS custom properties + a typed const
 * record. Components either reference the CSS variable (preferred for
 * surfaces a host app may theme via division-specific token overrides)
 * or import the constant directly (for one-off hex values like the
 * focus ring).
 *
 * Division accents come from `packages/config/company.ts:COMPANY.divisions`
 * — never re-declared here. The shell reads them at render time so
 * changing a division accent in `company.ts` propagates automatically.
 */

/**
 * The HenryCo brand colors — non-negotiable across every shell surface.
 * These match `apps/account/lib/account-localization.ts`'s ink/gold/red
 * palette and `packages/config/company.ts:COMPANY.divisions.hub`'s
 * gold accent (`#C9A227`).
 */
export const BRAND = {
  /** Pure paper — primary text on light surfaces, surface backgrounds when inverted */
  ink: "#0A0A0A",
  /** Warm off-white from V5-CLEAR Phase 3 — primary text on dark surfaces */
  inkOnDark: "#F5F1E8",
  /** Warm gray on dark — secondary text */
  inkSoftOnDark: "#C9C2B6",
  /** Cooler gray on dark — tertiary / muted */
  inkMutedOnDark: "#8A857C",
  /** Primary text on light — V5-CLEAR existing zinc-950 */
  inkOnLight: "#18181B",
  /** Cream — soft surface background */
  cream: "#F5F1E8",
  /** Calm gold — primary accent */
  gold: "#C9A227",
  /** Strong gold — hover/emphasis */
  goldStrong: "#F2D77A",
  /** Gold-on-white WCAG-AA text color */
  goldText: "#8A6F00",
  /** Soft gold — chip / badge background */
  goldSoft: "#FFF8E2",
  /** Hairline divider on light */
  hairlineLight: "rgba(10, 10, 10, 0.08)",
  /** Hairline divider on dark */
  hairlineDark: "rgba(245, 241, 232, 0.12)",
  /** Surface (light) */
  surfaceLight: "#FFFFFF",
  /** Surface (dark) — V2-NOT-02-A premium dark backplate */
  surfaceDark: "#050816",
  /** Surface elevated (light) */
  surfaceElevatedLight: "#F8F7F3",
  /** Surface elevated (dark) */
  surfaceElevatedDark: "#0A0E20",
} as const;

/**
 * Status accents — used by SignalCard, MetricCard trend, ActionButton
 * success-lock, and EmptyState's exception body.
 *
 * NOT to be used as primary CTA fills. Primary is brand gold; status
 * accents are visual states, not affordances.
 */
export const STATUS = {
  success: "#1F8B4C",
  warning: "#C9A227",
  urgent: "#C04A1F",
  security: "#B91C1C",
  info: "#4B5563",
} as const;

/**
 * The CSS custom property names every shell component reads. Host apps
 * override at the layout root (`html` or `body`) via a stylesheet
 * scoped to their theme. Defaults below are HenryCo brand.
 *
 * Naming convention: `--hc-<surface>-<role>` so the namespace cannot
 * collide with division-local tokens (`--studio-*`, `--market-*`, etc.).
 */
export const CSS_VARS = {
  ink: "--hc-ink",
  inkSoft: "--hc-ink-soft",
  inkMuted: "--hc-ink-muted",
  surface: "--hc-surface",
  surfaceElevated: "--hc-surface-elevated",
  hairline: "--hc-hairline",
  accent: "--hc-accent",
  accentStrong: "--hc-accent-strong",
  accentText: "--hc-accent-text",
  accentSoft: "--hc-accent-soft",
  focusRing: "--hc-focus-ring",
} as const;

/**
 * The default CSS-variable values for a HenryCo-brand shell. Host apps
 * may override per-division by setting any of `CSS_VARS` on the layout
 * root. Each shell primitive references these via `var(--hc-*)`.
 */
export const DEFAULT_CSS_VAR_VALUES = {
  [CSS_VARS.ink]: BRAND.ink,
  [CSS_VARS.inkSoft]: "rgba(10, 10, 10, 0.65)",
  [CSS_VARS.inkMuted]: "rgba(10, 10, 10, 0.45)",
  [CSS_VARS.surface]: BRAND.surfaceLight,
  [CSS_VARS.surfaceElevated]: BRAND.surfaceElevatedLight,
  [CSS_VARS.hairline]: BRAND.hairlineLight,
  [CSS_VARS.accent]: BRAND.gold,
  [CSS_VARS.accentStrong]: BRAND.goldStrong,
  [CSS_VARS.accentText]: BRAND.goldText,
  [CSS_VARS.accentSoft]: BRAND.goldSoft,
  [CSS_VARS.focusRing]: BRAND.gold,
} as const;
