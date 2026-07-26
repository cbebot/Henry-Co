import "server-only";

/**
 * studio-sites — host → bundle lookup. Reads studio_sites + studio_build_bundles
 * with the service-role key (both tables are deny-all under RLS; a preview
 * bundle must never be reachable via the Data API). A LIVE site renders for
 * anyone; a PREVIEW renders only when the request carries the matching
 * preview_token (an open preview URL would leak an unreleased site).
 */

import { createClient } from "@supabase/supabase-js";
import { validateBundle, type SiteBundle } from "@henryco/studio-bundle";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export type ResolvedSite =
  | { ok: true; bundle: SiteBundle; status: "live" | "preview" }
  | { ok: false; reason: "not_found" | "preview_locked" | "unavailable" | "no_bundle" };

export async function resolveSite(host: string, previewToken: string | null): Promise<ResolvedSite> {
  const client = admin();
  if (!client) return { ok: false, reason: "unavailable" };

  const normalizedHost = String(host || "").trim().toLowerCase().split(":")[0];
  const { data: siteRow } = await client
    .from("studio_sites")
    .select("host, bundle_hash, status, preview_token")
    .eq("host", normalizedHost)
    .maybeSingle();
  const site = siteRow as
    | { host: string; bundle_hash: string | null; status: string; preview_token: string | null }
    | null;
  if (!site || !site.bundle_hash) return { ok: false, reason: "not_found" };

  if (site.status === "disabled") return { ok: false, reason: "not_found" };

  const status: "live" | "preview" = site.status === "live" ? "live" : "preview";
  if (status === "preview") {
    // Token gate — constant-length compare is unnecessary here (the token is a
    // random nonce, not a secret keyed to a user), but require an exact match.
    if (!previewToken || !site.preview_token || previewToken !== site.preview_token) {
      return { ok: false, reason: "preview_locked" };
    }
  }

  const { data: bundleRow } = await client
    .from("studio_build_bundles")
    .select("bundle")
    .eq("content_hash", site.bundle_hash)
    .maybeSingle();
  const raw = (bundleRow as { bundle: unknown } | null)?.bundle;
  if (raw === undefined || raw === null) return { ok: false, reason: "no_bundle" };

  const valid = validateBundle(raw);
  if (!valid.ok) return { ok: false, reason: "no_bundle" };
  return { ok: true, bundle: valid.bundle, status };
}
