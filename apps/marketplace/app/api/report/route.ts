import { NextResponse } from "next/server";
import { fileReport, moderate } from "@henryco/moderation/server";
import { REPORT_REASON_CODES } from "@henryco/moderation";
import { getMarketplaceViewer } from "@/lib/marketplace/auth";
import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { checkReportRate, type ReportRateCheck } from "@/lib/report-rate-limit";
import { moderationEnforced } from "@/lib/marketplace/moderation";

// In-memory rate buckets need a long-lived Node process.
export const runtime = "nodejs";

function rateLimited(check: Extract<ReportRateCheck, { allowed: false }>) {
  return NextResponse.json(
    { error: "rate_limited", message: "You're reporting too quickly. Please wait a moment." },
    { status: 429, headers: { "Retry-After": String(check.retryAfterSeconds) } },
  );
}

/**
 * V3-25 user report endpoint for marketplace listings.
 * Auth-gated, rate-limited, audited. Inserts a moderation_reports row (service
 * role) and best-effort re-moderates the reported listing when enforcement is on.
 */
export async function POST(request: Request) {
  try {
    const viewer = await getMarketplaceViewer();
    if (!viewer.user) {
      return NextResponse.json(
        { error: "unauthorized", message: "Sign in to report." },
        { status: 401 },
      );
    }

    const rate = checkReportRate(viewer.user.id);
    if (!rate.allowed) return rateLimited(rate);

    let payload: Record<string, unknown> = {};
    try {
      payload = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "invalid_request", message: "Invalid request body." },
        { status: 400 },
      );
    }

    const contentId = typeof payload.contentId === "string" ? payload.contentId.trim() : "";
    const reasonCode = typeof payload.reasonCode === "string" ? payload.reasonCode.trim() : "";
    const detailRaw = typeof payload.detail === "string" ? payload.detail.trim() : "";
    if (!contentId || !reasonCode) {
      return NextResponse.json(
        { error: "missing_fields", message: "Missing contentId or reasonCode." },
        { status: 400 },
      );
    }
    if (!REPORT_REASON_CODES.includes(reasonCode as (typeof REPORT_REASON_CODES)[number])) {
      return NextResponse.json(
        { error: "invalid_reason", message: "Unknown report reason." },
        { status: 400 },
      );
    }
    if (detailRaw.length > 1000) {
      return NextResponse.json(
        { error: "detail_too_long", message: "Details can be up to 1000 characters." },
        { status: 400 },
      );
    }

    const admin = createAdminSupabase();

    const reportId = await fileReport(
      {
        contentType: "marketplace_listing",
        contentId,
        reasonCode,
        detail: detailRaw || null,
        reporterId: viewer.user.id,
      },
      { supabase: admin },
    );
    if (!reportId) {
      return NextResponse.json(
        { error: "internal_error", message: "Couldn't submit report. Please try again." },
        { status: 500 },
      );
    }

    // A report triggers a re-moderation of the target (best-effort, flag-gated).
    if (moderationEnforced()) {
      try {
        // contentId is user-supplied: look it up by id OR slug with a typed
        // .eq() (never interpolate it into a PostgREST .or() filter string).
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contentId);
        const query = admin
          .from("marketplace_products")
          .select("id, slug, title, summary, description");
        const { data: product } = isUuid
          ? await query.eq("id", contentId).maybeSingle()
          : await query.eq("slug", contentId).maybeSingle();
        const p = product as
          | { id?: string; slug?: string; title?: string; summary?: string; description?: string }
          | null;
        if (p) {
          const text = [p.title, p.summary, p.description].filter(Boolean).join("\n");
          await moderate(
            {
              contentType: "marketplace_listing",
              contentId: String(p.id ?? p.slug ?? contentId),
              text,
              locale: "en",
              actorId: viewer.user.id,
            },
            { supabase: admin },
          );
        }
      } catch (err) {
        console.error("[marketplace report] re-moderation failed", err);
      }
    }

    // Audit (non-fatal — a failed audit write must not fail the report).
    try {
      const supabase = await createSupabaseServer();
      await supabase.rpc("add_audit_log_v2", {
        p_action: "marketplace.report.created",
        p_entity_type: "marketplace_listing",
        p_entity_id: contentId,
        p_old_values: null,
        p_new_values: { reasonCode },
        p_reason: null,
        p_division: "marketplace",
        p_correlation_id: null,
      });
    } catch (err) {
      console.error("[marketplace report] audit log write failed", err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[marketplace report] internal error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Internal server error." },
      { status: 500 },
    );
  }
}
