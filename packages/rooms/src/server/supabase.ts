/**
 * @henryco/rooms/server/supabase — host-app Supabase client injection.
 *
 * The rooms package does NOT import a Supabase client directly. The host
 * app (e.g. apps/account, apps/jobs) passes its own server-supabase
 * factory via `registerRoomsSupabaseFactory()` once at module load, and
 * the server actions call `getRoomsSupabase()` from there.
 *
 * Why this indirection:
 *   - Different apps use different cookie helpers (`@supabase/ssr` vs
 *     bare `@supabase/supabase-js` with manual auth header injection).
 *     We don't want to lock the package to one.
 *   - The shell already has a sanctioned `createSupabaseServer()` per
 *     app; we pass it in rather than re-implement.
 *
 * Set-up (host app's `instrumentation.ts` or the layout that mounts
 * `<RoomShell>`):
 *
 *   import { registerRoomsSupabaseFactory } from "@henryco/rooms/server";
 *   import { createSupabaseServer } from "@/lib/supabase/server";
 *
 *   registerRoomsSupabaseFactory(createSupabaseServer);
 */

import "server-only";

/**
 * Minimum surface of `@supabase/supabase-js` the server actions exercise.
 * Loose typing — return values are `any` where we only use them via
 * chained methods (insert/update/select). The package never imports the
 * SDK; the host app supplies a real client at runtime.
 */
export type RoomsSupabaseLike = {
  from: (table: string) => {
    select: (cols?: string) => RoomsSupabaseSelectBuilder;
    insert: (
      values: Record<string, unknown> | ReadonlyArray<Record<string, unknown>>,
    ) => RoomsSupabaseInsertBuilder;
    update: (values: Record<string, unknown>) => RoomsSupabaseUpdateBuilder;
    upsert: (
      values: Record<string, unknown> | ReadonlyArray<Record<string, unknown>>,
      options?: { onConflict?: string },
    ) => RoomsSupabaseUpsertBuilder;
    delete: () => RoomsSupabaseUpdateBuilder;
  };
  rpc: (
    fn: string,
    args?: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
  auth: {
    getUser: () => Promise<{
      data: { user: { id: string; email?: string | null } | null };
      error: { message: string } | null;
    }>;
  };
};

export type RoomsSupabaseSelectBuilder = {
  eq: (column: string, value: unknown) => RoomsSupabaseSelectBuilder;
  in: (column: string, values: ReadonlyArray<unknown>) => RoomsSupabaseSelectBuilder;
  is: (column: string, value: unknown) => RoomsSupabaseSelectBuilder;
  order: (column: string, options?: { ascending?: boolean }) => RoomsSupabaseSelectBuilder;
  limit: (count: number) => RoomsSupabaseSelectBuilder;
  single: () => Promise<{
    data: Record<string, unknown> | null;
    error: { message: string; code?: string } | null;
  }>;
  maybeSingle: () => Promise<{
    data: Record<string, unknown> | null;
    error: { message: string } | null;
  }>;
  then: (
    onfulfilled?: (value: {
      data: ReadonlyArray<Record<string, unknown>> | null;
      error: { message: string } | null;
    }) => unknown,
    onrejected?: (reason: unknown) => unknown,
  ) => Promise<unknown>;
};

export type RoomsSupabaseInsertBuilder = {
  select: (cols?: string) => RoomsSupabaseSelectBuilder;
  then: (
    onfulfilled?: (value: {
      data: ReadonlyArray<Record<string, unknown>> | null;
      error: { message: string } | null;
    }) => unknown,
    onrejected?: (reason: unknown) => unknown,
  ) => Promise<unknown>;
};

export type RoomsSupabaseUpdateBuilder = {
  eq: (column: string, value: unknown) => RoomsSupabaseUpdateBuilder;
  in: (column: string, values: ReadonlyArray<unknown>) => RoomsSupabaseUpdateBuilder;
  is: (column: string, value: unknown) => RoomsSupabaseUpdateBuilder;
  select: (cols?: string) => RoomsSupabaseSelectBuilder;
  then: (
    onfulfilled?: (value: {
      data: ReadonlyArray<Record<string, unknown>> | null;
      error: { message: string } | null;
    }) => unknown,
    onrejected?: (reason: unknown) => unknown,
  ) => Promise<unknown>;
};

export type RoomsSupabaseUpsertBuilder = RoomsSupabaseInsertBuilder;

export type RoomsSupabaseFactory = () => RoomsSupabaseLike | Promise<RoomsSupabaseLike>;

let factory: RoomsSupabaseFactory | null = null;

/**
 * Host app calls this once at module load. Subsequent calls overwrite,
 * which is fine — the latest registration wins (useful for tests that
 * swap factories per case).
 */
export function registerRoomsSupabaseFactory(f: RoomsSupabaseFactory | null): void {
  factory = f;
}

/**
 * Resolve the configured Supabase client. Throws if the host hasn't
 * registered one — that's a programmer error, not a runtime degradation,
 * so we want it loud.
 */
export async function getRoomsSupabase(): Promise<RoomsSupabaseLike> {
  if (!factory) {
    throw new Error(
      "@henryco/rooms: registerRoomsSupabaseFactory() has not been called. " +
        "The host app must register its server-supabase factory before any " +
        "rooms server action runs. See packages/rooms/README.md.",
    );
  }
  return await factory();
}

/**
 * Service-role factory — separate registration so apps that only need
 * the authenticated path don't have to set up a service-role client
 * just to use rooms.
 *
 * Service role is used for: rooms_recordings INSERT/UPDATE (webhook
 * handler), forced participant cleanup, scheduled cron purges. No
 * client-side path ever touches the service-role client.
 */
let serviceRoleFactory: RoomsSupabaseFactory | null = null;

export function registerRoomsServiceRoleFactory(
  f: RoomsSupabaseFactory | null,
): void {
  serviceRoleFactory = f;
}

export async function getRoomsServiceRoleSupabase(): Promise<RoomsSupabaseLike | null> {
  if (!serviceRoleFactory) return null;
  return await serviceRoleFactory();
}
