import { createHash } from "node:crypto";
import { getDivisionUrl } from "@henryco/config";
import { normalizeEmail } from "@/lib/env";
import { getLearnSnapshot } from "@/lib/learn/data";
import { getAccountLearnUrl, getLearnCourseRoomUrl, getLearnUrl } from "@/lib/learn/links";
import {
  appendCustomerActivity,
  appendCustomerDocument,
  appendCustomerNotification,
  createSupportThread,
  ensureCustomerProfile,
  upsertCustomerInvoice,
} from "@/lib/learn/shared-account";
import { createId, deleteLearnRecord, nowIso, upsertLearnRecord } from "@/lib/learn/store";
import { uploadTeacherApplicationFile } from "@/lib/learn/uploads";
import { createAdminSupabase } from "@/lib/supabase";
import type {
  LearnCourse,
  LearnEnrollment,
  LearnPaymentRecord,
  LearnProgressRecord,
  LearnQuiz,
  LearnQuizAttempt,
  LearnTeacherApplication,
  LearnTeacherApplicationFile,
  LearnTeacherPayoutModel,
  LearnViewer,
} from "@/lib/learn/types";
import {
  sendAcademyAnnouncementNotification,
  sendAcademyWelcomeNotification,
  sendCertificateEarnedNotification,
  sendEnrollmentConfirmedNotification,
  sendInternalAssignmentNotification,
  sendOwnerAlert,
  sendPaymentConfirmedNotification,
  sendTeacherApplicationStatusNotification,
  sendTeacherApplicationSubmittedNotification,
} from "@/lib/email/learn-templates";

type Identity = {
  userId: string | null;
  normalizedEmail: string | null;
  email: string | null;
  fullName: string | null;
};

function cleanText(value?: unknown) {
  return String(value ?? "").trim();
}

function withSnakeCaseKeys(row: Record<string, unknown>) {
  const payload: Record<string, unknown> = { ...row };
  for (const [key, value] of Object.entries(row)) {
    if (!/[A-Z]/.test(key)) continue;
    const snakeKey = key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
    if (!(snakeKey in payload)) {
      payload[snakeKey] = value;
    }
  }

  return payload;
}

function stableId(namespace: string, seed: string) {
  const digest = createHash("sha256").update(`henryco-learn:${namespace}:${seed}`).digest("hex");
  return `${digest.slice(0, 8)}-${digest.slice(8, 12)}-4${digest.slice(13, 16)}-a${digest.slice(17, 20)}-${digest.slice(20, 32)}`;
}

function assertViewerIdentity(viewer: LearnViewer): Identity {
  const email = cleanText(viewer.user?.email) || viewer.normalizedEmail || null;
  const normalized = normalizeEmail(email);
  if (!viewer.user?.id && !normalized) {
    throw new Error("A signed-in learner identity is required for this action.");
  }

  return {
    userId: viewer.user?.id || null,
    normalizedEmail: normalized,
    email,
    fullName: viewer.user?.fullName || null,
  };
}

function audienceFromIdentity(identity: Identity) {
  return {
    userId: identity.userId,
    email: identity.email,
    normalizedEmail: identity.normalizedEmail,
    fullName: identity.fullName,
  };
}

function teacherApplicationStatusLabel(status: LearnTeacherApplication["status"]) {
  switch (status) {
    case "submitted":
      return "Submitted";
    case "under_review":
      return "Under review";
    case "changes_requested":
      return "Changes requested";
    case "approved":
      return "Approved";
    case "rejected":
      return "Not approved";
    default:
      return "Submitted";
  }
}

function teacherApplicationStatusDescription(status: LearnTeacherApplication["status"]) {
  switch (status) {
    case "submitted":
      return "Your teaching application is now with the HenryCo academy team.";
    case "under_review":
      return "Your teaching application is now being reviewed by the academy team.";
    case "changes_requested":
      return "HenryCo Learn needs a few updates before the application can move forward.";
    case "approved":
      return "You are approved to move into instructor onboarding with HenryCo Learn.";
    case "rejected":
      return "The current teaching application was not approved for onboarding.";
    default:
      return "Your teaching application was updated.";
  }
}

function mapTeacherApplicationFiles(value: LearnTeacherApplicationFile[]) {
  return value.map((file) => ({
    name: file.name,
    url: file.url,
    public_id: file.publicId,
    mime_type: file.mimeType,
    size: file.size,
  }));
}

function canSelfEnroll(course: LearnCourse, viewer: LearnViewer) {
  if (course.visibility === "public") return true;
  return viewer.roles.some((role) =>
    ["academy_owner", "academy_admin", "internal_manager", "instructor"].includes(role)
  );
}

function determinePaymentStatus(course: LearnCourse, source: LearnEnrollment["source"]) {
  if (course.accessModel === "free") {
    return {
      enrollmentStatus: "active",
      paymentStatus: "not_required",
      payment: null,
    } as const;
  }

  if (course.accessModel === "internal" || course.accessModel === "sponsored" || source !== "self") {
    return {
      enrollmentStatus: "active",
      paymentStatus: "sponsored",
      payment: "sponsored",
    } as const;
  }

  return {
    enrollmentStatus: "awaiting_payment",
    paymentStatus: "pending",
    payment: "pending",
  } as const;
}

function calculateProgress(
  quiz: LearnQuiz | null,
  lessons: Array<{ id: string }>,
  progressRows: LearnProgressRecord[],
  attempts: LearnQuizAttempt[]
) {
  const totalLessons = lessons.length;
  const completedLessons = progressRows.filter((item) => item.status === "completed").length;
  const lessonWeight = quiz ? 80 : 100;
  const lessonPercent = totalLessons
    ? Math.round((completedLessons / totalLessons) * lessonWeight)
    : quiz
      ? 0
      : 100;
  const bestAttempt = attempts.sort((a, b) => b.score - a.score)[0] || null;
  const passedQuiz = quiz ? !!bestAttempt?.passed : true;
  const percentComplete = Math.min(100, lessonPercent + (quiz && passedQuiz ? 20 : 0));
  const completed = totalLessons === 0 ? passedQuiz : completedLessons >= totalLessons && passedQuiz;

  return {
    percentComplete,
    completed,
    bestAttempt,
  };
}

function certificateDetails(enrollmentId: string, courseId: string) {
  const digest = createHash("sha256")
    .update(`henryco-learn:certificate:${enrollmentId}:${courseId}`)
    .digest("hex")
    .toUpperCase();

  return {
    id: stableId("certificate", enrollmentId),
    certificateNo: `HCL-${new Date().getUTCFullYear()}-${digest.slice(0, 6)}`,
    verificationCode: `VERIFY-${digest.slice(6, 16)}`,
  };
}

export async function syncViewerIdentity(viewer: LearnViewer) {
  const identity = assertViewerIdentity(viewer);
  if (!identity.userId || !identity.normalizedEmail) return;

  const snapshot = await getLearnSnapshot();
  const tables: Array<[string, Array<Record<string, unknown>>]> = [
    ["learn_enrollments", snapshot.enrollments as Array<Record<string, unknown>>],
    ["learn_assignments", snapshot.assignments as Array<Record<string, unknown>>],
    ["learn_certificates", snapshot.certificates as Array<Record<string, unknown>>],
    ["learn_notifications", snapshot.notifications as Array<Record<string, unknown>>],
    ["learn_saved_courses", snapshot.savedCourses as Array<Record<string, unknown>>],
    ["learn_payments", snapshot.payments as Array<Record<string, unknown>>],
    ["learn_reviews", snapshot.reviews as Array<Record<string, unknown>>],
  ];

  for (const [table, rows] of tables) {
    for (const row of rows) {
      if (cleanText(row.userId) || cleanText(row.user_id)) continue;
      const rowEmail = normalizeEmail(cleanText(row.normalizedEmail || row.normalized_email));
      if (rowEmail !== identity.normalizedEmail) continue;
      const payload = withSnakeCaseKeys(row);
      await upsertLearnRecord(
        table,
        {
          ...payload,
          user_id: identity.userId,
          userId: identity.userId,
          normalized_email: identity.normalizedEmail,
          normalizedEmail: identity.normalizedEmail,
        },
        {
          userId: identity.userId,
          email: identity.normalizedEmail,
          role: "academy_system",
        }
      );
    }
  }
}

