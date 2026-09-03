import "server-only";

import { createAdminSupabase } from "@/lib/supabase";

/**
 * V3-56 — read the learner's career-visibility state: their earned courses and,
 * per course, whether they are currently listed to employers (an active,
 * employer-visible opt-in). Service-role reads (the learner is the owner; this
 * runs in the learner's authenticated page).
 */

export type CareerVisibilityCourse = {
  courseId: string;
  title: string;
  slug: string | null;
  listed: boolean;
  /** Raw learn_courses row for Pattern-B title localization at the call site. */
  record: Record<string, unknown> | null;
};

function asRows(data: unknown): Array<Record<string, unknown>> {
  return Array.isArray(data) ? (data as Array<Record<string, unknown>>) : [];
}

export async function getLearnerCareerVisibility(
  userId: string,
): Promise<CareerVisibilityCourse[]> {
  if (!userId) return [];
  let admin: ReturnType<typeof createAdminSupabase>;
  try {
    admin = createAdminSupabase();
  } catch {
    return [];
  }

  const certs = await admin
    .from("learn_certificates")
    .select("course_id")
    .eq("user_id", userId)
    .eq("status", "issued");
  if (certs.error) return [];

  const courseIds = [...new Set(asRows(certs.data).map((r) => String(r.course_id)).filter(Boolean))];
  if (courseIds.length === 0) return [];

  const [coursesRes, optinsRes] = await Promise.all([
    admin.from("learn_courses").select("*").in("id", courseIds),
    admin
      .from("learn_candidate_optins")
      .select("course_id, visibility, revoked_at")
      .eq("user_id", userId)
      .in("course_id", courseIds),
  ]);

  const courseById = new Map<string, Record<string, unknown>>();
  for (const row of asRows(coursesRes.data)) courseById.set(String(row.id), row);

  const listedByCourse = new Map<string, boolean>();
  for (const row of asRows(optinsRes.data)) {
    const active = !row.revoked_at && (row.visibility ?? "employers") === "employers";
    listedByCourse.set(String(row.course_id), active);
  }

  return courseIds.map((courseId) => {
    const record = courseById.get(courseId) ?? null;
    return {
      courseId,
      title: record ? String(record.title ?? "Course") : "Course",
      slug: record ? ((record.slug as string | null) ?? null) : null,
      listed: listedByCourse.get(courseId) ?? false,
      record,
    };
  });
}
