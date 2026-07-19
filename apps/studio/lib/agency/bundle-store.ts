import "server-only";

/**
 * SA-2 — the content-addressed bundle store + the host→bundle live pointer.
 * Service-role only. The executor returns the bundle inline in its HMAC-verified
 * report; the orchestrator hashes it, verifies the report's claimed hash, and
 * stores it keyed by that hash. "What was reviewed is what deploys": the deploy
 * step re-reads the stored bundle and re-verifies its hash against the approved
 * `artifact_hash` before flipping the live pointer.
 */

import { createAdminSupabase, hasAdminSupabaseEnv } from "@/lib/supabase";
import { hashBundle, verifyArtifactHash } from "@/lib/agency/artifact-hash";
import { validateBundle, type SiteBundle } from "@henryco/studio-bundle";

export type StoreBundleResult =
  | { ok: true; contentHash: string }
  | { ok: false; reason: string };

/**
 * Store a bundle content-addressed. Rejects when the bundle is invalid or when
 * the executor's claimed hash does not match the computed hash (a tampered
 * report). Idempotent — re-storing the same content is a no-op.
 */
export async function storeBundle(input: {
  jobId: string;
  bundle: unknown;
  claimedHash?: string | null;
}): Promise<StoreBundleResult> {
  if (!hasAdminSupabaseEnv()) return { ok: false, reason: "no_admin_env" };
  const valid = validateBundle(input.bundle);
  if (!valid.ok) return { ok: false, reason: "invalid_bundle" };

  const contentHash = hashBundle(valid.bundle);
  // If the executor claimed a hash, it MUST match what we computed — a mismatch
  // means the report body was altered in flight (belt on top of the HMAC).
  if (input.claimedHash && input.claimedHash.trim().toLowerCase() !== contentHash) {
    return { ok: false, reason: "hash_mismatch" };
  }

  const admin = createAdminSupabase();
  const { error } = await admin
    .from("studio_build_bundles")
    .upsert(
      { content_hash: contentHash, job_id: input.jobId, bundle: valid.bundle } as never,
      { onConflict: "content_hash", ignoreDuplicates: true },
    );
  if (error) return { ok: false, reason: "store_failed" };
  return { ok: true, contentHash };
}

export async function readBundle(contentHash: string): Promise<SiteBundle | null> {
  if (!hasAdminSupabaseEnv()) return null;
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("studio_build_bundles")
    .select("bundle")
    .eq("content_hash", contentHash)
    .maybeSingle();
  if (!data) return null;
  const valid = validateBundle((data as { bundle: unknown }).bundle);
  return valid.ok ? valid.bundle : null;
}

/**
 * The deploy-safety keystone: re-read the stored bundle and confirm its hash
 * equals the approved hash before ANY live-pointer flip. Returns false on any
 * mismatch or missing bundle — the caller aborts the deploy.
 */
export async function verifyStoredBundleHash(approvedHash: string): Promise<boolean> {
  const bundle = await readBundle(approvedHash);
  if (!bundle) return false;
  return verifyArtifactHash(approvedHash, bundle);
}

/** Materialize a token-gated preview pointer for a project's host. */
export async function upsertPreviewPointer(input: {
  host: string;
  jobId: string;
  projectId: string;
  bundleHash: string;
  previewToken: string;
}): Promise<boolean> {
  if (!hasAdminSupabaseEnv()) return false;
  const admin = createAdminSupabase();
  const { error } = await admin.from("studio_sites").upsert(
    {
      host: input.host,
      job_id: input.jobId,
      project_id: input.projectId,
      bundle_hash: input.bundleHash,
      status: "preview",
      preview_token: input.previewToken,
      updated_at: new Date().toISOString(),
    } as never,
    { onConflict: "host" },
  );
  return !error;
}

/**
 * Rollback primitive (SA-3): stop serving a host immediately. Instant and
 * reversible — a re-deploy repoints it. Used when a deploy fails its
 * post-checks so a mismatched/failed bundle is never left live.
 */
export async function disableSite(host: string): Promise<boolean> {
  if (!hasAdminSupabaseEnv()) return false;
  const admin = createAdminSupabase();
  const { error } = await admin
    .from("studio_sites")
    .update({ status: "disabled", updated_at: new Date().toISOString() } as never)
    .eq("host", host);
  return !error;
}

/**
 * Flip a host to LIVE on an approved bundle. Guarded: the caller must pass the
 * approved hash, and this re-verifies the stored bundle hashes to it before the
 * flip. A post-approval swap is impossible.
 */
export async function goLive(input: {
  host: string;
  jobId: string;
  projectId: string;
  approvedHash: string;
}): Promise<{ ok: boolean; reason?: string }> {
  if (!hasAdminSupabaseEnv()) return { ok: false, reason: "no_admin_env" };
  const hashOk = await verifyStoredBundleHash(input.approvedHash);
  if (!hashOk) return { ok: false, reason: "artifact_hash_mismatch" };

  const admin = createAdminSupabase();
  const { error } = await admin.from("studio_sites").upsert(
    {
      host: input.host,
      job_id: input.jobId,
      project_id: input.projectId,
      bundle_hash: input.approvedHash,
      status: "live",
      preview_token: null,
      updated_at: new Date().toISOString(),
    } as never,
    { onConflict: "host" },
  );
  return error ? { ok: false, reason: "flip_failed" } : { ok: true };
}
