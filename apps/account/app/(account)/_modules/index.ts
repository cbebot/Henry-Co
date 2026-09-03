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
import "@henryco/dashboard-modules-wallet";

// Division modules — each registers its slot so the rail, Smart Home
// grid, command palette, and module router surface it for eligible
// viewers. Each canonical surface is the live top-level division route
// (e.g. `/care`, `/jobs`) which the module's `homeHref` deep-links to.
import "@henryco/dashboard-modules-care";
import "@henryco/dashboard-modules-jobs";
import "@henryco/dashboard-modules-learn";
import "@henryco/dashboard-modules-logistics";
import "@henryco/dashboard-modules-property";
import "@henryco/dashboard-modules-play";
import "@henryco/dashboard-modules-studio";
import "@henryco/dashboard-modules-business";

// Hidden future modules — register their slots so the rail surfaces
// them automatically once each division flips its `MODULE_ENABLED`
// constant in `packages/dashboard-modules-{building,hotel}/src/module.tsx`.
import "@henryco/dashboard-modules-building";
import "@henryco/dashboard-modules-hotel";
