import { NextResponse, type NextRequest } from "next/server";

import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getOptionalEnv } from "@/lib/env";
import { getStudioViewer } from "@/lib/studio/auth";
import {
  clientOwnsProject,
  PROJECT_OWNER_COLUMNS,
  type ProjectOwnerRow,
} from "@/lib/studio/project-access";
import { isProjectPaid, summarizeInvoices, type InvoiceRow } from "@/lib/studio/project-payment";
import { buildIdentityTag, buildWatermarkText, buildWatermarkedImageUrl } from "@/lib/studio/asset-watermark";
import { resolveApprovalSecret } from "@/lib/studio/approval-signature";
import { signAssetGrant, ASSET_GRANT_TTL_SECONDS } from "@/lib/studio/asset-grant";

/**
 * V3-73 — POST /api/studio/asset-unlock  (the two-tier asset-access boundary)
 *
 *   { deliverable_id, mode: "preview" | "final" }
 *
 *   - preview → a watermarked Cloudinary URL (visible overlay + an invisible HMAC
 *     identity tag recorded in studio_asset_exports). Always available to the
 *     owning client; never the un-watermarked original.
 *   - final  → gated server-side on confirmed-paid money-truth (READ-ONLY). When
 *     paid, returns a short-lived grant URL to /api/studio/asset-download (the raw
 *     Cloudinary URL is never returned). Unpaid → 403, no URL. No leak.
 *
 * Every issuance is audit-logged (Principle 5 export tracking).
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Body = { deliverable_id?: string; mode?: "preview" | "final" };

type DeliverableRow = {
  id: string;
  project_id: string;
  label: string | null;
  file_url: string | null;
  file_public_id: string | null;
};

export async function POST(request: NextRequest) {
  const viewer = await getStudioViewer();
  if (!viewer.user) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const deliverableId = String(body.deliverable_id || "").trim();
  const mode = body.mode;
  if (!deliverableId || (mode !== "preview" && mode !== "final")) {
    return NextResponse.json({ ok: false, error: "deliverable_id_and_mode_required" }, { status: 400 });
  }

  const admin = createAdminSupabase();

  const { data: deliverable, error: deliverableErr } = await admin
    .from("studio_deliverables")
    .select("id, project_id, label, file_url, file_public_id")
    .eq("id", deliverableId)
    .maybeSingle<DeliverableRow>();

  if (deliverableErr) {
    return NextResponse.json({ ok: false, error: "fetch_failed" }, { status: 500 });
  }
  if (!deliverable) {
    return NextResponse.json({ ok: false, error: "deliverable_not_found" }, { status: 404 });
  }

  const { data: project } = await admin
    .from("studio_projects")
    .select(PROJECT_OWNER_COLUMNS)
    .eq("id", deliverable.project_id)
    .maybeSingle<ProjectOwnerRow>();

  if (!project) {
    return NextResponse.json({ ok: false, error: "project_not_found" }, { status: 404 });
  }

  const owns = await clientOwnsProject(admin, project, viewer.user.id, viewer.normalizedEmail);
  if (!owns) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const secret = resolveApprovalSecret();
  if (!secret) {
    return NextResponse.json({ ok: false, error: "signing_unavailable" }, { status: 503 });
  }

  const issuedAt = new Date().toISOString();
  const viewerIdentity = viewer.normalizedEmail || viewer.user.id;
  const identityTag = buildIdentityTag(
    { clientUserId: viewer.user.id, deliverableId, issuedAt },
    secret,
  );

  if (mode === "preview") {
    const cloudName = getOptionalEnv("CLOUDINARY_CLOUD_NAME");
    if (!cloudName || !deliverable.file_public_id) {
      // We refuse to serve an un-watermarkable asset as a preview — Principle 5
      // requires every preview to carry the watermark.
      return NextResponse.json({ ok: false, error: "preview_unavailable" }, { status: 422 });
    }
    const watermarkText = buildWatermarkText(viewerIdentity, issuedAt);
    const url = buildWatermarkedImageUrl({
      cloudName,
      publicId: deliverable.file_public_id,
      watermarkText,
    });

    // Fail closed: never serve a preview without its Principle-5 export record.
    const { error: previewExportErr } = await admin.from("studio_asset_exports").insert({
      project_id: deliverable.project_id,
      deliverable_id: deliverableId,
      exported_by: viewer.user.id,
      export_kind: "preview",
      identity_tag: identityTag,
      watermark_text: watermarkText,
    } as never);
    if (previewExportErr) {
      console.error("[studio-asset-unlock] preview export tracking failed", previewExportErr);
      return NextResponse.json({ ok: false, error: "export_tracking_failed" }, { status: 500 });
    }

    try {
      const supabase = await createSupabaseServer();
      await supabase.rpc("add_audit_log_v2", {
        p_action: "studio_project.asset_preview_served",
        p_entity_type: "studio_deliverable",
        p_entity_id: deliverableId,
        p_old_values: null,
        p_new_values: { project_id: deliverable.project_id, identity_tag: identityTag },
        p_reason: null,
        p_division: "studio",
        p_correlation_id: null,
      });
    } catch {
      /* audit is best-effort */
    }

    return NextResponse.json({ ok: true, mode: "preview", watermarked: true, url });
  }

  // mode === "final" — gate on confirmed-paid money-truth (READ-ONLY).
  const { data: invoiceRows } = await admin
    .from("studio_invoices")
    .select("amount_kobo, status")
    .eq("project_id", deliverable.project_id);

  const summary = summarizeInvoices((invoiceRows ?? []) as InvoiceRow[]);
  if (!isProjectPaid(summary)) {
    // No URL. The client cannot obtain a final-file grant for an unpaid project.
    return NextResponse.json(
      { ok: false, error: "payment_required", outstandingKobo: summary.outstandingKobo },
      { status: 403 },
    );
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const token = signAssetGrant(
    { deliverableId, userId: viewer.user.id, exp: nowSeconds + ASSET_GRANT_TTL_SECONDS },
    secret,
  );

  // Fail closed: never issue a final-file grant without its export record.
  const { error: finalExportErr } = await admin.from("studio_asset_exports").insert({
    project_id: deliverable.project_id,
    deliverable_id: deliverableId,
    exported_by: viewer.user.id,
    export_kind: "final",
    identity_tag: identityTag,
  } as never);
  if (finalExportErr) {
    console.error("[studio-asset-unlock] final export tracking failed", finalExportErr);
    return NextResponse.json({ ok: false, error: "export_tracking_failed" }, { status: 500 });
  }

  try {
    const supabase = await createSupabaseServer();
    await supabase.rpc("add_audit_log_v2", {
      p_action: "studio_project.final_file_unlocked",
      p_entity_type: "studio_deliverable",
      p_entity_id: deliverableId,
      p_old_values: null,
      p_new_values: { project_id: deliverable.project_id, identity_tag: identityTag },
      p_reason: null,
      p_division: "studio",
      p_correlation_id: null,
    });
  } catch {
    /* audit is best-effort */
  }

  return NextResponse.json({
    ok: true,
    mode: "final",
    watermarked: false,
    url: `/api/studio/asset-download?t=${encodeURIComponent(token)}`,
    expiresInSeconds: ASSET_GRANT_TTL_SECONDS,
  });
}
