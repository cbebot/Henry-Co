/**
 * @henryco/rooms/server — server-side barrel.
 *
 * Re-exports the host-app registration helpers and the typed server
 * actions. The actions live in `./actions.ts` (which carries the
 * `"use server"` directive at file scope). This barrel exists so a
 * consumer can do:
 *
 *   import {
 *     registerRoomsSupabaseFactory,
 *     registerRoomsServiceRoleFactory,
 *   } from "@henryco/rooms/server";
 *
 * without needing two subpath imports.
 */

import "server-only";

export {
  registerRoomsSupabaseFactory,
  registerRoomsServiceRoleFactory,
  getRoomsSupabase,
  getRoomsServiceRoleSupabase,
  type RoomsSupabaseLike,
  type RoomsSupabaseFactory,
} from "./supabase";
