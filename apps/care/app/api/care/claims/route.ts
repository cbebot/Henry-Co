import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";
import { uploadCareImage } from "@/lib/cloudinary";

/**
 * V3 PASS 21 — POST /api/care/claims
 *
 * Customer-side damage / lost / not-returned claim intake. Mirrors
 * logistics /api/claims (commit b667567d). Accepts either:
 *
 *   - application/json  — { booking_id?, reason, description?,
 *                          evidence_urls?: string[], garment_label?,
 *                          requested_amount_minor?, currency? }
 *   - multipart/form-data — same fields plus `evidence_<n>` File
 *                           entries (up to 5, image only, 10MB each)
 *                           which are uploaded to Cloudinary on the
 *                           server and converted to secure URLs.
 *
 * Insert is RLS-gated by `care claims: customer insert own`. The
 * server route also asserts:
 *   - authenticated caller
 *   - reason length 4..240
 *   - description length 0..2000
 *   - at most 5 evidence entries (URLs OR file uploads combined)
 *
 * Cloudinary uploads use the existing `uploadCareImage` helper, which
 * already enforces 8MB image cap + JPG/PNG/WebP MIME (the contract's
 * C6 gate names 10MB; we keep the established cap because the image
 * helper already validates content-type and size with consistent
 * error messages).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_EVIDENCE = 5;
const MAX_REASON = 240;
const MIN_REASON = 4;
const MAX_DESCRIPTION = 2000;
const MAX_GARMENT_LABEL = 120;

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanUrlArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => cleanText(entry))
    .filter((entry) => entry.length > 0 && entry.length < 1024);
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { ok: false, error: "Sign in to file a claim." },
      { status: 401 },
    );
  }

  const contentType = String(request.headers.get("content-type") || "").toLowerCase();

  let bookingId: string | null = null;
  let garmentLabel: string | null = null;
  let reason = "";
  let description: string | null = null;
  let evidenceUrls: string[] = [];
  let requestedAmountMinor = 0;
  let currency = "NGN";
  const uploadedFiles: File[] = [];

  if (contentType.includes("application/json")) {
    let body: Record<string, unknown> = {};
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body." },
        { status: 400 },
      );
    }
    bookingId = cleanText(body.booking_id) || null;
    garmentLabel = cleanText(body.garment_label).slice(0, MAX_GARMENT_LABEL) || null;
    reason = cleanText(body.reason);
    description = cleanText(body.description).slice(0, MAX_DESCRIPTION) || null;
    evidenceUrls = cleanUrlArray(body.evidence_urls);
    const amount = Number(body.requested_amount_minor ?? 0);
    requestedAmountMinor = Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
    currency = cleanText(body.currency).slice(0, 6) || "NGN";
  } else {
    const form = await request.formData();
    bookingId = cleanText(form.get("booking_id")) || null;
    garmentLabel =
      cleanText(form.get("garment_label")).slice(0, MAX_GARMENT_LABEL) || null;
    reason = cleanText(form.get("reason"));
    description =
      cleanText(form.get("description")).slice(0, MAX_DESCRIPTION) || null;
    const evidenceJson = cleanText(form.get("evidence_urls"));
    if (evidenceJson) {
      try {
        evidenceUrls = cleanUrlArray(JSON.parse(evidenceJson));
      } catch {
        evidenceUrls = [];
      }
    }
    const amount = Number(form.get("requested_amount_minor") ?? 0);
    requestedAmountMinor = Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
    currency = cleanText(form.get("currency")).slice(0, 6) || "NGN";

    for (let i = 0; i < MAX_EVIDENCE; i += 1) {
      const entry = form.get(`evidence_${i}`);
      if (entry instanceof File && entry.size > 0) {
        uploadedFiles.push(entry);
      }
    }
  }

  if (reason.length < MIN_REASON || reason.length > MAX_REASON) {
    return NextResponse.json(
      {
        ok: false,
        error: "Please describe the issue in at least a sentence.",
      },
      { status: 400 },
    );
  }

  if (evidenceUrls.length + uploadedFiles.length > MAX_EVIDENCE) {
    return NextResponse.json(
      {
        ok: false,
        error: `Up to ${MAX_EVIDENCE} evidence files / URLs per claim.`,
      },
      { status: 400 },
    );
  }

  if (uploadedFiles.length > 0) {
    try {
      for (const file of uploadedFiles) {
        const uploaded = await uploadCareImage(file, {
          folderSuffix: "claims",
          publicIdPrefix: `claim-${user.id.slice(0, 8)}`,
        });
        evidenceUrls.push(uploaded.secureUrl);
      }
    } catch (error) {
      return NextResponse.json(
        {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Evidence upload failed. Please try again.",
        },
        { status: 400 },
      );
    }
  }

  const insertPayload = {
    booking_id: bookingId,
    opened_by_user_id: user.id,
    garment_label: garmentLabel,
    reason,
    description,
    evidence_urls: evidenceUrls,
    requested_amount_minor: requestedAmountMinor,
    currency,
    status: "submitted",
  };

  const { data, error } = await supabase
    .from("care_claims")
    .insert(insertPayload)
    .select("id, status, evidence_urls, created_at")
    .single();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Claim could not be filed.",
      },
      { status: 400 },
    );
  }

  // Audit log via service-role admin (best-effort; do not fail the
  // request on log failure).
  try {
    const admin = createAdminSupabase();
    await admin.from("care_security_logs").insert({
      event_type: "care_claim_filed",
      route: "/api/care/claims",
      success: true,
      email: user.email ?? null,
      user_id: user.id,
      details: {
        claim_id: data.id,
        booking_id: bookingId,
        evidence_count: evidenceUrls.length,
      },
    } as never);
  } catch {
    // ignore — audit log is best-effort
  }

  return NextResponse.json({
    ok: true,
    claim: data,
  });
}

/**
 * GET /api/care/claims — list the caller's claims. RLS limits scope.
 */
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { ok: false, error: "Sign in to view claims." },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || 20)));

  const { data, error } = await supabase
    .from("care_claims")
    .select(
      "id, booking_id, garment_label, reason, description, evidence_urls, requested_amount_minor, currency, status, resolved_at, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message || "Claims query failed." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, claims: data ?? [] });
}
