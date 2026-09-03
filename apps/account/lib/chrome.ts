/**
 * The account app's shared bottom-right chrome arbitration value.
 *
 * On mobile the dashboard's bottom action bar (3.5rem) owns the bottom edge;
 * every floating corner affordance — the IntelligenceLauncher FAB (root
 * layout) and the V3-39 next-action chip (account shell) — lifts by the SAME
 * value (bar height + 1rem gap) so the two rise together and never collide
 * with the bar or each other. ONE constant, two mounts: the chip's clearance
 * contract (`@henryco/ui/next-action` arbitration.ts) assumes both affordances
 * share this lift; `lib/next-action/mount-arbitration.test.ts` pins it.
 */
export const ACCOUNT_CHROME_MOBILE_LIFT = "calc(3.5rem + 1rem)";
