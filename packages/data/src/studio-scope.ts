import "server-only";

import type { StudioViewerIdentity } from "./studio-scope-core";
import type { TypedSupabaseClient } from "./client";

/**
 * @henryco/data/studio-scope — server-only DB resolver for studio
 * viewer-scoping, plus a re-export of the pure predicates in
 * ./studio-scope-core.
 *
 * The party predicate mirrors the canonical `loadVisibleProjects` in
 * `@henryco/dashboard-modules-studio`: a project is the viewer's when
 * they own it (`client_user_id` / `user_id`) or it is email-matched
 * (`normalized_email`). The viewer identity comes ONLY from the session,
 * never a caller-supplied id.
 */

export {
  studioViewerIdentity,
  filterToAllowedProjects,
  type StudioViewerIdentity,
} from "./studio-scope-core";

/**
 * Impure: resolve the set of studio project ids the viewer is a party
 * to. Mirrors `@henryco/dashboard-modules-studio` `loadVisibleProjects`
 * EXACTLY — a project is the viewer's when owned (`client_user_id` /
 * `user_id`), email-matched (`normalized_email`, verified only), OR
 * referenced by the viewer's own `customer_activity` studio walk
 * (`reference_type = 'studio_project'` reference_id, or
 * `metadata.project_id`). The activity ids are re-validated against
 * `studio_projects` before use, same as the canonical reader.
 *
 * Every party signal is keyed to the SESSION viewer (userId /
 * verified email / the viewer's own activity rows) — never a
 * caller-supplied id. The email match is kept off the `.or(...)` string
 * (separate `.eq`) to avoid comma-splitting / injection. Returns an
 * empty set on any error so the caller degrades to zero studio rows,
 * never a leak.
 */
export async function loadViewerStudioProjectIds(
  client: TypedSupabaseClient,
  identity: StudioViewerIdentity,
): Promise<Set<string>> {
  const activityProjectIds = await loadStudioActivityProjectIds(
    client,
    identity.userId,
  );

  const queries: Array<
    PromiseLike<{ data: Array<{ id: string }> | null; error: unknown }>
  > = [
    client
      .from("studio_projects")
      .select("id")
      .or(`client_user_id.eq.${identity.userId},user_id.eq.${identity.userId}`)
      .limit(500),
  ];

  if (identity.normalizedEmail) {
    queries.push(
      client
        .from("studio_projects")
        .select("id")
        .eq("normalized_email", identity.normalizedEmail)
        .limit(500),
    );
  }

  if (activityProjectIds.size > 0) {
    queries.push(
      client
        .from("studio_projects")
        .select("id")
        .in("id", [...activityProjectIds])
        .limit(500),
    );
  }

  const results = await Promise.all(queries.map((query) => safeIds(query)));

  const ids = new Set<string>();
  for (const rows of results) {
    for (const row of rows) {
      if (row.id) ids.add(row.id);
    }
  }

  return ids;
}

/**
 * The project/payment ids the viewer's own studio activity references.
 * Mirrors the `customer_activity` walk in `loadActivityReferences` /
 * `loadStudioContext` — scoped to the session user's rows, so it is a
 * legitimate party signal, never another customer's data.
 */
async function loadStudioActivityProjectIds(
  client: TypedSupabaseClient,
  userId: string,
): Promise<Set<string>> {
  const ids = new Set<string>();
  try {
    const { data, error } = await client
      .from("customer_activity")
      .select("reference_id, reference_type, metadata")
      .eq("user_id", userId)
      .eq("division", "studio")
      .order("created_at", { ascending: false })
      .limit(160);
    if (error || !data) return ids;
    for (const row of data) {
      const refType =
        typeof row.reference_type === "string" ? row.reference_type.trim() : "";
      const refId =
        typeof row.reference_id === "string" ? row.reference_id.trim() : "";
      if (refType === "studio_project" && refId) ids.add(refId);
      const meta = row.metadata;
      if (meta && typeof meta === "object" && !Array.isArray(meta)) {
        const metaProjectId = (meta as Record<string, unknown>).project_id;
        if (typeof metaProjectId === "string" && metaProjectId.trim()) {
          ids.add(metaProjectId.trim());
        }
      }
    }
  } catch {
    // Degrade to no activity refs — the owned/email paths still scope.
  }
  return ids;
}

async function safeIds(
  query: PromiseLike<{ data: Array<{ id: string }> | null; error: unknown }>,
): Promise<Array<{ id: string }>> {
  try {
    const { data, error } = await query;
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}
