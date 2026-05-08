/**
 * @henryco/dashboard-modules-wallet
 *
 * The wallet module package. Importing this module registers the
 * module with the shell registry as a side effect:
 *
 *   import "@henryco/dashboard-modules-wallet";   // registers
 *   import { walletModule } from "@henryco/dashboard-modules-wallet";
 *
 * Hosts (currently `apps/account`) should import the package once at
 * the layout root so the registration happens before any
 * `getEligibleModules(viewer)` walk fires.
 */

import { registerModule } from "@henryco/dashboard-shell";
import { walletModule } from "./module";

// Side-effect registration. Idempotent — re-importing this module is
// a no-op because `registerModule` checks slug + identity.
registerModule(walletModule);

export { walletModule };
export type {
  WalletSnapshot,
  WalletTransactionRow,
  WalletPayoutMethod,
} from "./data";
