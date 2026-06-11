import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getStudioViewer } from "@/lib/studio/auth";
import { getOptionalEnv } from "@/lib/env";

/**
 * V3 PASS 21 — POST /api/studio/asset-packs/generate
 *
 * Generate a Cloudinary archive (zip) for a project's approved
 * deliverables and write a row to studio_asset_packs with a 7-day
 * expiry. Includes brand_guidelines flag for the
 * StudioBrandGuidelinesDocument PDF (rendered on the consuming page).
 *
 *   Body:
 *     {
 *       project_id: string,
 *       name?: string,
 *       file_ids: string[],         // studio_project_files.id
 *       include_brand_guidelines?: boolean,
 *     }
 *
 *   Returns:
 *     { ok: true, pack_id, archive_url, expires_at, status }
 *
 * Permissions:
 *   - Caller must be studio staff (PM / delivery / owner) OR the
 *     project client.
 *
 * Cloudinary archive endpoint:
 *   POST https://api.cloudinary.com/v1_1/{cloud}/{resource_type}/generate_archive
 *   with timestamp + signature + public_ids[]. We request type=upload
 *   and target_format=zip. The archive_url returned is a signed URL
 *   valid until expires_at (we honour 7 days locally + Cloudinary's
 *   default URL signature TTL).
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type GenerateBody = {
  project_id?: string;
  name?: string;
  file_ids?: string[];
  include_brand_guidelines?: boolean;
};

type ProjectRow = {
  id: string;
  title: string;
  client_user_id: string | null;
};

type ProjectFileRow = {
  id: string;
  cloudinary_public_id: string | null;
  path: string | null;
  mime_type: string | null;
  bucket: string | null;
};

function signCloudinaryParams(params: Record<string, string | number>, apiSecret: string) {
  const sortedKeys = Object.keys(params).sort();
  const toSign = sortedKeys.map((k) => `${k}=${params[k]}`).join("&");
  return createHash("sha1").update(`${toSign}${apiSecret}`).digest("hex");
}

export async function POST(request: NextRequest) {
  const viewer = await getStudioViewer();
  if (!viewer.user) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  let body: GenerateBody;
  try {
    body = (await request.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const projectId = String(body.project_id || "").trim();
  if (!projectId) {
    return NextResponse.json(
      { ok: false, error: "project_id_required" },
      { status: 400 }
    );
  }

  const fileIds = Array.isArray(body.file_ids)
    ? body.file_ids
        .filter((id) => typeof id === "string" && id.length > 0)
        .slice(0, 64)
        .map((id) => String(id))
    : [];

  if (fileIds.length === 0) {
    return NextResponse.json(
      { ok: false, error: "file_ids_required" },
      { status: 400 }
    );
  }

  const admin = createAdminSupabase();

  const { data: project, error: projectErr } = await admin
    .from("studio_projects")
    // prod column is title (studio_projects has no name)
    .select("id, title, client_user_id")
    .eq("id", projectId)
    .maybeSingle<ProjectRow>();

  if (projectErr) {
    console.error("[studio-asset-packs] project fetch failed", projectErr);
    return NextResponse.json({ ok: false, error: "fetch_failed" }, { status: 500 });
  }
  if (!project) {
    return NextResponse.json({ ok: false, error: "project_not_found" }, { status: 404 });
  }

  const isStaff = viewer.roles.some((role) =>
    ["studio_owner", "project_manager", "developer_designer", "client_success"].includes(role)
  );
  const isClient = project.client_user_id === viewer.user.id;
  if (!isStaff && !isClient) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const { data: files, error: filesErr } = await admin
    .from("studio_project_files")
    .select("id, cloudinary_public_id, path, mime_type, bucket")
    .in("id", fileIds)
    .eq("project_id", projectId)
    .returns<ProjectFileRow[]>();

  if (filesErr) {
    console.error("[studio-asset-packs] files fetch failed", filesErr);
    return NextResponse.json({ ok: false, error: "fetch_files_failed" }, { status: 500 });
  }

  const cloudinaryFiles = (files ?? []).filter(
    (f) => f.bucket === "cloudinary" && f.cloudinary_public_id
  );

  const publicIds = cloudinaryFiles
    .map((f) => f.cloudinary_public_id as string)
    .filter(Boolean);

  // Create the pack row in pending state first so concurrent requests
  // see the in-progress record. We update status after the Cloudinary
  // call resolves.
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const packName = String(body.name || `${project.title} — asset pack`).slice(0, 200);

  const { data: packRow, error: packInsertErr } = await admin
    .from("studio_asset_packs")
    .insert({
      project_id: projectId,
      name: packName,
      status: "generating",
      files: cloudinaryFiles.map((f) => ({
        id: f.id,
        public_id: f.cloudinary_public_id,
        path: f.path,
      })),
      expires_at: expiresAt.toISOString(),
      generated_by_user_id: viewer.user.id,
    } as never)
    .select("id, created_at")
    .single<{ id: string; created_at: string }>();

  if (packInsertErr || !packRow) {
    console.error("[studio-asset-packs] pack insert failed", packInsertErr);
    return NextResponse.json({ ok: false, error: "persist_failed" }, { status: 500 });
  }

  // Issue Cloudinary archive call.
  const cloudName = getOptionalEnv("CLOUDINARY_CLOUD_NAME");
  const apiKey = getOptionalEnv("CLOUDINARY_API_KEY");
  const apiSecret = getOptionalEnv("CLOUDINARY_API_SECRET");

  let archiveUrl: string | null = null;
  let archivePublicId: string | null = null;
  let failureReason: string | null = null;

  if (publicIds.length > 0 && cloudName && apiKey && apiSecret) {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const params: Record<string, string | number> = {
        mode: "create",
        public_ids: publicIds.join(","),
        target_format: "zip",
        type: "upload",
        timestamp,
      };
      const signature = signCloudinaryParams(params, apiSecret);
      const form = new URLSearchParams();
      for (const k of Object.keys(params)) form.set(k, String(params[k]));
      form.set("api_key", apiKey);
      form.set("signature", signature);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/generate_archive`,
        {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: form.toString(),
        }
      );
      const payload = (await response.json().catch(() => null)) as
        | { secure_url?: string; public_id?: string; error?: { message?: string } }
        | null;

      if (response.ok && payload?.secure_url && payload.public_id) {
        archiveUrl = payload.secure_url;
        archivePublicId = payload.public_id;
      } else {
        failureReason =
          payload?.error?.message ||
          `cloudinary_archive_failed:${response.status}`;
      }
    } catch (err) {
      failureReason =
        err instanceof Error ? err.message.slice(0, 200) : "cloudinary_archive_error";
    }
  } else if (publicIds.length === 0) {
    failureReason = "no_cloudinary_files_in_pack";
  } else {
    failureReason = "cloudinary_env_missing";
  }

  const finalStatus = archiveUrl ? "ready" : "failed";

  const { error: updateErr } = await admin
    .from("studio_asset_packs")
    .update({
      status: finalStatus,
      archive_url: archiveUrl,
      archive_public_id: archivePublicId,
      generated_at: archiveUrl ? new Date().toISOString() : null,
      failure_reason: failureReason,
    } as never)
    .eq("id", packRow.id);

  if (updateErr) {
    console.error("[studio-asset-packs] pack update failed", updateErr);
  }

  try {
    const supabase = await createSupabaseServer();
    const { data: auditId } = await supabase.rpc("add_audit_log_v2", {
      p_action: archiveUrl ? "studio.asset_pack.generated" : "studio.asset_pack.failed",
      p_entity_type: "studio_asset_pack",
      p_entity_id: packRow.id,
      p_old_values: null,
      p_new_values: {
        project_id: projectId,
        files: publicIds.length,
        include_brand_guidelines: Boolean(body.include_brand_guidelines),
        status: finalStatus,
        failure_reason: failureReason,
      },
      p_reason: failureReason,
      p_division: "studio",
      p_correlation_id: null,
    });

    if (typeof auditId === "string") {
      await admin
        .from("studio_asset_packs")
        .update({ audit_log_id: auditId } as never)
        .eq("id", packRow.id);
    }
  } catch (err) {
    console.error("[studio-asset-packs] audit log failed", err);
  }

  return NextResponse.json({
    ok: finalStatus === "ready",
    pack_id: packRow.id,
    status: finalStatus,
    archive_url: archiveUrl,
    expires_at: expiresAt.toISOString(),
    failure_reason: failureReason,
  });
}