export async function enrollInCourse(input: {
  viewer: LearnViewer;
  courseId: string;
  source?: LearnEnrollment["source"];
  sponsorName?: string | null;
}) {
  const identity = assertViewerIdentity(input.viewer);
  const source = input.source || "self";
  const snapshot = await getLearnSnapshot();
  const course = snapshot.courses.find((item) => item.id === input.courseId);
  if (!course) throw new Error("Course not found.");
  if (source === "self" && !canSelfEnroll(course, input.viewer)) {
    throw new Error("This course requires assignment or internal academy access.");
  }

  const existing = snapshot.enrollments.find(
    (item) =>
      item.courseId === course.id &&
      ((identity.userId && item.userId === identity.userId) ||
        (identity.normalizedEmail && item.normalizedEmail === identity.normalizedEmail))
  );
  const existingPayment = existing
    ? snapshot.payments.find((item) => item.enrollmentId === existing.id) || null
    : null;
  const firstEnrollment = snapshot.enrollments.every(
    (item) =>
      item.userId !== identity.userId &&
      item.normalizedEmail !== identity.normalizedEmail
  );

  if (existing) {
    return { course, enrollment: existing, payment: existingPayment, firstEnrollment };
  }

  const idSeed = identity.userId || identity.normalizedEmail || createId();
  const enrollmentId = stableId("enrollment", `${course.id}:${idSeed}`);
  const paymentFlow = determinePaymentStatus(course, source);
  const enrolledAt = nowIso();
  const enrollment: LearnEnrollment = {
    id: enrollmentId,
    courseId: course.id,
    userId: identity.userId,
    normalizedEmail: identity.normalizedEmail,
    source,
    status: paymentFlow.enrollmentStatus,
    paymentStatus: paymentFlow.paymentStatus,
    sponsorName: cleanText(input.sponsorName) || null,
    enrolledAt,
    startedAt: null,
    completedAt: null,
    percentComplete: 0,
    lastLessonId: null,
    lastActivityAt: null,
  };

  await upsertLearnRecord(
    "learn_enrollments",
    {
      id: enrollment.id,
      course_id: enrollment.courseId,
      user_id: enrollment.userId,
      normalized_email: enrollment.normalizedEmail,
      source: enrollment.source,
      status: enrollment.status,
      payment_status: enrollment.paymentStatus,
      sponsor_name: enrollment.sponsorName,
      enrolled_at: enrollment.enrolledAt,
      started_at: enrollment.startedAt,
      completed_at: enrollment.completedAt,
      percent_complete: enrollment.percentComplete,
      last_lesson_id: enrollment.lastLessonId,
      last_activity_at: enrollment.lastActivityAt,
    },
    {
      userId: identity.userId,
      email: identity.normalizedEmail,
      role: input.viewer.roles[0] || "learner",
    }
  );

  await ensureCustomerProfile({
    userId: identity.userId,
    email: identity.normalizedEmail,
    fullName: identity.fullName,
  });

  let payment: LearnPaymentRecord | null = null;
  if (paymentFlow.payment) {
    const paymentId = stableId("payment", enrollmentId);
    payment = {
      id: paymentId,
      enrollmentId,
      courseId: course.id,
      userId: identity.userId,
      normalizedEmail: identity.normalizedEmail,
      amount: course.price || 0,
      currency: course.currency,
      status: paymentFlow.paymentStatus,
      method: paymentFlow.payment === "sponsored" ? "sponsored" : "manual",
      reference: `LEARN-${paymentId.slice(0, 8).toUpperCase()}`,
      createdAt: enrolledAt,
      confirmedAt: paymentFlow.payment === "sponsored" ? enrolledAt : null,
    };

    await upsertLearnRecord(
      "learn_payments",
      {
        id: payment.id,
        enrollment_id: payment.enrollmentId,
        course_id: payment.courseId,
        user_id: payment.userId,
        normalized_email: payment.normalizedEmail,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        reference: payment.reference,
        created_at: payment.createdAt,
        confirmed_at: payment.confirmedAt,
      },
      {
        userId: identity.userId,
        email: identity.normalizedEmail,
        role: input.viewer.roles[0] || "learner",
      }
    );

    await upsertCustomerInvoice({
      invoiceNo: payment.reference,
      userId: identity.userId,
      email: identity.normalizedEmail,
      subtotal: payment.amount,
      total: payment.amount,
      description: `${course.title} academy access`,
      status: payment.status,
      currency: payment.currency,
      paymentMethod: payment.method,
      paymentReference: payment.reference,
      referenceType: "learn_enrollment",
      referenceId: enrollment.id,
      paidAt: payment.confirmedAt,
      lineItems: [{ label: course.title, amount: payment.amount, currency: payment.currency }],
    });
  }

  await appendCustomerActivity({
    userId: identity.userId,
    email: identity.normalizedEmail,
    activityType: "learn_enrollment_created",
    title: `Enrolled in ${course.title}`,
    description: course.summary,
    status: enrollment.status,
    referenceType: "learn_course",
    referenceId: course.id,
    amount: payment?.amount ?? course.price,
    actionUrl: `${getDivisionUrl("learn")}/courses/${course.slug}`,
    metadata: {
      course_slug: course.slug,
      payment_status: enrollment.paymentStatus,
    },
  });

  await appendCustomerNotification({
    userId: identity.userId,
    email: identity.normalizedEmail,
    title: `${course.title} is now in your academy workspace`,
    body:
      enrollment.status === "awaiting_payment"
        ? "Your seat is reserved. Payment confirmation will unlock the learning workspace."
        : "Your enrollment is active and the course is ready.",
    category: "learn",
    actionUrl:
      enrollment.status === "awaiting_payment"
        ? getAccountLearnUrl("payments")
        : getLearnCourseRoomUrl(course.id),
    actionLabel: enrollment.status === "awaiting_payment" ? "Open account" : "Open course",
    referenceType: "learn_enrollment",
    referenceId: enrollment.id,
  });

  if (firstEnrollment) {
    await sendAcademyWelcomeNotification({
      audience: audienceFromIdentity(identity),
    });
  }

  await sendEnrollmentConfirmedNotification({
    audience: audienceFromIdentity(identity),
    courseTitle: course.title,
    courseId: course.id,
    courseSlug: course.slug,
    statusLabel:
      enrollment.status === "awaiting_payment" ? "Awaiting payment confirmation" : "Active",
    amount: course.price,
    currency: course.currency,
  });

  if (payment?.status === "sponsored") {
    await sendPaymentConfirmedNotification({
      audience: audienceFromIdentity(identity),
      courseTitle: course.title,
      courseId: course.id,
      amount: payment.amount,
      currency: payment.currency,
      reference: payment.reference,
    });
  }

  return { course, enrollment, payment, firstEnrollment };
}

export async function toggleSavedCourse(input: {
  viewer: LearnViewer;
  courseId: string;
}) {
  const identity = assertViewerIdentity(input.viewer);
  const snapshot = await getLearnSnapshot();
  const course = snapshot.courses.find((item) => item.id === input.courseId);
  if (!course) throw new Error("Course not found.");

  const existing = snapshot.savedCourses.find(
    (item) =>
      item.courseId === course.id &&
      ((identity.userId && item.userId === identity.userId) ||
        (identity.normalizedEmail && item.normalizedEmail === identity.normalizedEmail))
  );

  if (existing) {
    await deleteLearnRecord("learn_saved_courses", existing.id, {
      userId: identity.userId,
      email: identity.normalizedEmail,
      role: "learner",
    });
    return { saved: false };
  }

  const savedId = stableId("saved", `${course.id}:${identity.userId || identity.normalizedEmail}`);
  await upsertLearnRecord(
    "learn_saved_courses",
    {
      id: savedId,
      course_id: course.id,
      user_id: identity.userId,
      normalized_email: identity.normalizedEmail,
      created_at: nowIso(),
    },
    {
      userId: identity.userId,
      email: identity.normalizedEmail,
      role: "learner",
    }
  );

  await appendCustomerActivity({
    userId: identity.userId,
    email: identity.normalizedEmail,
    activityType: "learn_course_saved",
    title: `Saved ${course.title}`,
    description: "Course bookmarked inside HenryCo Learn.",
    referenceType: "learn_course",
    referenceId: course.id,
    actionUrl: `${getDivisionUrl("learn")}/courses/${course.slug}`,
  });

  return { saved: true };
}

