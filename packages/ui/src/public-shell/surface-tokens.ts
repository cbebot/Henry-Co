/**
 * HenryCo public-shell surface contract — use these patterns for menus, sheets, chips, and helper
 * panels so dark mode avoids “washed” white fills and light mode avoids muddy grays.
 *
 * Reference for visual QA: header mobile sheet, account dropdown, CTA row, hero overlap zones.
 */
export const HenryCoPublicSurfaceTokens = {
  /** Mobile nav sheet link — light: paper; dark: deep panel (not translucent white) */
  menuSheetLink:
    "rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:shadow-[0_12px_40px_rgba(0,0,0,0.45)]",

  /** Desktop toolbar ghost button (aux / secondary) in dark mode */
  toolbarGhostDark:
    "dark:border-white/12 dark:bg-zinc-950/55 dark:text-white/85 dark:hover:bg-zinc-900/75",

  /** Focus ring that stays visible on both themes without a white halo */
  focusRingAmber:
    "outline-none focus-visible:ring-2 focus-visible:ring-amber-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-amber-400/40 dark:focus-visible:ring-offset-zinc-950",
} as const;
