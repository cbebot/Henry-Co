/**
 * HenryCo public design tokens.
 *
 * These constants are the single source of truth for the public shell visual
 * language. Every shared primitive (cards, badges, heroes, loaders, toasts) and
 * every division shell that wants ecosystem parity should consume tokens from
 * here instead of inventing their own colors, shadows, radii, or motion values.
 *
 * Goals:
 *  - feel premium, global, calm, expensive-in-a-good-way
 *  - keep light + dark theme parity without muddy fills or washed whites
 *  - stay mobile-first (iPhone/Android safe areas, tap targets, reduced motion)
 *  - be additive (never break existing division CSS)
 */

export const PublicBrandTokens = {
  /** Primary accent ramp (amber/brass — brand signature). */
  accent: {
    base: "#C9A227",
    baseSoft: "rgba(201,162,39,0.14)",
    baseRing: "rgba(201,162,39,0.32)",
    onDark: "#E8C24F",
    onDarkSoft: "rgba(232,194,79,0.14)",
    deep: "#9A6F2E",
  },
  /** Semantic feedback ramp (kept restrained, not dramatic). */
  feedback: {
    success: "#2E7D59",
    successSoft: "rgba(46,125,89,0.12)",
    warning: "#B07202",
    warningSoft: "rgba(176,114,2,0.12)",
    danger: "#B4322E",
    dangerSoft: "rgba(180,50,46,0.12)",
    info: "#2F5B8C",
    infoSoft: "rgba(47,91,140,0.12)",
  },
  /** Shell surface palette — mapped to CSS vars declared in HenryCoThemeBlocking. */
  surface: {
    page: "var(--site-bg, #050816)",
    raised: "var(--site-surface, rgba(255,255,255,0.05))",
    elevated: "var(--site-surface-strong, rgba(255,255,255,0.08))",
    border: "var(--site-border, rgba(255,255,255,0.10))",
    text: "var(--site-text, rgba(255,255,255,0.96))",
    textSoft: "var(--site-text-soft, rgba(255,255,255,0.70))",
    textMuted: "var(--site-text-muted, rgba(255,255,255,0.52))",
  },
} as const;

/** Typography scale — composes Tailwind-friendly utility strings. */
export const PublicTypographyTokens = {
  eyebrow:
    "text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:color-mix(in_srgb,var(--site-accent,#C9A227)_80%,#6b5a1a_20%)] dark:text-amber-300/80",
  display:
    "text-[2.25rem] font-black tracking-[-0.035em] text-zinc-950 dark:text-white sm:text-[2.75rem] md:text-[3.25rem] leading-[1.05]",
  heading:
    "text-2xl font-black tracking-[-0.02em] text-zinc-950 dark:text-white sm:text-3xl md:text-[2.125rem] leading-[1.15]",
  subheading:
    "text-lg font-semibold tracking-[-0.01em] text-zinc-900 dark:text-white sm:text-xl",
  lede:
    "text-[0.95rem] leading-7 text-zinc-600 dark:text-white/70 sm:text-base",
  body:
    "text-sm leading-7 text-zinc-700 dark:text-white/75",
  bodyMuted:
    "text-sm leading-7 text-zinc-500 dark:text-white/55",
  caption:
    "text-[12px] leading-5 text-zinc-500 dark:text-white/55",
} as const;

/** Spacing rhythm — mobile-first defaults with comfortable desktop breathing. */
export const PublicSpacingTokens = {
  /** Standard horizontal page gutter. */
  sectionX: "px-4 sm:px-6 lg:px-8",
  /** Loose gutter for heroes + full-bleed marketing sections. */
  sectionXLoose: "px-5 sm:px-8 lg:px-10",
  /** Vertical rhythm between sections. */
  sectionY: "py-12 sm:py-16 lg:py-20",
  sectionYTight: "py-8 sm:py-10",
  sectionYHero: "pt-14 pb-16 sm:pt-18 sm:pb-20 lg:pt-24 lg:pb-28",
  /** Stack gap between header + block + supporting copy. */
  stackTight: "space-y-3",
  stackSnug: "space-y-4",
  stackComfort: "space-y-6",
  stackLoose: "space-y-10",
  /** Toolbar row. */
  headerToolbarY: "py-3.5 sm:py-4",
  /** Card inner padding. */
  cardPad: "p-6 sm:p-7",
  cardPadTight: "p-5",
  cardPadRoomy: "p-7 sm:p-8 md:p-10",
  /** Standard content width. */
  shellMax: "max-w-7xl",
  shellMaxProse: "max-w-3xl",
} as const;

/** Radius scale — chosen so cards/buttons/inputs stay visually related. */
export const PublicRadiusTokens = {
  xs: "rounded-lg",
  sm: "rounded-xl",
  md: "rounded-2xl",
  lg: "rounded-[1.5rem]",
  xl: "rounded-[1.85rem]",
  pill: "rounded-full",
  cardRaw: "1.75rem",
} as const;