async function issueCertificateIfEligible(input: {
  identity: Identity;
  course: LearnCourse;
  enrollment: LearnEnrollment;
  score?: number | null;
}) {
  const snapshot = await getLearnSnapshot();
  const existing = snapshot.certificates.find((item) => item.enrollmentId === input.enrollment.id);
  if (existing || input.enrollment.status !== "completed") return existing || null;

  const details = certificateDetails(input.enrollment.id, input.course.id);
  const issuedAt = nowIso();
  const certificate = {
    id: details.id,
    enrollmentId: input.enrollment.id,
    courseId: input.course.id,
    userId: input.identity.userId,
    normalizedEmail: input.identity.normalizedEmail,
    certificateNo: details.certificateNo,
    verificationCode: details.verificationCode,
    issuedAt,
    score: input.score ?? null,
    status: "issued" as const,
  };

  await upsertLearnRecord(
    "learn_certificates",
    {
      id: certificate.id,
      enrollment_id: certificate.enrollmentId,
      course_id: certificate.courseId,
      user_id: certificate.userId,
      normalized_email: certificate.normalizedEmail,
      certificate_no: certificate.certificateNo,
      verification_code: certificate.verificationCode,
      issued_at: certificate.issuedAt,
      score: certificate.score,
      status: certificate.status,
    },
    {
      userId: certificate.userId,
      email: certificate.normalizedEmail,
      role: "academy_system",
    }
  );

  await upsertLearnRecord(
    "learn_certificate_verification",
    {
      id: stableId("certificate-verification", certificate.id),
      certificate_id: certificate.id,
      course_id: certificate.courseId,
      certificate_no: certificate.certificateNo,
      verification_code: certificate.verificationCode,
      normalized_email: certificate.normalizedEmail,
      status: certificate.status,
      issued_at: certificate.issuedAt,
    },
    {
      userId: certificate.userId,
      email: certificate.normalizedEmail,
      role: "academy_system",
    }
  );

  const verifyUrl = `${getDivisionUrl("learn")}/certifications/verify/${certificate.verificationCode}`;
  await appendCustomerActivity({
    userId: input.identity.userId,
    email: input.identity.normalizedEmail,
    activityType: "learn_certificate_issued",
    title: `Earned certificate for ${input.course.title}`,
    description: "A verified HenryCo Learn certificate is now available.",
    status: "issued",
    referenceType: "learn_certificate",
    referenceId: certificate.id,
    actionUrl: verifyUrl,
    metadata: {
      verification_code: certificate.verificationCode,
      certificate_no: certificate.certificateNo,
    },
  });

  await appendCustomerNotification({
    userId: input.identity.userId,
    email: input.identity.normalizedEmail,
    title: `${input.course.title} certificate earned`,
    body: "Your certificate is now live with public verification.",
    category: "learn",
    actionUrl: verifyUrl,
    actionLabel: "Verify certificate",
    referenceType: "learn_certificate",
    referenceId: certificate.id,
  });

  await appendCustomerDocument({
    userId: input.identity.userId,
    email: input.identity.normalizedEmail,
    name: `${input.course.title} Certificate`,
    type: "certificate",
    fileUrl: verifyUrl,
    referenceType: "learn_certificate",
    referenceId: certificate.id,
    metadata: {
      verification_code: certificate.verificationCode,
      certificate_no: certificate.certificateNo,
    },
  });

  await sendCertificateEarnedNotification({
    audience: audienceFromIdentity(input.identity),
    courseTitle: input.course.title,
    certificateId: certificate.id,
    certificateNo: certificate.certificateNo,
    verificationCode: certificate.verificationCode,
  });

  return certificate;
}

export async function completeLesson(input: {
  viewer: LearnViewer;
  courseId: string;
  lessonId: string;
  secondsWatched?: number | null;
}) {
  const identity = assertViewerIdentity(input.viewer);
  const snapshot = await getLearnSnapshot();
  const course = snapshot.courses.find((item) => item.id === input.courseId);
  if (!course) throw new Error("Course not found.");

  let enrollment =
    snapshot.enrollments.find(
      (item) =>
        item.courseId === course.id &&
        ((identity.userId && item.userId === identity.userId) ||
          (identity.normalizedEmail && item.normalizedEmail === identity.normalizedEmail))
    ) || null;

  if (!enrollment) {
    const created = await enrollInCourse({ viewer: input.viewer, courseId: course.id, source: "self" });
    enrollment = created.enrollment;
  }

  if (!["active", "completed"].includes(enrollment.status)) {
    throw new Error("This course is not active yet.");
  }

  const lesson = snapshot.lessons.find((item) => item.id === input.lessonId && item.courseId === course.id);
  if (!lesson) throw new Error("Lesson not found.");

  const orderedLessons = snapshot.modules
    .filter((item) => item.courseId === course.id)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .flatMap((module) =>
      snapshot.lessons
        .filter((item) => item.moduleId === module.id)
        .sort((left, right) => left.sortOrder - right.sortOrder)
    );
  const targetLessonIndex = orderedLessons.findIndex((item) => item.id === lesson.id);
  const completedLessonIds = new Set(
    snapshot.progress
      .filter((item) => item.enrollmentId === enrollment.id && item.status === "completed")
      .map((item) => item.lessonId)
  );
  const firstIncompleteRequiredLesson = orderedLessons
    .slice(0, targetLessonIndex)
    .find((item) => !completedLessonIds.has(item.id));

  if (firstIncompleteRequiredLesson) {
    throw new Error(`Complete "${firstIncompleteRequiredLesson.title}" before this lesson.`);
  }

  const progressId = stableId("progress", `${enrollment.id}:${lesson.id}`);
  const completedAt = nowIso();
  await upsertLearnRecord(
    "learn_progress",
    {
      id: progressId,
      enrollment_id: enrollment.id,
      course_id: course.id,
      module_id: lesson.moduleId,
      lesson_id: lesson.id,
      status: "completed",
      seconds_watched: Number(input.secondsWatched || lesson.durationMinutes * 60),
      score: null,
      completed_at: completedAt,
    },
    {
      userId: identity.userId,
      email: identity.normalizedEmail,
      role: "learner",
    }
  );

  const updatedProgress = [
    ...snapshot.progress.filter((item) => item.enrollmentId === enrollment.id && item.id !== progressId),
    {
      id: progressId,
      enrollmentId: enrollment.id,
      courseId: course.id,
      moduleId: lesson.moduleId,
      lessonId: lesson.id,
      status: "completed" as const,
      secondsWatched: Number(input.secondsWatched || lesson.durationMinutes * 60),
      score: null,
      completedAt,
    },
  ];
  const progressState = calculateProgress(
    snapshot.quizzes.find((item) => item.courseId === course.id) || null,
    snapshot.lessons.filter((item) => item.courseId === course.id),
    updatedProgress,
    snapshot.attempts.filter((item) => item.enrollmentId === enrollment.id)
  );

  const updatedEnrollment: LearnEnrollment = {
    ...enrollment,
    status: progressState.completed ? "completed" : "active",
    startedAt: enrollment.startedAt || completedAt,
    completedAt: progressState.completed ? completedAt : null,
    percentComplete: progressState.percentComplete,
    lastLessonId: lesson.id,
    lastActivityAt: completedAt,
  };

  await upsertLearnRecord(
    "learn_enrollments",
    {
      id: updatedEnrollment.id,
      course_id: updatedEnrollment.courseId,
      user_id: updatedEnrollment.userId,
      normalized_email: updatedEnrollment.normalizedEmail,
      source: updatedEnrollment.source,
      status: updatedEnrollment.status,
      payment_status: updatedEnrollment.paymentStatus,
      sponsor_name: updatedEnrollment.sponsorName,
      enrolled_at: updatedEnrollment.enrolledAt,
      started_at: updatedEnrollment.startedAt,
      completed_at: updatedEnrollment.completedAt,
      percent_complete: updatedEnrollment.percentComplete,
      last_lesson_id: updatedEnrollment.lastLessonId,
      last_activity_at: updatedEnrollment.lastActivityAt,
    },
    {
      userId: identity.userId,
      email: identity.normalizedEmail,
      role: "learner",
    }
  );

  await appendCustomerActivity({
    userId: identity.userId,
    email: identity.normalizedEmail,
    activityType: "learn_lesson_completed",
    title: `Completed lesson in ${course.title}`,
    description: lesson.title,
    status: updatedEnrollment.status,
    referenceType: "learn_lesson",
    referenceId: lesson.id,
    actionUrl: getLearnCourseRoomUrl(course.id),
    metadata: {
      percent_complete: updatedEnrollment.percentComplete,
    },
  });

  const certificate = await issueCertificateIfEligible({
    identity,
    course,
    enrollment: updatedEnrollment,
    score: progressState.bestAttempt?.score ?? null,
  });

  return {
    enrollment: updatedEnrollment,
    certificate,
  };
}

