import { NextResponse, type NextRequest } from "next/server";

import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getStudioViewer } from "@/lib/studio/auth";
import {
  clientOwnsProject,
  PROJECT_OWNER_COLUMNS,
  type ProjectOwnerRow,
} from "@/lib/studio/project-access";
import { isProjectPaid, summarizeInvoices, type InvoiceRow } from "@/lib/studio/project-payment";
import { resolveApprovalSecret } from "@/lib/studio/approval-signature";
import { verifyAssetGrant } from "@/lib/studio/asset-grant";
import { streamRemoteAttachment } from "@/lib/studio/remote-asset";

/**
 * V3-73 — GET /api/studio/asset-download?t=<grant>
 *
 * The gated streaming endpoint for FINAL, un-watermarked files. Reachable only
 * with a valid short-lived grant minted by /api/studio/asset-unlock. Re-verifies,
 * in order: a valid unexpired grant → the grant is bound to THIS viewer →
 * the viewer owns the project → the project is STILL confirmed-paid (defence in
 * depth) → then streams the file. Any failure → no bytes.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DeliverableRow = {
  id: string;
  project_id: string;
  label: string | null;
  file_url: string | null;
};

function deny(reason: string, status = 403): Response {
  return NextResponse.json({ ok: false, error: reason }, { status });
}

export async function GET(request: NextRequest) {
  const viewer = await getStudioViewer();
  if (!viewer.user) return deny("unauthenticated", 401);

  const token = request.nextUrl.searchParams.get("t");
  if (!token) return deny("missing_grant", 400);

  const secret = resolveApprovalSecret();
  if (!secret) return deny("signing_unavailable", 503);

  const grant = verifyAssetGrant(token, secret, Math.floor(Date.now() / 1000));
  if (!grant) return deny("invalid_or_expired_grant");
  // The grant is bound to the viewer who unlocked it.
  if (grant.userId !== viewer.user.id) return deny("grant_viewer_mismatch");

  const admin = createAdminSupabase();
  const { data: deliverable } = await admin
    .from("studio_deliverables")
    .select("id, project_id, label, file_url")
    .eq("id", grant.deliverableId)
    .maybeSingle<DeliverableRow>();
  if (!deliverable || !deliverable.file_url) return deny("deliverable_not_found", 404);

  const { data: project } = await admin
    .from("studio_projects")
    .select(PROJECT_OWNER_COLUMNS)
    .eq("id", deliverable.project_id)
    .maybeSingle<ProjectOwnerRow>();
  if (!project) return deny("project_not_found", 404);

  const owns = await clientOwnsProject(admin, project, viewer.user.id, viewer.normalizedEmail);
  if (!owns) return deny("forbidden");

  // Defence in depth: re-check payment at stream time (a refund between issuance
  // and download must re-lock the file).
  const { data: invoiceRows } = await admin
    .from("studio_invoices")
    .select("amount_kobo, status")
    .eq("project_id", deliverable.project_id);
  if (!isProjectPaid(summarizeInvoices((invoiceRows ?? []) as InvoiceRow[]))) {
    return deny("payment_required");
  }

  try {
    const supabase = await createSupabaseServer();
    await supabase.rpc("add_audit_log_v2", {
      p_action: "studio_project.final_file_downloaded",
      p_entity_type: "studio_deliverable",
      p_entity_id: deliverable.id,
      p_old_values: null,
      p_new_values: { project_id: deliverable.project_id },
      p_reason: null,
      p_division: "studio",
      p_correlation_id: null,
    });
  } catch {
    /* audit is best-effort */
  }

  return streamRemoteAttachment(deliverable.file_url, deliverable.label ?? null);
}