/** Shadow / elevation ramp — calm, never showy. */
export const PublicElevationTokens = {
  flat:
    "shadow-none",
  hairline:
    "shadow-[0_1px_0_rgba(15,23,42,0.04)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
  resting:
    "shadow-[0_10px_30px_-24px_rgba(15,23,42,0.28),0_2px_6px_rgba(15,23,42,0.04)] dark:shadow-[0_14px_34px_rgba(0,0,0,0.48)]",
  lifted:
    "shadow-[0_18px_48px_-28px_rgba(15,23,42,0.32),0_6px_16px_rgba(15,23,42,0.08)] dark:shadow-[0_22px_60px_rgba(0,0,0,0.56)]",
  elevated:
    "shadow-[0_28px_80px_-36px_rgba(15,23,42,0.36),0_12px_28px_rgba(15,23,42,0.10)] dark:shadow-[0_34px_94px_rgba(0,0,0,0.6)]",
  haloAmber:
    "shadow-[0_22px_80px_-34px_rgba(201,162,39,0.45),0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_26px_84px_rgba(201,162,39,0.18)]",
} as const;

/** Motion presets — respect `prefers-reduced-motion` at the CSS layer. */
export const PublicMotionTokens = {
  dropdownMs: 150,
  routeFadeMs: 200,
  sheetEase: "cubic-bezier(0.22, 1, 0.36, 1)",
  /** Reusable Tailwind className for calm hover lift (honours reduced motion). */
  hoverLift:
    "transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_22px_54px_-28px_rgba(15,23,42,0.32)] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
  /** Subtle press feedback. */
  pressDown:
    "active:translate-y-[1px] transition-transform duration-150 ease-out motion-reduce:transition-none motion-reduce:active:translate-y-0",
} as const;

/** Focus ring — premium amber, readable on both themes. */
export const PublicFocusTokens = {
  ringAmber:
    "outline-none focus-visible:ring-2 focus-visible:ring-amber-500/55 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-amber-400/50 dark:focus-visible:ring-offset-[#0a0f14]",
  ringAmberTight:
    "outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-amber-400/55 dark:focus-visible:ring-offset-[#0a0f14]",
} as const;

/** Safe-area helpers so floating surfaces (toasts, dock, mobile sheets) don't collide with iPhone home bar. */
export const PublicSafeAreaTokens = {
  bottom: "pb-[max(env(safe-area-inset-bottom,0px),0.75rem)]",
  bottomLoose: "pb-[max(env(safe-area-inset-bottom,0px),1.25rem)]",
  top: "pt-[max(env(safe-area-inset-top,0px),0.5rem)]",
  floatBottomRight:
    "bottom-[max(env(safe-area-inset-bottom,0px),1rem)] right-[max(env(safe-area-inset-right,0px),1rem)]",
  floatTopRight:
    "top-[max(env(safe-area-inset-top,0px),0.75rem)] right-[max(env(safe-area-inset-right,0px),0.75rem)]",
} as const;

/** Premium panel surface class — the shared card/surface visual language. */
export const PublicSurfaceStyles = {
  cardRest:
    "rounded-[1.75rem] border border-zinc-200/85 bg-white shadow-[0_10px_30px_-24px_rgba(15,23,42,0.28),0_2px_6px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-[#0b1018]/85 dark:shadow-[0_22px_60px_rgba(0,0,0,0.56)]",
  cardInteractive:
    "rounded-[1.75rem] border border-zinc-200/85 bg-white shadow-[0_10px_30px_-24px_rgba(15,23,42,0.28),0_2px_6px_rgba(15,23,42,0.04)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-zinc-300/80 hover:shadow-[0_22px_54px_-28px_rgba(15,23,42,0.34),0_6px_16px_rgba(15,23,42,0.08)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-white/10 dark:bg-[#0b1018]/85 dark:shadow-[0_22px_60px_rgba(0,0,0,0.56)] dark:hover:border-white/15 dark:hover:bg-[#0b1018]/95",
  cardQuiet:
    "rounded-[1.5rem] border border-zinc-200/70 bg-zinc-50/60 dark:border-white/8 dark:bg-white/[0.03]",
  surfaceGlass:
    "rounded-[1.85rem] border border-white/40 bg-white/70 shadow-[0_28px_80px_-36px_rgba(15,23,42,0.36)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/55 dark:border-white/10 dark:bg-white/[0.05] dark:shadow-[0_34px_94px_rgba(0,0,0,0.6)]",
  dividerSoft:
    "h-px w-full bg-gradient-to-r from-transparent via-zinc-200 to-transparent dark:via-white/10",
  dividerAmber:
    "h-px w-full bg-gradient-to-r from-transparent via-amber-400/50 to-transparent",
} as const;

/** Consolidated namespace so consumers can do `PublicDesignTokens.color.accent.base`. */
export const PublicDesignTokens = {
  brand: PublicBrandTokens,
  typography: PublicTypographyTokens,
  spacing: PublicSpacingTokens,
  radius: PublicRadiusTokens,
  elevation: PublicElevationTokens,
  motion: PublicMotionTokens,
  focus: PublicFocusTokens,
  safeArea: PublicSafeAreaTokens,
  surface: PublicSurfaceStyles,
} as const;

export type PublicDesignTokensNamespace = typeof PublicDesignTokens;
