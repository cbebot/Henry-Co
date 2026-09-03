/**
 * GET /api/learn/cohorts/[id]/calendar
 *
 * Returns the live-session schedule for a cohort. Cohort visibility is
 * RLS-enforced (member or staff only).
 */

import { NextResponse } from "next/server";
import { readLearnCollection } from "@/lib/learn/store";

export const runtime = "nodejs";

function cleanText(value?: unknown) {
  return String(value ?? "").trim();
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "missing_cohort" }, { status: 400 });
  }

  const [cohorts, sessions] = await Promise.all([
    readLearnCollection<Record<string, unknown>>("learn_cohorts", "start_date"),
    readLearnCollection<Record<string, unknown>>("learn_live_sessions", "starts_at"),
  ]);
  const cohort = cohorts.find((row) => cleanText(row.id) === id) ?? null;
  if (!cohort) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const cohortSessions = sessions.filter((row) => cleanText(row.cohort_id) === id);

  return NextResponse.json({
    ok: true,
    cohort: {
      id: cleanText(cohort.id),
      slug: cleanText(cohort.slug),
      name: cleanText(cohort.name),
      startDate: cleanText(cohort.start_date),
      endDate: cleanText(cohort.end_date),
      timezone: cleanText(cohort.timezone) || "Africa/Lagos",
      status: cleanText(cohort.status),
      enrollmentCap: cohort.enrollment_cap ?? null,
      enrollmentCount: Number(cohort.enrollment_count ?? 0),
    },
    sessions: cohortSessions.map((row) => ({
      id: cleanText(row.id),
      title: cleanText(row.title),
      description: cleanText(row.description),
      startsAt: cleanText(row.starts_at),
      endsAt: cleanText(row.ends_at),
      meetingUrl: cleanText(row.meeting_url) || null,
      recordingUrl: cleanText(row.recording_url) || null,
      status: cleanText(row.status),
    })),
  });
}