export async function submitQuizAttempt(input: {
  viewer: LearnViewer;
  courseId: string;
  quizId: string;
  answers: Record<string, string[]>;
}) {
  const identity = assertViewerIdentity(input.viewer);
  const snapshot = await getLearnSnapshot();
  const course = snapshot.courses.find((item) => item.id === input.courseId);
  const quiz = snapshot.quizzes.find((item) => item.id === input.quizId && item.courseId === input.courseId);
  if (!course || !quiz) throw new Error("Quiz not found.");

  const enrollment = snapshot.enrollments.find(
    (item) =>
      item.courseId === course.id &&
      ((identity.userId && item.userId === identity.userId) ||
        (identity.normalizedEmail && item.normalizedEmail === identity.normalizedEmail))
  );
  if (!enrollment || !["active", "completed"].includes(enrollment.status)) {
    throw new Error("You need an active enrollment before taking this assessment.");
  }

  const courseLessons = snapshot.lessons.filter((item) => item.courseId === course.id);
  const completedLessonIds = new Set(
    snapshot.progress
      .filter((item) => item.enrollmentId === enrollment.id && item.status === "completed")
      .map((item) => item.lessonId)
  );
  const incompleteLesson = courseLessons.find((item) => !completedLessonIds.has(item.id));
  if (incompleteLesson) {
    throw new Error(`Finish "${incompleteLesson.title}" before taking the assessment.`);
  }

  const existingAttempts = snapshot.attempts.filter(
    (item) => item.enrollmentId === enrollment.id && item.quizId === quiz.id
  );
  if (existingAttempts.some((item) => item.passed)) {
    throw new Error("This assessment has already been passed.");
  }
  if (existingAttempts.length >= quiz.maxAttempts) {
    throw new Error("This assessment has reached its maximum number of attempts.");
  }

  const questions = snapshot.questions.filter((item) => item.quizId === quiz.id);
  const correctAnswers = questions.reduce((total, question) => {
    const submitted = [...(input.answers[question.id] || [])].sort().join("|");
    const expected = [...question.correctAnswer].sort().join("|");
    return total + (submitted === expected ? 1 : 0);
  }, 0);
  const score = questions.length ? Math.round((correctAnswers / questions.length) * 100) : 0;
  const passed = score >= quiz.passScore;
  const submittedAt = nowIso();
  const attemptId = createId();

  await upsertLearnRecord(
    "learn_quiz_attempts",
    {
      id: attemptId,
      quiz_id: quiz.id,
      enrollment_id: enrollment.id,
      user_id: identity.userId,
      normalized_email: identity.normalizedEmail,
      score,
      passed,
      submitted_at: submittedAt,
      answers: input.answers,
    },
    {
      userId: identity.userId,
      email: identity.normalizedEmail,
      role: "learner",
    }
  );

  const attempts = [
    ...snapshot.attempts.filter((item) => item.enrollmentId === enrollment.id),
    {
      id: attemptId,
      quizId: quiz.id,
      enrollmentId: enrollment.id,
      userId: identity.userId,
      normalizedEmail: identity.normalizedEmail,
      score,
      passed,
      submittedAt,
      answers: input.answers,
    },
  ];
  const progressState = calculateProgress(
    quiz,
    snapshot.lessons.filter((item) => item.courseId === course.id),
    snapshot.progress.filter((item) => item.enrollmentId === enrollment.id),
    attempts
  );

  const updatedEnrollment: LearnEnrollment = {
    ...enrollment,
    status: progressState.completed ? "completed" : "active",
    completedAt: progressState.completed ? submittedAt : enrollment.completedAt,
    percentComplete: progressState.percentComplete,
    lastActivityAt: submittedAt,
  };

  await upsertLearnRecord(
    "learn_enrollments",
    {
      id: updatedEnrollment.id,
      course_id: updatedEnrollment.courseId,
      user_id: updatedEnrollment.userId,
      normalized_email: updatedEnrollment.normalizedEmail,
      source: updatedEnrollment.source,
      status: updatedEnrollment.status,
      payment_status: updatedEnrollment.paymentStatus,
      sponsor_name: updatedEnrollment.sponsorName,
      enrolled_at: updatedEnrollment.enrolledAt,
      started_at: updatedEnrollment.startedAt,
      completed_at: updatedEnrollment.completedAt,
      percent_complete: updatedEnrollment.percentComplete,
      last_lesson_id: updatedEnrollment.lastLessonId,
      last_activity_at: updatedEnrollment.lastActivityAt,
    },
    {
      userId: identity.userId,
      email: identity.normalizedEmail,
      role: "learner",
    }
  );

  await appendCustomerActivity({
    userId: identity.userId,
    email: identity.normalizedEmail,
    activityType: "learn_quiz_attempt_submitted",
    title: `Submitted ${quiz.title}`,
    description: `${score}% score`,
    status: passed ? "passed" : "retry_required",
    referenceType: "learn_quiz",
    referenceId: quiz.id,
    actionUrl: getLearnCourseRoomUrl(course.id),
    metadata: {
      score,
      passed,
    },
  });

  const certificate = await issueCertificateIfEligible({
    identity,
    course,
    enrollment: updatedEnrollment,
    score,
  });

  return {
    score,
    passed,
    enrollment: updatedEnrollment,
    certificate,
  };
}

export async function markNotificationRead(input: {
  viewer: LearnViewer;
  notificationId: string;
}) {
  const identity = assertViewerIdentity(input.viewer);
  const snapshot = await getLearnSnapshot();
  const notification = snapshot.notifications.find((item) => item.id === input.notificationId);
  if (!notification) throw new Error("Notification not found.");
  if (
    notification.userId !== identity.userId &&
    notification.normalizedEmail !== identity.normalizedEmail
  ) {
    throw new Error("Notification does not belong to this learner.");
  }

  await upsertLearnRecord(
    "learn_notifications",
    {
      id: notification.id,
      user_id: notification.userId,
      normalized_email: notification.normalizedEmail,
      channel: notification.channel,
      template_key: notification.templateKey,
      recipient: notification.recipient,
      title: notification.title,
      body: notification.body,
      status: notification.status,
      reason: notification.reason,
      entity_type: notification.entityType,
      entity_id: notification.entityId,
      read_at: nowIso(),
      created_at: notification.createdAt,
    },
    {
      userId: identity.userId,
      email: identity.normalizedEmail,
      role: "learner",
    }
  );
}

