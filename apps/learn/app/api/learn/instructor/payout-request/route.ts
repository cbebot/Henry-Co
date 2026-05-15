/**
 * POST /api/learn/instructor/payout-request
 *
 * Instructor-only — records a payout request. Writes a pending payout
 * entry referencing the instructor identity; finance reconciles and
 * marks it paid via the operator surface.
 *
 * Audit-logged: every payout request becomes a row that survives
 * regardless of later status changes (per L7 gate).
 */

import { NextResponse } from "next/server";
import { createId, upsertLearnRecord } from "@/lib/learn/store";
import { getLearnViewer } from "@/lib/learn/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const viewer = await getLearnViewer();
  if (!viewer.user) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }
  const isInstructor = viewer.roles.some((role) =>
    ["instructor", "academy_owner", "academy_admin"].includes(role),
  );
  if (!isInstructor) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  let payload: {
    courseId?: string;
    periodStart?: string;
    periodEnd?: string;
    grossRevenue?: number;
    platformFee?: number;
    netPayout?: number;
    currency?: string;
    payoutModel?: string;
    notes?: string;
  };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const id = createId();
  const reference = `INSTPAYOUT-${id.slice(0, 8).toUpperCase()}`;
  await upsertLearnRecord(
    "learn_instructor_payouts",
    {
      id,
      user_id: viewer.user.id,
      normalized_email: viewer.normalizedEmail,
      course_id: payload?.courseId || null,
      period_start: payload?.periodStart || null,
      period_end: payload?.periodEnd || null,
      gross_revenue: Math.max(0, Math.floor(Number(payload?.grossRevenue || 0))),
      platform_fee: Math.max(0, Math.floor(Number(payload?.platformFee || 0))),
      net_payout: Math.max(0, Math.floor(Number(payload?.netPayout || 0))),
      currency: String(payload?.currency || "NGN").toUpperCase(),
      payout_model: String(payload?.payoutModel || "revenue_share"),
      status: "pending",
      reference,
      notes: String(payload?.notes || ""),
      requested_at: new Date().toISOString(),
    },
    {
      userId: viewer.user.id,
      email: viewer.normalizedEmail,
      role: "instructor",
    },
  );

  return NextResponse.json({ ok: true, id, reference });
}
