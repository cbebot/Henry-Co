/**
 * HenryCo public-shell surface contract — use these patterns for menus, sheets, chips, and helper
 * panels so dark mode avoids “washed” white fills and light mode avoids muddy grays.
 *
 * Reference for visual QA: header mobile sheet, account dropdown, CTA row, hero overlap zones.
 */
export const HenryCoPublicSurfaceTokens = {
  /**
   * Premium floating public header chrome (one elevated bar, calm shadow).
   * Use with PublicHeader variant="floating".
   */
  floatingHeaderChrome:
    "overflow-hidden rounded-[1.75rem] border border-zinc-200/85 bg-white/97 shadow-[0_14px_34px_-22px_rgba(15,23,42,0.22),0_4px_14px_rgba(15,23,42,0.06)] backdrop-blur-0 lg:backdrop-blur-lg dark:border-white/12 dark:bg-[#0b1018]/96 dark:shadow-[0_20px_54px_-20px_rgba(0,0,0,0.72),0_8px_20px_rgba(0,0,0,0.45)]",

  /** Groups theme toggle + account chip into one intentional control strip */
  identityActionCluster:
    "flex items-center gap-0.5 rounded-full border border-zinc-200/75 bg-zinc-50/95 p-1 pl-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:border-zinc-700/85 dark:bg-zinc-900/70 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",

  /** Mobile nav sheet link — light: paper; dark: deep panel (not translucent white) */
  menuSheetLink:
    "rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-amber-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:shadow-[0_12px_40px_rgba(0,0,0,0.45)] dark:focus-visible:ring-amber-400/40 dark:focus-visible:ring-offset-zinc-950",

  /** Desktop toolbar ghost button (aux / secondary) in dark mode */
  toolbarGhostDark:
    "dark:border-white/12 dark:bg-zinc-950/55 dark:text-white/85 dark:hover:bg-zinc-900/75",

  /** Focus ring that stays visible on both themes without a white halo */
  focusRingAmber:
    "outline-none focus-visible:ring-2 focus-visible:ring-amber-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-amber-400/40 dark:focus-visible:ring-offset-zinc-950",
} as const;
