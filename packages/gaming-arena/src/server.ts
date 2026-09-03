/**
 * @henryco/gaming-arena/server — the server-only authoritative half.
 *
 * The `server-only` guard makes it a build error to import this from a client
 * bundle. Re-exports the pure surface for convenience, then adds the privileged
 * orchestrators + persistence that run with the service-role client and call the
 * grant-locked SECURITY DEFINER gaming RPCs.
 */

import "server-only";

export * from "./index";

export * from "./server/supabase";
export * from "./server/entry-gate";
export * from "./server/persistence";
export * from "./server/match-actions";
export * from "./server/matchmaking";
