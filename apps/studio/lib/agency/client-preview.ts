import "server-only";

/**
 * SA-3 — resolve the client-facing preview review for a project (portal use).
 * Returns the active build job awaiting the client's review plus its tokenized
 * preview URL, or null when there is nothing to review. The caller (the client
 * project page) has ALREADY verified project ownership via getClientProjectDetail
 * — this read is scoped to that owned project; the client-review ROUTE re-verifies
 * ownership independently (defense in depth) before any state move.
 */

import { getOptionalEnv } from "@/lib/env";
import { createAdminSupabase, hasAdminSupabaseEnv } from "@/lib/supabase";
import { getActiveJobForProject } from "@/lib/agency/store";
import { siteHostForProject } from "@/lib/agency/deploy";

export type ClientPreviewReview = {
  jobId: string;
  previewUrl: string | null;
  roundsUsed: number;
};

function sitesBaseDomain(): string {
  return getOptionalEnv("STUDIO_SITES_BASE_DOMAIN") || "sites.henryonyx.com";
}

export async function getClientPreviewForProject(projectId: string): Promise<ClientPreviewReview | null> {
  if (!hasAdminSupabaseEnv()) return null;
  const job = await getActiveJobForProject(projectId);
  if (!job || job.stage !== "client_review") return null;

  const admin = createAdminSupabase();
  const host = siteHostForProject(projectId, sitesBaseDomain());
  const { data } = await admin
    .from("studio_sites")
    .select("preview_token, status")
    .eq("host", host)
    .maybeSingle();
  const row = data as { preview_token?: string | null; status?: string } | null;

  const previewUrl =
    row?.preview_token && row.status === "preview"
      ? `https://${host}/?preview=${row.preview_token}`
      : null;

  const { count } = await admin
    .from("studio_build_events")
    .select("id", { count: "exact", head: true })
    .eq("job_id", job.id)
    .eq("kind", "client_changes_requested");

  return { jobId: job.id, previewUrl, roundsUsed: count ?? 0 };
}
