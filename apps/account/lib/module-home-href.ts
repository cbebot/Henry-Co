/**
 * resolveModuleHomeHref — the single source of truth for where a module
 * entry links from the desktop rail, the mobile Modules drawer, and the
 * Cmd+1..9 jump list.
 *
 * Background: those three surfaces historically sent every module to the
 * generic `/modules/<slug>` catch-all. On mobile that meant tapping
 * "Wallet" in the Modules navigator landed on the `/modules/wallet`
 * summary instead of the real wallet at `/wallet` (which is exactly
 * where the desktop sidebar goes) — the reported "wallet never opens
 * from Modules" bug. A module can now declare `homeHref` to send these
 * entries straight to its canonical surface.
 *
 * Resolution order:
 *   1. `customer-overview` → `/` (the account home / protected-route
 *      landing) — preserved regardless of any declared homeHref.
 *   2. a declared `homeHref` → that route (e.g. wallet → `/wallet`).
 *   3. otherwise → `/modules/<slug>` (the catch-all module router).
 *
 * Pure + dependency-free so it runs under `tsx --test` and stays in sync
 * across every consuming surface.
 */
export type ModuleHomeHrefInput = {
  /** The module's stable slug. */
  slug: string;
  /** Optional canonical home route declared by the module. */
  homeHref?: string;
};

export function resolveModuleHomeHref(module: ModuleHomeHrefInput): string {
  if (module.slug === "customer-overview") return "/";
  return module.homeHref ?? `/modules/${module.slug}`;
}
