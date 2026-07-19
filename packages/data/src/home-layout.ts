import "server-only";

import type { UnifiedViewer } from "@henryco/auth";
import type { TypedSupabaseClient } from "./client";
import type { Database } from "./database.types";

/**
 * @henryco/data/home-layout — V3-34 per-user home-layout persistence.
 *
 * user_home_layouts is USER-OWNED data: reads and writes flow through the
 * viewer's AUTHENTICATED (session-bound) Supabase client, never the service-role
 * admin client (the prompt's hard line — "no admin-client reads for layout").
 * The client is INJECTED so this package stays decoupled from the app's auth
 * plumbing and so the RLS owner-only policy is exercised as the real request
 * role. Slug validation against the live module register + telemetry/audit live
 * at the account layer (which owns @henryco/dashboard-shell + @henryco/observability);
 * this helper only persists already-validated ModuleSlug strings.
 */

export type HomeLayoutSurface = "account" | "owner" | "staff";

export type UserHomeLayout = {
  userId: string;
  surface: HomeLayoutSurface;
  desktopModuleOrder: string[];
  mobileModuleOrder: string[];
  hiddenModules: string[];
  pinnedModules: string[];
  lastPersonalizedAt: string;
  personalizationSignalVersion: number;
  updatedAt: string;
};

export type UserHomeLayoutPatch = {
  desktopModuleOrder?: string[];
  mobileModuleOrder?: string[];
  hiddenModules?: string[];
  pinnedModules?: string[];
};

type HomeLayoutRow = Database["public"]["Tables"]["user_home_layouts"]["Row"];
type HomeLayoutInsert =
  Database["public"]["Tables"]["user_home_layouts"]["Insert"];

function mapRow(row: HomeLayoutRow): UserHomeLayout {
  return {
    userId: row.user_id,
    surface: row.surface as HomeLayoutSurface,
    desktopModuleOrder: row.desktop_module_order ?? [],
    mobileModuleOrder: row.mobile_module_order ?? [],
    hiddenModules: row.hidden_modules ?? [],
    pinnedModules: row.pinned_modules ?? [],
    lastPersonalizedAt: row.last_personalized_at,
    personalizationSignalVersion: row.personalization_signal_version,
    updatedAt: row.updated_at,
  };
}

/**
 * Read the viewer's persisted layout for a surface, or null when they have no
 * row yet (a new user → the caller falls back to the default DASH ordering).
 * RLS-scoped: the injected authenticated client can only ever see its own row.
 */
export async function getUserHomeLayout(
  client: TypedSupabaseClient,
  viewer: UnifiedViewer,
  surface: HomeLayoutSurface = "account",
): Promise<UserHomeLayout | null> {
  const { data, error } = await client
    .from("user_home_layouts")
    .select("*")
    .eq("user_id", viewer.user.id)
    .eq("surface", surface)
    .maybeSingle();

  if (error) {
    throw new Error(`getUserHomeLayout failed: ${error.message}`);
  }
  return data ? mapRow(data as HomeLayoutRow) : null;
}

/**
 * Upsert the viewer's layout preference. Only the provided arrays are written
 * (a partial patch preserves the others on conflict); `last_personalized_at`
 * and `updated_at` are always bumped. The upsert is keyed on (user_id, surface)
 * and the RLS WITH CHECK guarantees a user can only ever write their own row —
 * a forged user_id in the record is rejected by the policy, not trusted here.
 *
 * Slugs must already be validated against the live register by the caller
 * (unknown slugs dropped); this layer performs no register lookup.
 */
export async function upsertUserHomeLayout(
  client: TypedSupabaseClient,
  viewer: UnifiedViewer,
  surface: HomeLayoutSurface,
  patch: UserHomeLayoutPatch,
): Promise<UserHomeLayout> {
  const now = new Date().toISOString();
  const record: HomeLayoutInsert = {
    user_id: viewer.user.id,
    surface,
    last_personalized_at: now,
    updated_at: now,
    ...(patch.desktopModuleOrder !== undefined
      ? { desktop_module_order: patch.desktopModuleOrder }
      : {}),
    ...(patch.mobileModuleOrder !== undefined
      ? { mobile_module_order: patch.mobileModuleOrder }
      : {}),
    ...(patch.hiddenModules !== undefined
      ? { hidden_modules: patch.hiddenModules }
      : {}),
    ...(patch.pinnedModules !== undefined
      ? { pinned_modules: patch.pinnedModules }
      : {}),
  };

  const { data, error } = await client
    .from("user_home_layouts")
    .upsert(record, { onConflict: "user_id,surface" })
    .select("*")
    .single();

  if (error) {
    throw new Error(`upsertUserHomeLayout failed: ${error.message}`);
  }
  return mapRow(data as HomeLayoutRow);
}

/** Whether a layout's signal-derived ordering is older than `maxAgeMs` (default 24h). */
export function isLayoutStale(
  layout: Pick<UserHomeLayout, "lastPersonalizedAt">,
  now: number,
  maxAgeMs = 24 * 60 * 60 * 1000,
): boolean {
  const last = Date.parse(layout.lastPersonalizedAt);
  if (Number.isNaN(last)) return true;
  return now - last > maxAgeMs;
}
