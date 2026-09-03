/**
 * Instructor payout summary reader.
 *
 * Reads from `learn_instructor_payouts` (V3 PASS 21 migration). Built as a
 * forward-compatible reader: if the table is empty (no rows yet) we return
 * a zeroed summary so the surface renders cleanly during the rollout window.
 */

import { readLearnCollection } from "@/lib/learn/store";
import type { LearnViewer } from "@/lib/learn/types";

export type InstructorPayoutRecord = {
  id: string;
  courseId: string | null;
  courseTitle: string | null;
  payoutModel: string;
  status: string;
  netPayout: number;
  grossRevenue: number;
  platformFee: number;
  currency: string;
  periodStart: string | null;
  periodEnd: string | null;
  paidAt: string | null;
};

export type InstructorPayoutSummary = {
  currency: string;
  lifetime: { gross: number; net: number };
  pending: number;
  records: InstructorPayoutRecord[];
};

function cleanText(value?: unknown) {
  return String(value ?? "").trim();
}

function asNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export async function getInstructorPayoutSummary(
  viewer: LearnViewer,
): Promise<InstructorPayoutSummary> {
  const [payoutRows, courseRows] = await Promise.all([
    readLearnCollection<Record<string, unknown>>("learn_instructor_payouts", "created_at", false),
    readLearnCollection<Record<string, unknown>>("learn_courses", "title"),
  ]);

  const courseTitles = new Map(
    courseRows.map((row) => [cleanText(row.id), cleanText(row.title)]),
  );

  // Filter to the viewer's payouts only when they don't have staff override.
  const viewerEmail = viewer.normalizedEmail ?? viewer.user?.email?.toLowerCase().trim() ?? null;
  const isPrivileged = viewer.roles.some((role) =>
    ["academy_owner", "academy_admin", "finance"].includes(role),
  );
  const relevant = payoutRows.filter((row) => {
    if (isPrivileged) return true;
    const rowEmail = cleanText(row.normalized_email);
    const rowUserId = cleanText(row.user_id);
    return (
      (viewer.user?.id && rowUserId === viewer.user.id) ||
      (viewerEmail && rowEmail === viewerEmail)
    );
  });

  const records: InstructorPayoutRecord[] = relevant.map((row) => {
    const courseId = cleanText(row.course_id) || null;
    return {
      id: cleanText(row.id),
      courseId,
      courseTitle: courseId ? courseTitles.get(courseId) ?? null : null,
      payoutModel: cleanText(row.payout_model) || "revenue_share",
      status: cleanText(row.status) || "pending",
      netPayout: asNumber(row.net_payout),
      grossRevenue: asNumber(row.gross_revenue),
      platformFee: asNumber(row.platform_fee),
      currency: cleanText(row.currency) || "NGN",
      periodStart: cleanText(row.period_start) || null,
      periodEnd: cleanText(row.period_end) || null,
      paidAt: cleanText(row.paid_at) || null,
    };
  });

  const lifetime = records.reduce(
    (totals, record) => {
      totals.gross += record.grossRevenue;
      totals.net += record.netPayout;
      return totals;
    },
    { gross: 0, net: 0 },
  );
  const pending = records
    .filter((record) => record.status === "pending" || record.status === "approved")
    .reduce((sum, record) => sum + record.netPayout, 0);

  return {
    currency: records[0]?.currency ?? "NGN",
    lifetime,
    pending,
    records,
  };
}
