/**
 * Module registration site for the unified shell on apps/account.
 *
 * Importing this file as a side effect causes the registered modules
 * to call `registerModule()` against the shell registry. Every page
 * that consumes `getEligibleModules(viewer)` (the WorkspaceRail, the
 * home-page Smart Home grid, the catch-all `/modules/[...slug]/page.tsx`
 * router) imports this file once at the top level.
 *
 * Adding a new module = adding an import statement here. The
 * registry's idempotency guard (`registerModule` no-ops on identical
 * slug + module-object) makes double-imports safe across HMR.
 */

import "@henryco/dashboard-modules-account";
import "@henryco/dashboard-modules-marketplace";
import "@henryco/dashboard-modules-support";
import "@henryco/dashboard-modules-wallet";

// Hidden future modules — register their slots so the rail surfaces
// them automatically once each division flips its `MODULE_ENABLED`
// constant in `packages/dashboard-modules-{building,hotel}/src/module.tsx`.
import "@henryco/dashboard-modules-building";
import "@henryco/dashboard-modules-hotel";
