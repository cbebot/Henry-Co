/**
 * V3-39 — the chrome-affordance ARBITRATION CONTRACT between the floating
 * next-action chip and the `IntelligenceLauncher` FAB (mounted bottom-right in
 * 9 division layouts, `apps/account/app/layout.tsx` et al.).
 *
 * ONE host geometry, no overlap, no z-fights — held as constants so the rule
 * is testable, not tribal knowledge:
 *
 *   - The launcher owns the corner: its root sits at
 *     `bottom: max(1rem, env(safe-area-inset-bottom))` (+ a mobile
 *     `--hc-il-lift` above a host bottom nav bar), `z-index: 60`, with a
 *     3.5rem FAB and a .75rem stack gap.
 *   - The chip NEVER contests it: it renders on the same right edge but its
 *     bottom offset ADDS the launcher clearance (FAB height + gap), so the two
 *     stack vertically — chip above, launcher below — and its z-index sits
 *     BELOW the launcher's, so the opened Intelligence panel always paints
 *     over the chip.
 *   - The chip mirrors the same mobile lift variable semantics
 *     (`--hc-na-lift`, fed by the SAME bottomOffset value the layout passes to
 *     the launcher), so both affordances rise together above the account
 *     bottom action bar.
 *
 * A structural test (`src/__tests__/next-action-arbitration.test.ts`) pins the
 * launcher's real stylesheet to the mirrored constants below — if the launcher
 * chrome ever changes (z-index, FAB size, corner base), the test fails and the
 * chip host must be re-arbitrated deliberately.
 */

/** Mirrors `.hc-il-root { z-index: 60 }` in IntelligenceLauncher.tsx. */
export const INTELLIGENCE_LAUNCHER_Z_INDEX = 60;

/** Mirrors `.hc-il-fab { width/height: 3.5rem }` in IntelligenceLauncher.tsx. */
export const INTELLIGENCE_LAUNCHER_FAB_REM = 3.5;

/** Mirrors `.hc-il-root { gap: .75rem }` — the launcher's own stack gap. */
export const INTELLIGENCE_LAUNCHER_GAP_REM = 0.75;

/** The corner base both affordances share (also the launcher's bottom rule). */
export const CHROME_CORNER_BOTTOM_BASE = "max(1rem,env(safe-area-inset-bottom))";

/** The chip paints UNDER the launcher layer — the opened panel always wins. */
export const NEXT_ACTION_CHIP_Z_INDEX = 55;

/**
 * Vertical clearance the chip reserves for the launcher: FAB height + gap.
 * Must always satisfy `>= INTELLIGENCE_LAUNCHER_FAB_REM + INTELLIGENCE_LAUNCHER_GAP_REM`.
 */
export const NEXT_ACTION_CHIP_CLEARANCE_REM = 4.25;
