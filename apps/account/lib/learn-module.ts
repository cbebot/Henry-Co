import "server-only";

import { getDivisionUrl } from "@henryco/config";
import { normalizeEmail } from "@/lib/env";
import { createAdminSupabase } from "@/lib/supabase";

const LEARN_STORE_ROUTE = "/learn/store";
const tablePresenceCache = new Map<string, boolean>();

function cleanText(value?: unknown) {
  return String(value ?? "").trim();
}

function asNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function safeRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function fallbackEventType(table: string) {
  return `learn_store_${table}`;
}

async function hasLearnTable(table: string) {
  if (tablePresenceCache.has(table)) {
    return tablePresenceCache.get(table) ?? false;
  }

  try {
    const admin = createAdminSupabase();
    const { error } = await admin.from(table).select("id").limit(1);
    const exists = !error || !cleanText(error.message).includes("Could not find the table");
    tablePresenceCache.set(table, exists);
    return exists;
  } catch {
    tablePresenceCache.set(table, false);
    return false;
  }
}

async function readFallbackRows<T extends Record<string, unknown>>(table: string) {
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("care_security_logs")
    .select("details, created_at")
    .eq("route", LEARN_STORE_ROUTE)
    .eq("event_type", fallbackEventType(table))
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    throw error;
  }

  const merged = new Map<string, T>();
  for (const row of data ?? []) {
    const details = safeRecord(row.details);
    const payload = safeRecord(details?.payload) as T | null;
    const recordId =
      cleanText(details?.record_id) ||
      cleanText(payload?.id) ||
      cleanText(payload?.key);

    if (!payload || !recordId || merged.has(recordId)) continue;
    if (payload.__deleted === true) continue;
    merged.set(recordId, payload);
  }

  return [...merged.values()];
}

