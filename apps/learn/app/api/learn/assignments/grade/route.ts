/**
 * POST /api/learn/assignments/grade
 *
 * Instructor-only — writes a grade entry against a submission.
 * Updates the submission status to graded.
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
  const isPrivileged = viewer.roles.some((role) =>
    ["academy_owner", "academy_admin", "instructor", "content_manager"].includes(role),
  );
  if (!isPrivileged) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  let payload: {
    submissionId?: string;
    score?: number;
    passed?: boolean;
    feedback?: string;
  };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const submissionId = String(payload?.submissionId || "").trim();
  if (!submissionId) {
    return NextResponse.json({ ok: false, error: "missing_submission" }, { status: 400 });
  }
  const score = Math.max(0, Math.min(100, Math.floor(Number(payload?.score || 0))));
  const passed = Boolean(payload?.passed);
  const feedback = String(payload?.feedback || "");

  const id = createId();
  await upsertLearnRecord(
    "learn_assignment_grades",
    {
      id,
      submission_id: submissionId,
      graded_by_user_id: viewer.user.id,
      score,
      passed,
      feedback,
    },
    {
      userId: viewer.user.id,
      email: viewer.normalizedEmail,
      role: "instructor",
    },
  );

  await upsertLearnRecord(
    "learn_assignment_submissions",
    {
      id: submissionId,
      status: passed ? "graded_pass" : "graded_review",
    },
    {
      userId: viewer.user.id,
      email: viewer.normalizedEmail,
      role: "instructor",
    },
  );

  return NextResponse.json({ ok: true, id });
}
