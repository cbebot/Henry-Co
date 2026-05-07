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
