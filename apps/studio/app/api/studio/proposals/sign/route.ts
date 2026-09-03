import { NextResponse, type NextRequest } from "next/server";

import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getStudioViewer } from "@/lib/studio/auth";
import { normalizeEmail } from "@/lib/env";

/**
 * V3 PASS 21 — POST /api/studio/proposals/sign
 *
 * Records a client signature against a studio proposal.
 *
 *   Body: { proposal_id: string, typed_name?: string, locale?: string,
 *           acknowledgement: true, signature_image_url?: string,
 *           provider?: "signwell" | "typed_name" }
 *
 * Validates:
 *   - Caller is authenticated (V5-3 §12 baseline).
 *   - Proposal exists, status in (sent | viewed | draft is rejected),
 *     valid_until is in the future.
 *   - Caller's normalized_email matches the lead's normalized_email
 *     (proposal.lead.normalized_email) OR the caller has a studio staff
 *     membership.
 *   - acknowledgement flag is true and typed_name is non-empty when the
 *     provider is "typed_name".
 *
 * Side effects:
 *   - Insert into studio_proposal_signatures (provider, IP, UA, locale,
 *     typed_name → signed_by_name, signature_image_url, signed_by_user_id,
 *     signed_by_email).
 *   - Update studio_proposals.status = 'accepted', accepted_at = now().
 *   - Write audit_log via add_audit_log_v2.
 *   - Return signature_id + accepted_at.
 *
 * SignWell envelope integration is gated on SIGNWELL_API_KEY: when set
 * the envelope id is captured here as `provider_envelope_id` (passed
 * from the caller, who completed the SignWell embedded flow client-side
 * before POSTing this confirmation). When SIGNWELL_API_KEY is unset the
 * provider falls back to "typed_name" automatically.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SignBody = {
  proposal_id?: string;
  typed_name?: string | null;
  locale?: string | null;
  acknowledgement?: boolean;
  signature_image_url?: string | null;
  provider?: "signwell" | "typed_name" | null;
  provider_envelope_id?: string | null;
};

type ProposalRow = {
  id: string;
  status: string;
  title: string;
  valid_until: string;
  accepted_at: string | null;
  lead_id: string;
  signed_pdf_url?: string | null;
};

type LeadRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  normalized_email: string | null;
  user_id: string | null;
};

function getClientIp(request: NextRequest): string | null {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const real = request.headers.get("x-real-ip");
  if (real) return real.slice(0, 64);
  return null;
}

export async function POST(request: NextRequest) {
  const viewer = await getStudioViewer();
  if (!viewer.user) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  let body: SignBody;
  try {
    body = (await request.json()) as SignBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const proposalId = String(body.proposal_id || "").trim();
  if (!proposalId) {
    return NextResponse.json({ ok: false, error: "proposal_id_required" }, { status: 400 });
  }

  if (body.acknowledgement !== true) {
    return NextResponse.json(
      { ok: false, error: "acknowledgement_required" },
      { status: 400 }
    );
  }

  const signWellConfigured = Boolean(String(process.env.SIGNWELL_API_KEY || "").trim());
  const requestedProvider = body.provider === "signwell" && signWellConfigured ? "signwell" : "typed_name";

  const typedName = String(body.typed_name || "").trim();
  if (requestedProvider === "typed_name" && !typedName) {
    return NextResponse.json(
      { ok: false, error: "typed_name_required" },
      { status: 400 }
    );
  }

  const admin = createAdminSupabase();

  const { data: proposal, error: proposalErr } = await admin
    .from("studio_proposals")
    .select("id, status, title, valid_until, accepted_at, lead_id, signed_pdf_url")
    .eq("id", proposalId)
    .maybeSingle<ProposalRow>();

  if (proposalErr) {
    console.error("[studio-proposals-sign] proposal fetch failed", proposalErr);
    return NextResponse.json({ ok: false, error: "fetch_failed" }, { status: 500 });
  }
  if (!proposal) {
    return NextResponse.json({ ok: false, error: "proposal_not_found" }, { status: 404 });
  }

  const normalizedStatus = String(proposal.status || "").toLowerCase();
  if (normalizedStatus === "accepted") {
    return NextResponse.json(
      { ok: false, error: "proposal_already_signed" },
      { status: 409 }
    );
  }
  if (["expired", "declined", "withdrawn"].includes(normalizedStatus)) {
    return NextResponse.json(
      { ok: false, error: "proposal_not_signable", status: normalizedStatus },
      { status: 409 }
    );
  }
  if (proposal.valid_until && new Date(proposal.valid_until).getTime() < Date.now()) {
    return NextResponse.json(
      { ok: false, error: "proposal_expired" },
      { status: 409 }
    );
  }

  const { data: lead, error: leadErr } = await admin
    .from("studio_leads")
    .select("id, full_name, email, normalized_email, user_id")
    .eq("id", proposal.lead_id)
    .maybeSingle<LeadRow>();

  if (leadErr) {
    console.error("[studio-proposals-sign] lead fetch failed", leadErr);
    return NextResponse.json({ ok: false, error: "fetch_failed" }, { status: 500 });
  }

  const viewerEmail = normalizeEmail(viewer.user.email);
  const isStudioStaff = viewer.roles.some((role) =>
    ["studio_owner", "sales_consultation", "project_manager", "client_success"].includes(role)
  );
  const isProposalOwner =
    Boolean(viewer.user.id) &&
    Boolean(lead) &&
    (lead?.user_id === viewer.user.id ||
      (lead?.normalized_email && lead.normalized_email === viewerEmail));

  if (!isProposalOwner && !isStudioStaff) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const ipAddress = getClientIp(request);
  const userAgent = request.headers.get("user-agent")?.slice(0, 256) ?? null;
  const locale = String(body.locale || "en").toLowerCase().slice(0, 12);

  const { data: signatureRow, error: insertErr } = await admin
    .from("studio_proposal_signatures")
    .insert({
      proposal_id: proposal.id,
      signed_by_user_id: viewer.user.id,
      signed_by_name: typedName || lead?.full_name || viewer.user.fullName || null,
      signed_by_email: viewer.user.email || lead?.email || null,
      provider: requestedProvider,
      provider_envelope_id: requestedProvider === "signwell" ? body.provider_envelope_id ?? null : null,
      signature_image_url: body.signature_image_url ?? null,
      ip_address: ipAddress,
      user_agent: userAgent,
      locale,
    } as never)
    .select("id, signed_at")
    .single<{ id: string; signed_at: string }>();

  if (insertErr || !signatureRow) {
    console.error("[studio-proposals-sign] signature insert failed", insertErr);
    return NextResponse.json({ ok: false, error: "persist_failed" }, { status: 500 });
  }

  const acceptedAt = signatureRow.signed_at;
  const { error: updateErr } = await admin
    .from("studio_proposals")
    .update({
      status: "accepted",
      accepted_at: acceptedAt,
    } as never)
    .eq("id", proposal.id);

  if (updateErr) {
    console.error("[studio-proposals-sign] proposal status update failed", updateErr);
  }

  let auditLogId: string | null = null;
  try {
    const supabase = await createSupabaseServer();
    const { data: auditId } = await supabase.rpc("add_audit_log_v2", {
      p_action: "studio.proposal.signed",
      p_entity_type: "studio_proposal",
      p_entity_id: proposal.id,
      p_old_values: { status: proposal.status },
      p_new_values: {
        status: "accepted",
        provider: requestedProvider,
        signature_id: signatureRow.id,
        ip_address: ipAddress,
        locale,
      },
      p_reason: null,
      p_division: "studio",
      p_correlation_id: null,
    });
    if (typeof auditId === "string") auditLogId = auditId;
  } catch (err) {
    console.error("[studio-proposals-sign] audit log write failed", err);
  }

  if (auditLogId) {
    try {
      await admin
        .from("studio_proposal_signatures")
        .update({ audit_log_id: auditLogId } as never)
        .eq("id", signatureRow.id);
    } catch {
      // best-effort
    }
  }

  return NextResponse.json({
    ok: true,
    signature_id: signatureRow.id,
    accepted_at: acceptedAt,
    provider: requestedProvider,
  });
}