export async function updateLearnerPreferences(input: {
  viewer: LearnViewer;
  fullName: string;
  phone: string;
  reminderChannel: string;
  announcementOptIn: boolean;
}) {
  const identity = assertViewerIdentity(input.viewer);
  const admin = createAdminSupabase();

  if (identity.userId) {
    await admin
      .from("profiles")
      .upsert(
        {
          id: identity.userId,
          email: identity.normalizedEmail,
          full_name: cleanText(input.fullName) || input.viewer.user?.fullName || null,
          phone: cleanText(input.phone) || null,
        } as never,
        { onConflict: "id" }
      );
  }

  await ensureCustomerProfile({
    userId: identity.userId,
    email: identity.normalizedEmail,
    fullName: cleanText(input.fullName),
    phone: cleanText(input.phone),
  });

  const key = `learner_preferences:${identity.userId || identity.normalizedEmail}`;
  await upsertLearnRecord(
    "learn_settings",
    {
      key,
      value: {
        reminder_channel: cleanText(input.reminderChannel) || "email",
        announcement_opt_in: input.announcementOptIn,
        full_name: cleanText(input.fullName) || null,
        phone: cleanText(input.phone) || null,
      },
      created_at: nowIso(),
      updated_at: nowIso(),
    },
    {
      userId: identity.userId,
      email: identity.normalizedEmail,
      role: "learner",
    },
    { onConflict: "key", idKey: "key" }
  );
}

export async function submitTeacherApplication(input: {
  viewer: LearnViewer;
  fullName: string;
  phone?: string | null;
  country?: string | null;
  expertiseArea: string;
  teachingTopics: string[];
  credentials: string;
  portfolioLinks: string[];
  courseProposal: string;
  supportingFiles: File[];
  agreementAccepted: boolean;
}) {
  if (!input.agreementAccepted) {
    throw new Error("Please accept the teaching standards and terms before applying.");
  }

  const identity = assertViewerIdentity(input.viewer);
  const snapshot = await getLearnSnapshot();
  const existing =
    snapshot.teacherApplications.find(
      (item) =>
        (identity.userId && item.userId === identity.userId) ||
        (identity.normalizedEmail && item.normalizedEmail === identity.normalizedEmail)
    ) || null;

  if (existing?.status === "approved") {
    throw new Error("This HenryCo account already has an approved teaching application.");
  }

  const uploadedFiles = [...(existing?.supportingFiles || [])];
  for (const [index, file] of input.supportingFiles.slice(0, 4).entries()) {
    if (!(file instanceof File) || file.size <= 0) continue;
    const uploaded = await uploadTeacherApplicationFile(file, {
      folderSuffix: identity.userId || identity.normalizedEmail || "teacher",
      publicIdPrefix: `teach-${index + 1}`,
    });
    uploadedFiles.push({
      name: uploaded.name,
      url: uploaded.secureUrl,
      publicId: uploaded.publicId,
      mimeType: uploaded.mimeType,
      size: uploaded.size,
    });
  }

  const applicationId =
    existing?.id ||
    stableId("teacher-application", identity.userId || identity.normalizedEmail || createId());
  const createdAt = existing?.createdAt || nowIso();
  const updatedAt = nowIso();
  const nextStatus: LearnTeacherApplication["status"] =
    existing?.status === "under_review" ? "under_review" : "submitted";
  const application: LearnTeacherApplication = {
    id: applicationId,
    userId: identity.userId,
    normalizedEmail: identity.normalizedEmail,
    fullName: cleanText(input.fullName) || identity.fullName || "HenryCo instructor applicant",
    phone: cleanText(input.phone) || null,
    country: cleanText(input.country) || null,
    expertiseArea: cleanText(input.expertiseArea),
    teachingTopics: input.teachingTopics.map((item) => cleanText(item)).filter(Boolean),
    credentials: cleanText(input.credentials),
    portfolioLinks: input.portfolioLinks.map((item) => cleanText(item)).filter(Boolean),
    courseProposal: cleanText(input.courseProposal),
    supportingFiles: uploadedFiles,
    termsAcceptedAt: existing?.termsAcceptedAt || updatedAt,
    status: nextStatus,
    reviewNotes:
      existing?.status === "changes_requested" ? existing.reviewNotes : existing?.reviewNotes || null,
    adminNotes: existing?.adminNotes || null,
    payoutModel: existing?.payoutModel || "pending",
    revenueSharePercent: existing?.revenueSharePercent ?? null,
    reviewedAt: existing?.status === "changes_requested" ? null : existing?.reviewedAt || null,
    reviewedByUserId:
      existing?.status === "changes_requested" ? null : existing?.reviewedByUserId || null,
    instructorMembershipId: existing?.instructorMembershipId || null,
    createdAt,
    updatedAt,
  };

  await upsertLearnRecord(
    "learn_teacher_applications",
    {
      id: application.id,
      user_id: application.userId,
      normalized_email: application.normalizedEmail,
      full_name: application.fullName,
      phone: application.phone,
      country: application.country,
      expertise_area: application.expertiseArea,
      teaching_topics: application.teachingTopics,
      credentials: application.credentials,
      portfolio_links: application.portfolioLinks,
      course_proposal: application.courseProposal,
      supporting_files: mapTeacherApplicationFiles(application.supportingFiles),
      terms_accepted_at: application.termsAcceptedAt,
      status: application.status,
      review_notes: application.reviewNotes,
      admin_notes: application.adminNotes,
      payout_model: application.payoutModel,
      revenue_share_percent: application.revenueSharePercent,
      reviewed_at: application.reviewedAt,
      reviewed_by_user_id: application.reviewedByUserId,
      instructor_membership_id: application.instructorMembershipId,
      created_at: application.createdAt,
      updated_at: application.updatedAt,
    },
    {
      userId: identity.userId,
      email: identity.normalizedEmail,
      role: "learner",
    }
  );

  await ensureCustomerProfile({
    userId: identity.userId,
    email: identity.normalizedEmail,
    fullName: application.fullName,
    phone: application.phone,
  });

  await appendCustomerActivity({
    userId: identity.userId,
    email: identity.normalizedEmail,
    activityType: "learn_teacher_application_submitted",
    title: "Teaching application received",
    description: `Applied to teach ${application.teachingTopics.join(", ") || application.expertiseArea} through HenryCo Learn.`,
    status: application.status,
    referenceType: "learn_teacher_application",
    referenceId: application.id,
    actionUrl: getLearnUrl("/teach"),
    metadata: {
      expertise_area: application.expertiseArea,
      teaching_topics: application.teachingTopics,
      file_count: application.supportingFiles.length,
    },
  });

  await appendCustomerNotification({
    userId: identity.userId,
    email: identity.normalizedEmail,
    title: "Teaching application submitted",
    body: "HenryCo Learn has recorded your teaching application and the academy team will review it shortly.",
    category: "learn",
    actionUrl: getLearnUrl("/teach"),
    actionLabel: "Review application",
    referenceType: "learn_teacher_application",
    referenceId: application.id,
  });

  await sendTeacherApplicationSubmittedNotification({
    audience: audienceFromIdentity(identity),
    fullName: application.fullName,
    expertiseArea: application.expertiseArea,
    teachingTopics: application.teachingTopics,
    applicationId: application.id,
    manageUrl: getLearnUrl("/teach"),
  });

  await sendOwnerAlert({
    title: `Teaching application: ${application.fullName}`,
    body: `${application.fullName} submitted a HenryCo Learn teaching application in ${application.expertiseArea}.`,
    entityType: "learn_teacher_application",
    entityId: application.id,
    actionUrl: `${getDivisionUrl("learn")}/owner/instructors`,
  });

  return application;
}

