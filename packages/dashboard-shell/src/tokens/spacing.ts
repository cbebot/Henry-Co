/**
 * @henryco/dashboard-shell — spacing tokens.
 *
 * The HenryCo spacing scale. Multiples of 4px (Tailwind alignment) up
 * to 56px; beyond that, layout container constraints take over.
 *
 * Naming intent:
 *   - hairline: 1px / 2px borders
 *   - inset: padding inside surface primitives
 *   - row: vertical rhythm between siblings
 *   - section: vertical rhythm between major regions
 *   - chrome: shell-chrome dimensions (rail width, drawer width, etc.)
 */

export const SPACING = {
  px: "1px",
  hairline: "2px",
  inset: {
    sm: "0.5rem", // 8px
    md: "0.75rem", // 12px
    lg: "1rem", // 16px
    xl: "1.5rem", // 24px
  },
  row: {
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem",
    xxl: "2rem", // 32px
  },
  section: {
    sm: "1rem",
    md: "1.5rem",
    lg: "2rem",
    xl: "3rem", // 48px
  },
  chrome: {
    railWidth: "16rem", // 256px — desktop rail
    railWidthCollapsed: "4rem", // 64px — icons-only
    drawerWidth: "22rem", // 352px — context drawer
    bottomBarHeight: "3.5rem", // 56px — DASH-7 mobile bottom bar
    identityBarHeight: "3.5rem",
  },
} as const;

/**
 * Common border-radius values. Shell primitives use `lg` for cards,
 * `xl` for hero surfaces, and `pill` for chips/badges/role pills.
 */
export const RADIUS = {
  sm: "0.5rem", // 8px
  md: "0.75rem", // 12px
  lg: "1rem", // 16px
  xl: "1.5rem", // 24px
  xxl: "1.75rem", // 28px
  pill: "9999px",
} as const;
