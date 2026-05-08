/**
 * @henryco/dashboard-modules-marketplace
 *
 * The marketplace module package. Importing this module registers the
 * module with the shell registry as a side effect.
 */

import { registerModule } from "@henryco/dashboard-shell";
import { marketplaceModule } from "./module";

// Side-effect registration. Idempotent — re-importing this module
// is a no-op because `registerModule` checks slug + identity.
registerModule(marketplaceModule);

export { marketplaceModule };
export type { MarketplaceSnapshot, MarketplaceOrderInFlight, MarketplaceCuratedDeal, MarketplaceVendorStatus } from "./data";