async function readLearnCollection<T extends Record<string, unknown>>(table: string, orderBy?: string) {
  if (await hasLearnTable(table)) {
    const admin = createAdminSupabase();
    let query = admin.from(table).select("*");
    if (orderBy) {
      query = query.order(orderBy, { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as T[];
  }

  const rows = await readFallbackRows<T>(table);
  if (!orderBy) return rows;

  return rows.sort((left, right) => cleanText(right[orderBy]).localeCompare(cleanText(left[orderBy])));
}

function matchesIdentity(
  row: { user_id?: unknown; normalized_email?: unknown },
  userId: string,
  normalizedEmail: string | null
) {
  return cleanText(row.user_id) === userId || (!!normalizedEmail && cleanText(row.normalized_email) === normalizedEmail);
}

export async function getLearnAccountSummary(userId: string, email: string | null) {
  const normalizedEmail = normalizeEmail(email);
  const [courseRows, enrollmentRows, assignmentRows, certificateRows, savedRows, applicationRows, attemptRows] =
    await Promise.all([
      readLearnCollection<Record<string, unknown>>("learn_courses", "updated_at"),
      readLearnCollection<Record<string, unknown>>("learn_enrollments", "enrolled_at"),
      readLearnCollection<Record<string, unknown>>("learn_assignments", "assigned_at"),
      readLearnCollection<Record<string, unknown>>("learn_certificates", "issued_at"),
      readLearnCollection<Record<string, unknown>>("learn_saved_courses", "created_at"),
      readLearnCollection<Record<string, unknown>>("learn_teacher_applications", "updated_at"),
      readLearnCollection<Record<string, unknown>>("learn_quiz_attempts", "submitted_at"),
    ]);

  const courses = new Map<
    string,
    { id: string; slug: string; title: string; subtitle: string; certification: boolean }
  >(
    courseRows.map((course) => [
      cleanText(course.id),
      {
        id: cleanText(course.id),
        slug: cleanText(course.slug),
        title: cleanText(course.title),
        subtitle: cleanText(course.subtitle),
        certification: course.is_certification === true,
      },
    ])
  );

  const enrollments = enrollmentRows.filter((row) => matchesIdentity(row, userId, normalizedEmail));
  const assignments = assignmentRows.filter((row) => matchesIdentity(row, userId, normalizedEmail));
  const certificates = certificateRows.filter((row) => matchesIdentity(row, userId, normalizedEmail));
  const savedCourses = savedRows.filter((row) => matchesIdentity(row, userId, normalizedEmail));
  const attempts = attemptRows.filter((row) => matchesIdentity(row, userId, normalizedEmail));
  const teacherApplication =
    applicationRows.find((row) => matchesIdentity(row, userId, normalizedEmail)) || null;
  const enrollmentCourseById = new Map(
    enrollments.map((row) => [cleanText(row.id), cleanText(row.course_id)])
  );
  const bestAttemptByCourse = new Map<
    string,
    { score: number; passed: boolean; submittedAt: string }
  >();
  for (const attempt of attempts) {
    const courseId = enrollmentCourseById.get(cleanText(attempt.enrollment_id));
    if (!courseId) continue;
    const current = bestAttemptByCourse.get(courseId);
    const score = asNumber(attempt.score);
    const submittedAt = cleanText(attempt.submitted_at);
    if (!current || score > current.score || submittedAt > current.submittedAt) {
      bestAttemptByCourse.set(courseId, {
        score,
        passed: attempt.passed === true,
        submittedAt,
      });
    }
  }
  const certificateByCourse = new Map(
    certificates.map((row) => [cleanText(row.course_id), cleanText(row.certificate_no)])
  );

  const activeCourses = enrollments
    .filter((row) => ["active", "awaiting_payment", "paused"].includes(cleanText(row.status)))
    .map((row) => {
      const course = courses.get(cleanText(row.course_id));
      const bestAttempt = bestAttemptByCourse.get(cleanText(row.course_id));
      const certificateNo = certificateByCourse.get(cleanText(row.course_id));
      return {
        ...course,
        percentComplete: asNumber(row.percent_complete),
        status: cleanText(row.status),
        paymentStatus: cleanText(row.payment_status),
        quizState: bestAttempt
          ? bestAttempt.passed
            ? `Assessment passed (${bestAttempt.score}%)`
            : `Assessment retry needed (${bestAttempt.score}%)`
          : course?.certification
            ? "Assessment pending"
            : "No assessment yet",
        certificateState: certificateNo
          ? `Certificate ready (${certificateNo})`
          : course?.certification
            ? "Certificate in progress"
            : "No certificate",
        lastActivityAt: cleanText(row.last_activity_at) || null,
        href: course ? `${getDivisionUrl("learn")}/learner/courses/${course.id}` : `${getDivisionUrl("learn")}/courses`,
      };
    })
    .filter((item) => item.id)
    .slice(0, 4);

  const completedCourses = enrollments
    .filter((row) => cleanText(row.status) === "completed")
    .map((row) => {
      const course = courses.get(cleanText(row.course_id));
      return {
        ...course,
        percentComplete: asNumber(row.percent_complete),
        completedAt: cleanText(row.completed_at),
        href: course ? `${getDivisionUrl("learn")}/learner/courses/${course.id}` : `${getDivisionUrl("learn")}/courses`,
      };
    })
    .filter((item) => item.id)
    .slice(0, 4);

  const assignedLearning = assignments
    .map((row) => {
      const course = courses.get(cleanText(row.course_id));
      return {
        id: cleanText(row.id),
        courseTitle: course?.title || "Assigned learning",
        note: cleanText(row.note),
        status: cleanText(row.status),
        dueAt: cleanText(row.due_at) || null,
        href: course ? `${getDivisionUrl("learn")}/learner/courses/${course.id}` : getDivisionUrl("learn"),
      };
    })
    .slice(0, 4);

  const certificateList = certificates
    .map((row) => {
      const course = courses.get(cleanText(row.course_id));
      return {
        id: cleanText(row.id),
        courseTitle: course?.title || "Certificate",
        certificateNo: cleanText(row.certificate_no),
        verificationCode: cleanText(row.verification_code),
        href: `${getDivisionUrl("learn")}/certifications/verify/${cleanText(row.verification_code)}`,
      };
    })
    .slice(0, 4);

  const saved = savedCourses
    .map((row) => courses.get(cleanText(row.course_id)))
    .filter(
      (
        course
      ): course is {
        id: string;
        slug: string;
        title: string;
        subtitle: string;
        certification: boolean;
      } => Boolean(course)
    )
    .slice(0, 4);

  return {
    metrics: {
      activeCourses: activeCourses.length,
      completedCourses: completedCourses.length,
      certificates: certificateList.length,
      assignedLearning: assignedLearning.length,
      savedCourses: saved.length,
    },
    activeCourses,
    completedCourses,
    assignedLearning,
    certificates: certificateList,
    savedCourses: saved,
    teacherApplication: teacherApplication
      ? {
          status: cleanText(teacherApplication.status),
          expertiseArea: cleanText(teacherApplication.expertise_area),
          teachingTopics: asArray(teacherApplication.teaching_topics).map((value) => cleanText(value)).filter(Boolean),
          updatedAt: cleanText(teacherApplication.updated_at),
          reviewNotes: cleanText(teacherApplication.review_notes) || null,
        }
      : null,
  };
}