export async function reviewTeacherApplication(input: {
  actor: LearnViewer;
  applicationId: string;
  status: LearnTeacherApplication["status"];
  reviewNotes?: string | null;
  adminNotes?: string | null;
  payoutModel?: LearnTeacherPayoutModel | null;
  revenueSharePercent?: number | null;
}) {
  const snapshot = await getLearnSnapshot();
  const existing = snapshot.teacherApplications.find((item) => item.id === input.applicationId);
  if (!existing) {
    throw new Error("Teaching application not found.");
  }

  const reviewedAt = nowIso();
  let instructorMembershipId = existing.instructorMembershipId;
  if (input.status === "approved") {
    instructorMembershipId =
      existing.instructorMembershipId || stableId("learn-instructor-membership", existing.id);

    await upsertLearnRecord(
      "learn_role_memberships",
      {
        id: instructorMembershipId,
        user_id: existing.userId,
        normalized_email: existing.normalizedEmail,
        scope_type: "platform",
        scope_id: null,
        role: "instructor",
        is_active: true,
        created_at: existing.createdAt,
        updated_at: reviewedAt,
      },
      {
        userId: input.actor.user?.id,
        email: input.actor.normalizedEmail,
        role: input.actor.roles[0] || "academy_admin",
      }
    );
  } else if (existing.instructorMembershipId) {
    await upsertLearnRecord(
      "learn_role_memberships",
      {
        id: existing.instructorMembershipId,
        user_id: existing.userId,
        normalized_email: existing.normalizedEmail,
        scope_type: "platform",
        scope_id: null,
        role: "instructor",
        is_active: false,
        created_at: existing.createdAt,
        updated_at: reviewedAt,
      },
      {
        userId: input.actor.user?.id,
        email: input.actor.normalizedEmail,
        role: input.actor.roles[0] || "academy_admin",
      }
    );
  }

  const updated: LearnTeacherApplication = {
    ...existing,
    status: input.status,
    reviewNotes: cleanText(input.reviewNotes) || null,
    adminNotes: cleanText(input.adminNotes) || null,
    payoutModel: input.payoutModel || existing.payoutModel || "pending",
    revenueSharePercent:
      input.revenueSharePercent == null
        ? existing.revenueSharePercent
        : Math.max(0, Number(input.revenueSharePercent || 0)),
    reviewedAt,
    reviewedByUserId: input.actor.user?.id || null,
    instructorMembershipId: instructorMembershipId || null,
    updatedAt: reviewedAt,
  };

  await upsertLearnRecord(
    "learn_teacher_applications",
    {
      id: updated.id,
      user_id: updated.userId,
      normalized_email: updated.normalizedEmail,
      full_name: updated.fullName,
      phone: updated.phone,
      country: updated.country,
      expertise_area: updated.expertiseArea,
      teaching_topics: updated.teachingTopics,
      credentials: updated.credentials,
      portfolio_links: updated.portfolioLinks,
      course_proposal: updated.courseProposal,
      supporting_files: mapTeacherApplicationFiles(updated.supportingFiles),
      terms_accepted_at: updated.termsAcceptedAt,
      status: updated.status,
      review_notes: updated.reviewNotes,
      admin_notes: updated.adminNotes,
      payout_model: updated.payoutModel,
      revenue_share_percent: updated.revenueSharePercent,
      reviewed_at: updated.reviewedAt,
      reviewed_by_user_id: updated.reviewedByUserId,
      instructor_membership_id: updated.instructorMembershipId,
      created_at: updated.createdAt,
      updated_at: updated.updatedAt,
    },
    {
      userId: input.actor.user?.id,
      email: input.actor.normalizedEmail,
      role: input.actor.roles[0] || "academy_admin",
    }
  );

  const applicantMessage = cleanText(input.reviewNotes) || teacherApplicationStatusDescription(updated.status);

  await appendCustomerActivity({
    userId: updated.userId,
    email: updated.normalizedEmail,
    activityType: "learn_teacher_application_reviewed",
    title: `Teaching application ${teacherApplicationStatusLabel(updated.status).toLowerCase()}`,
    description: applicantMessage,
    status: updated.status,
    referenceType: "learn_teacher_application",
    referenceId: updated.id,
    actionUrl: getLearnUrl("/teach"),
    metadata: {
      payout_model: updated.payoutModel,
      revenue_share_percent: updated.revenueSharePercent,
      reviewed_by_user_id: updated.reviewedByUserId,
    },
  });

  await appendCustomerNotification({
    userId: updated.userId,
    email: updated.normalizedEmail,
    title: `Teaching application ${teacherApplicationStatusLabel(updated.status).toLowerCase()}`,
    body: applicantMessage,
    category: "learn",
    actionUrl: getLearnUrl("/teach"),
    actionLabel: "Open teaching application",
    referenceType: "learn_teacher_application",
    referenceId: updated.id,
  });

  await sendTeacherApplicationStatusNotification({
    audience: {
      userId: updated.userId,
      email: updated.normalizedEmail,
      normalizedEmail: updated.normalizedEmail,
      fullName: updated.fullName,
      phone: updated.phone,
    },
    fullName: updated.fullName,
    applicationId: updated.id,
    status: updated.status,
    reviewNotes: updated.reviewNotes,
    manageUrl: getLearnUrl("/teach"),
  });

  await sendOwnerAlert({
    title: `Teaching application ${teacherApplicationStatusLabel(updated.status).toLowerCase()}: ${updated.fullName}`,
    body: `${updated.fullName}'s HenryCo Learn teaching application is now ${teacherApplicationStatusLabel(updated.status).toLowerCase()}.`,
    entityType: "learn_teacher_application",
    entityId: updated.id,
    actionUrl: `${getDivisionUrl("learn")}/owner/instructors`,
  });

  return updated;
}

export async function confirmEnrollmentPayment(input: {
  paymentId: string;
  actor: LearnViewer;
  sponsor?: boolean;
}) {
  const snapshot = await getLearnSnapshot();
  const payment = snapshot.payments.find((item) => item.id === input.paymentId);
  if (!payment) throw new Error("Payment not found.");
  const enrollment = snapshot.enrollments.find((item) => item.id === payment.enrollmentId);
  const course = snapshot.courses.find((item) => item.id === payment.courseId);
  if (!enrollment || !course) throw new Error("Payment context is incomplete.");

  const confirmedAt = nowIso();
  const updatedPayment: LearnPaymentRecord = {
    ...payment,
    status: input.sponsor ? "sponsored" : "paid",
    method: input.sponsor ? "sponsored" : payment.method,
    confirmedAt,
  };

  await upsertLearnRecord(
    "learn_payments",
    {
      id: updatedPayment.id,
      enrollment_id: updatedPayment.enrollmentId,
      course_id: updatedPayment.courseId,
      user_id: updatedPayment.userId,
      normalized_email: updatedPayment.normalizedEmail,
      amount: updatedPayment.amount,
      currency: updatedPayment.currency,
      status: updatedPayment.status,
      method: updatedPayment.method,
      reference: updatedPayment.reference,
      created_at: updatedPayment.createdAt,
      confirmed_at: updatedPayment.confirmedAt,
    },
    {
      userId: input.actor.user?.id,
      email: input.actor.normalizedEmail,
      role: input.actor.roles[0] || "academy_admin",
    }
  );

  const updatedEnrollment: LearnEnrollment = {
    ...enrollment,
    status: "active",
    paymentStatus: updatedPayment.status,
  };

  await upsertLearnRecord(
    "learn_enrollments",
    {
      id: updatedEnrollment.id,
      course_id: updatedEnrollment.courseId,
      user_id: updatedEnrollment.userId,
      normalized_email: updatedEnrollment.normalizedEmail,
      source: updatedEnrollment.source,
      status: updatedEnrollment.status,
      payment_status: updatedEnrollment.paymentStatus,
      sponsor_name: updatedEnrollment.sponsorName,
      enrolled_at: updatedEnrollment.enrolledAt,
      started_at: updatedEnrollment.startedAt,
      completed_at: updatedEnrollment.completedAt,
      percent_complete: updatedEnrollment.percentComplete,
      last_lesson_id: updatedEnrollment.lastLessonId,
      last_activity_at: updatedEnrollment.lastActivityAt,
    },
    {
      userId: input.actor.user?.id,
      email: input.actor.normalizedEmail,
      role: input.actor.roles[0] || "academy_admin",
    }
  );

  await upsertCustomerInvoice({
    invoiceNo: updatedPayment.reference,
    userId: updatedPayment.userId,
    email: updatedPayment.normalizedEmail,
    subtotal: updatedPayment.amount,
    total: updatedPayment.amount,
    description: `${course.title} academy access`,
    status: updatedPayment.status,
    currency: updatedPayment.currency,
    paymentMethod: updatedPayment.method,
    paymentReference: updatedPayment.reference,
    referenceType: "learn_enrollment",
    referenceId: updatedEnrollment.id,
    paidAt: confirmedAt,
    lineItems: [{ label: course.title, amount: updatedPayment.amount, currency: updatedPayment.currency }],
  });

  await appendCustomerActivity({
    userId: updatedPayment.userId,
    email: updatedPayment.normalizedEmail,
    activityType: "learn_payment_confirmed",
    title: `Payment confirmed for ${course.title}`,
    description: updatedPayment.reference,
    status: updatedPayment.status,
    referenceType: "learn_payment",
    referenceId: updatedPayment.id,
    amount: updatedPayment.amount,
    actionUrl: getLearnCourseRoomUrl(course.id),
  });

  await appendCustomerNotification({
    userId: updatedPayment.userId,
    email: updatedPayment.normalizedEmail,
    title: `${course.title} payment confirmed`,
    body: "The enrollment is now active in HenryCo Learn.",
    category: "learn",
    actionUrl: getLearnCourseRoomUrl(course.id),
    actionLabel: "Open course",
    referenceType: "learn_payment",
    referenceId: updatedPayment.id,
  });

  await sendPaymentConfirmedNotification({
    audience: {
      userId: updatedPayment.userId,
      normalizedEmail: updatedPayment.normalizedEmail,
      email: updatedPayment.normalizedEmail,
    },
    courseTitle: course.title,
    courseId: course.id,
    amount: updatedPayment.amount,
    currency: updatedPayment.currency,
    reference: updatedPayment.reference,
  });

  return {
    payment: updatedPayment,
    enrollment: updatedEnrollment,
  };
}

