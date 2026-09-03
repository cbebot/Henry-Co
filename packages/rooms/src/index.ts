/**
 * @henryco/rooms — public surface.
 *
 * The canonical real-time room engine for every HenryCo portal. One
 * provider-abstracted package; zero per-portal video stack duplication.
 *
 * Subpath imports:
 *   import { createRoom, joinRoom } from "@henryco/rooms/server/actions";
 *   import { useRoomLifecycle } from "@henryco/rooms/hooks/use-room-lifecycle";
 *   import { RoomShell, PresencePane } from "@henryco/rooms/components";
 *   import { RoomsRealtimeProvider } from "@henryco/rooms/realtime";
 *   import {
 *     registerRoomsSupabaseFactory,
 *     registerRoomsServiceRoleFactory,
 *   } from "@henryco/rooms/server";
 *
 * The default barrel below re-exports types + error helpers + the
 * provider selector for convenience. The server actions and the
 * client hook are intentionally NOT re-exported here so a stray
 * default-import doesn't accidentally pull `server-only` into a
 * client bundle.
 */

export * from "./types";
export * from "./errors";
export {
  selectProvider,
  selectProviderName,
  type ProviderSelectorEnv,
} from "./provider-selector";