export async function saveCourseDefinition(input: {
  actor: LearnViewer;
  id?: string | null;
  slug?: string | null;
  title: string;
  subtitle: string;
  summary: string;
  description: string;
  categoryId: string;
  instructorId?: string | null;
  visibility: LearnCourse["visibility"];
  accessModel: LearnCourse["accessModel"];
  difficulty: LearnCourse["difficulty"];
  price: number;
  currency: string;
  durationText: string;
  estimatedMinutes: number;
  status: LearnCourse["status"];
  featured: boolean;
  certification: boolean;
  tags: string[];
  prerequisites: string[];
  outcomes: string[];
}) {
  const id = cleanText(input.id) || stableId("course", cleanText(input.slug) || cleanText(input.title).toLowerCase());
  const slug =
    cleanText(input.slug) ||
    cleanText(input.title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  const timestamp = nowIso();

  await upsertLearnRecord(
    "learn_courses",
    {
      id,
      slug,
      category_id: input.categoryId,
      primary_instructor_id: cleanText(input.instructorId) || null,
      title: cleanText(input.title),
      subtitle: cleanText(input.subtitle),
      summary: cleanText(input.summary),
      description: cleanText(input.description),
      hero_image_url: null,
      preview_video_url: null,
      duration_text: cleanText(input.durationText),
      estimated_minutes: input.estimatedMinutes,
      difficulty: input.difficulty,
      prerequisites: input.prerequisites,
      outcomes: input.outcomes,
      tags: input.tags,
      visibility: input.visibility,
      access_model: input.accessModel,
      plan_id: null,
      price: input.accessModel === "free" ? 0 : input.price,
      currency: cleanText(input.currency) || "NGN",
      featured: input.featured,
      is_certification: input.certification,
      passing_score: input.certification ? 80 : 70,
      completion_rule: input.certification
        ? "Complete lessons and pass the assessment."
        : "Complete all required lessons.",
      status: input.status,
      created_at: timestamp,
      updated_at: timestamp,
    },
    {
      userId: input.actor.user?.id,
      email: input.actor.normalizedEmail,
      role: input.actor.roles[0] || "content_manager",
    }
  );

  await sendOwnerAlert({
    title: `Course saved: ${input.title}`,
    body: "A course definition was created or updated inside HenryCo Learn.",
    entityType: "course",
    entityId: id,
    actionUrl: `${getDivisionUrl("learn")}/owner/courses`,
  });

  return { id, slug };
}

export async function addModuleLessonDefinition(input: {
  actor: LearnViewer;
  courseId: string;
  moduleTitle: string;
  moduleSummary: string;
  lessonTitle: string;
  lessonSummary: string;
  lessonBody: string;
  lessonType: "video" | "reading" | "resource" | "workshop";
  durationMinutes: number;
  preview: boolean;
}) {
  const snapshot = await getLearnSnapshot();
  const course = snapshot.courses.find((item) => item.id === input.courseId);
  if (!course) throw new Error("Course not found.");

  const moduleSortOrder =
    snapshot.modules.filter((item) => item.courseId === course.id).length + 1;
  const moduleId = stableId("module", `${course.id}:${moduleSortOrder}:${input.moduleTitle}`);
  const lessonId = stableId("lesson", `${moduleId}:${input.lessonTitle}`);
  const lessonSlug = cleanText(input.lessonTitle)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  await upsertLearnRecord(
    "learn_modules",
    {
      id: moduleId,
      course_id: course.id,
      title: cleanText(input.moduleTitle),
      summary: cleanText(input.moduleSummary),
      sort_order: moduleSortOrder,
      unlock_rule: "sequential",
      estimated_minutes: input.durationMinutes,
      created_at: nowIso(),
      updated_at: nowIso(),
    },
    {
      userId: input.actor.user?.id,
      email: input.actor.normalizedEmail,
      role: input.actor.roles[0] || "content_manager",
    }
  );

  await upsertLearnRecord(
    "learn_lessons",
    {
      id: lessonId,
      course_id: course.id,
      module_id: moduleId,
      slug: lessonSlug,
      title: cleanText(input.lessonTitle),
      summary: cleanText(input.lessonSummary),
      body_markdown: cleanText(input.lessonBody),
      video_url: null,
      duration_minutes: input.durationMinutes,
      lesson_type: input.lessonType,
      is_preview: input.preview,
      sort_order: 1,
      created_at: nowIso(),
      updated_at: nowIso(),
    },
    {
      userId: input.actor.user?.id,
      email: input.actor.normalizedEmail,
      role: input.actor.roles[0] || "content_manager",
    }
  );
}

export async function savePathDefinition(input: {
  actor: LearnViewer;
  id?: string | null;
  slug?: string | null;
  title: string;
  summary: string;
  description: string;
  audience: string;
  visibility: LearnCourse["visibility"];
  accessModel: LearnCourse["accessModel"];
  featured: boolean;
  status: LearnCourse["status"];
  courseIds: string[];
}) {
  const id = cleanText(input.id) || stableId("path", cleanText(input.slug) || cleanText(input.title));
  const slug =
    cleanText(input.slug) ||
    cleanText(input.title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  await upsertLearnRecord(
    "learn_learning_paths",
    {
      id,
      slug,
      title: cleanText(input.title),
      summary: cleanText(input.summary),
      description: cleanText(input.description),
      hero_image_url: null,
      audience: cleanText(input.audience),
      visibility: input.visibility,
      access_model: input.accessModel,
      plan_id: null,
      featured: input.featured,
      status: input.status,
      created_at: nowIso(),
      updated_at: nowIso(),
    },
    {
      userId: input.actor.user?.id,
      email: input.actor.normalizedEmail,
      role: input.actor.roles[0] || "content_manager",
    }
  );

  const existing = (await getLearnSnapshot()).pathItems.filter((item) => item.pathId === id);
  for (const item of existing) {
    await deleteLearnRecord("learn_path_items", item.id, {
      userId: input.actor.user?.id,
      email: input.actor.normalizedEmail,
      role: input.actor.roles[0] || "content_manager",
    });
  }

  for (const [index, courseId] of input.courseIds.entries()) {
    await upsertLearnRecord(
      "learn_path_items",
      {
        id: stableId("path-item", `${id}:${courseId}:${index + 1}`),
        path_id: id,
        item_type: "course",
        course_id: courseId,
        label: `Course ${index + 1}`,
        description: "Sequenced path item",
        sort_order: index + 1,
        required: true,
        created_at: nowIso(),
      },
      {
        userId: input.actor.user?.id,
        email: input.actor.normalizedEmail,
        role: input.actor.roles[0] || "content_manager",
      }
    );
  }

  return { id, slug };
}

export async function assignTraining(input: {
  actor: LearnViewer;
  courseId?: string | null;
  pathId?: string | null;
  email: string;
  assigneeRole?: string | null;
  sponsorName?: string | null;
  note: string;
  dueAt?: string | null;
}) {
  const normalizedEmail = normalizeEmail(input.email);
  if (!normalizedEmail) throw new Error("A valid learner email is required.");
  const snapshot = await getLearnSnapshot();
  const course = input.courseId
    ? snapshot.courses.find((item) => item.id === input.courseId) || null
    : null;
  const path = input.pathId
    ? snapshot.paths.find((item) => item.id === input.pathId) || null
    : null;
  if (!course && !path) throw new Error("Pick a course or a path for this assignment.");

  const assignmentId = stableId("assignment", `${input.courseId || input.pathId}:${normalizedEmail}`);
  await upsertLearnRecord(
    "learn_assignments",
    {
      id: assignmentId,
      course_id: input.courseId || null,
      path_id: input.pathId || null,
      user_id: null,
      normalized_email: normalizedEmail,
      assignee_role: cleanText(input.assigneeRole) || null,
      assigned_by_user_id: input.actor.user?.id || null,
      sponsor_name: cleanText(input.sponsorName) || null,
      note: cleanText(input.note),
      required: true,
      due_at: cleanText(input.dueAt) || null,
      assigned_at: nowIso(),
      status: "assigned",
    },
    {
      userId: input.actor.user?.id,
      email: input.actor.normalizedEmail,
      role: input.actor.roles[0] || "internal_manager",
    }
  );

  if (course) {
    await enrollInCourse({
      viewer: {
        user: null,
        normalizedEmail,
        roles: ["learner"],
        memberships: [],
      },
      courseId: course.id,
      source: "assignment",
      sponsorName: input.sponsorName,
    }).catch(() => null);
  }

  await appendCustomerActivity({
    email: normalizedEmail,
    activityType: "learn_training_assigned",
    title: `Assigned ${course?.title || path?.title || "training"}`,
    description: cleanText(input.note),
    status: "assigned",
    referenceType: "learn_assignment",
    referenceId: assignmentId,
    actionUrl: getAccountLearnUrl("assignments"),
    metadata: {
      course_id: course?.id || null,
      path_id: path?.id || null,
      due_at: cleanText(input.dueAt) || null,
    },
  });

  await appendCustomerNotification({
    email: normalizedEmail,
    title: `${course?.title || path?.title || "Training"} assigned`,
    body: cleanText(input.note) || "A HenryCo training assignment is waiting in your academy queue.",
    category: "learn",
    actionUrl: getAccountLearnUrl("assignments"),
    actionLabel: "Open account",
    referenceType: "learn_assignment",
    referenceId: assignmentId,
  });

  await sendInternalAssignmentNotification({
    audience: { email: normalizedEmail, normalizedEmail },
    title: course?.title || path?.title || "Assigned training",
    entityId: assignmentId,
    dueAt: input.dueAt,
    sponsorName: input.sponsorName,
    note: input.note,
  });

  return { assignmentId };
}

export async function publishAcademyAnnouncement(input: {
  actor: LearnViewer;
  title: string;
  body: string;
  audience: "all_active_learners" | "internal_learners";
}) {
  const snapshot = await getLearnSnapshot();
  const announcementId = stableId("announcement", `${input.title}:${nowIso()}`);
  const enrollments = snapshot.enrollments.filter((item) => item.status === "active" || item.status === "completed");
  const internalCourseIds = new Set(
    snapshot.courses.filter((item) => item.visibility !== "public").map((item) => item.id)
  );
  const targets =
    input.audience === "internal_learners"
      ? enrollments.filter((item) => internalCourseIds.has(item.courseId))
      : enrollments;

  const uniqueTargets = new Map<string, { userId: string | null; normalizedEmail: string | null }>();
  for (const target of targets) {
    const key = target.userId || target.normalizedEmail;
    if (!key) continue;
    uniqueTargets.set(key, {
      userId: target.userId,
      normalizedEmail: target.normalizedEmail,
    });
  }

  await upsertLearnRecord(
    "learn_settings",
    {
      key: `announcement:${announcementId}`,
      value: {
        title: cleanText(input.title),
        body: cleanText(input.body),
        audience: input.audience,
        sent_count: uniqueTargets.size,
      },
      created_at: nowIso(),
      updated_at: nowIso(),
    },
    {
      userId: input.actor.user?.id,
      email: input.actor.normalizedEmail,
      role: input.actor.roles[0] || "academy_admin",
    },
    { onConflict: "key", idKey: "key" }
  );

  for (const target of uniqueTargets.values()) {
    await appendCustomerNotification({
      userId: target.userId,
      email: target.normalizedEmail,
      title: cleanText(input.title),
      body: cleanText(input.body),
      category: "learn",
      actionUrl: getAccountLearnUrl("notifications"),
      actionLabel: "Open account",
      referenceType: "learn_announcement",
      referenceId: announcementId,
    });

    await sendAcademyAnnouncementNotification({
      audience: {
        userId: target.userId,
        email: target.normalizedEmail,
        normalizedEmail: target.normalizedEmail,
      },
      title: cleanText(input.title),
      body: cleanText(input.body),
      entityId: announcementId,
    });
  }

  await sendOwnerAlert({
    title: `Announcement sent: ${input.title}`,
    body: `HenryCo Learn sent an academy announcement to ${uniqueTargets.size} learner accounts.`,
    entityType: "announcement",
    entityId: announcementId,
    actionUrl: `${getDivisionUrl("learn")}/owner/settings`,
  });

  return { announcementId, count: uniqueTargets.size };
}

export async function createLearnerSupportRequest(input: {
  viewer: LearnViewer;
  subject: string;
  body: string;
}) {
  const identity = assertViewerIdentity(input.viewer);
  const userId = identity.userId || stableId("support-user", identity.normalizedEmail || createId());

  if (!identity.userId) {
    await ensureCustomerProfile({
      userId,
      email: identity.normalizedEmail,
      fullName: identity.fullName,
    });
  }

  const threadId = await createSupportThread({
    userId,
    subject: cleanText(input.subject),
    category: "academy",
    priority: "normal",
    initialMessage: cleanText(input.body),
    senderId: userId,
    senderType: "customer",
  });

  await appendCustomerActivity({
    userId,
    email: identity.normalizedEmail,
    activityType: "learn_support_thread_created",
    title: `Support request created: ${cleanText(input.subject)}`,
    description: cleanText(input.body),
    referenceType: "support_thread",
    referenceId: threadId,
    actionUrl: `${getDivisionUrl("learn")}/support`,
  });

  await sendOwnerAlert({
    title: `New academy support request: ${cleanText(input.subject)}`,
    body: cleanText(input.body),
    entityType: "support_thread",
    entityId: threadId,
    actionUrl: `${getDivisionUrl("learn")}/support`,
  });

  return { threadId };
}
