import fs from "node:fs";
import path from "node:path";
import type { LearnViewer } from "../lib/learn/types";

const appDir = process.cwd();
const rootDir = path.resolve(appDir, "..", "..");

function loadEnvFile(filepath: string) {
  if (!fs.existsSync(filepath)) return;
  const content = fs.readFileSync(filepath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index <= 0) continue;
    const key = line.slice(0, index).trim();
    const raw = line.slice(index + 1).trim();
    if (!key || process.env[key]) continue;
    process.env[key] = raw.replace(/^['"]|['"]$/g, "");
  }
}

loadEnvFile(path.join(rootDir, ".env.local"));
loadEnvFile(path.join(rootDir, ".env.production.vercel"));
loadEnvFile(path.join(rootDir, ".vercel", ".env.production.local"));

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function cleanText(value?: string | null) {
  return String(value || "").trim();
}

async function main() {
  const runId = Date.now().toString(36);

  const { createAdminSupabase } = await import("../lib/supabase");
  const { seedLearnBaseline } = await import("../lib/learn/seed");
  const {
    getLearnSnapshot,
    getCourseCatalog,
    getCourseBySlug,
    getCertificateByCode,
    getLearnerWorkspace,
    getOwnerAnalytics,
    getTeacherApplicationForViewer,
  } = await import("../lib/learn/data");
  const {
    syncViewerIdentity,
    enrollInCourse,
    toggleSavedCourse,
    completeLesson,
    submitQuizAttempt,
    confirmEnrollmentPayment,
    saveCourseDefinition,
    addModuleLessonDefinition,
    savePathDefinition,
    assignTraining,
    publishAcademyAnnouncement,
    createLearnerSupportRequest,
    reviewTeacherApplication,
    submitTeacherApplication,
  } = await import("../lib/learn/workflows");
  const { runLearnAutomationSweep } = await import("../lib/learn/automation");
  const { upsertLearnRecord } = await import("../lib/learn/store");
  const admin = createAdminSupabase();
  const listedUsers = await admin.auth.admin.listUsers({ page: 1, perPage: 100 });
  if (listedUsers.error) {
    throw listedUsers.error;
  }

  const authUsers = (listedUsers.data.users ?? []).filter((user) => cleanText(user.email));
  assert(authUsers.length >= 2, "Supabase Auth needs at least two existing users for live verification.");

  const ownerUser =
    authUsers.find((user) => {
      const role = cleanText(String(user.user_metadata?.role || user.app_metadata?.role || "")).toLowerCase();
      return role === "owner" || role === "manager";
    }) || authUsers[0]!;

  const learnerUser =
    authUsers.find((user) => user.id !== ownerUser.id) || ownerUser;

  const internalUser =
    authUsers.find((user) => user.id !== ownerUser.id && user.id !== learnerUser.id) || learnerUser;

  const learnerEmail = cleanText(learnerUser.email).toLowerCase();
  const ownerEmail = cleanText(ownerUser.email).toLowerCase();
  const internalEmail = cleanText(internalUser.email).toLowerCase();

  const learnerViewer: LearnViewer = {
    user: {
      id: learnerUser.id,
      email: learnerEmail,
      fullName: "HenryCo Academy QA Learner",
    },
    normalizedEmail: learnerEmail.toLowerCase(),
    roles: ["learner"],
    memberships: [],
  };

  const ownerViewer: LearnViewer = {
    user: {
      id: ownerUser.id,
      email: ownerEmail,
      fullName: "HenryCo Academy QA Owner",
    },
    normalizedEmail: ownerEmail.toLowerCase(),
    roles: ["academy_owner", "academy_admin", "content_manager"],
    memberships: [],
  };

  const internalViewer: LearnViewer = {
    user: {
      id: internalUser.id,
      email: internalEmail,
      fullName: "HenryCo Academy QA Internal",
    },
    normalizedEmail: internalEmail.toLowerCase(),
    roles: ["learner"],
    memberships: [],
  };

  await seedLearnBaseline({ role: "academy_system" });
  await syncViewerIdentity(learnerViewer);
  await syncViewerIdentity(internalViewer);

  let snapshot = await getLearnSnapshot();
  assert(snapshot.courses.length >= 7, "Baseline course seed is incomplete.");
  assert(snapshot.paths.length >= 4, "Baseline path seed is incomplete.");

  const publicCatalog = await getCourseCatalog();
  assert(publicCatalog.length >= 4, "Public course catalog is too small.");
  const internalPublicAccess = await getCourseBySlug("care-service-excellence", null);
  assert(!internalPublicAccess, "Internal course is leaking into public access.");

  const featuredCourse = snapshot.courses.find((course) => course.slug === "marketplace-seller-launch");
  const certificateCourse = snapshot.courses.find((course) => course.slug === "verified-seller-certification");
  const internalCourse = snapshot.courses.find((course) => course.slug === "care-service-excellence");

  assert(featuredCourse, "Could not find marketplace seller launch course.");
  assert(certificateCourse, "Could not find certification course.");
  assert(internalCourse, "Could not find internal course.");
  const progressCourse =
    snapshot.courses.find(
      (course) =>
        course.accessModel === "free" &&
        course.visibility === "public" &&
        snapshot.lessons.filter((lesson) => lesson.courseId === course.id).length > 1
    ) || null;
  assert(progressCourse, "Could not find a free course suitable for progress reminder verification.");

  const createdCourse = await saveCourseDefinition({
    actor: ownerViewer,
    slug: `academy-qa-readiness-${runId}`,
    title: `Academy QA Readiness ${runId}`,
    subtitle: "Operational verification course",
    summary: "QA-owned course to validate content operations and publishing.",
    description:
      "A targeted course used during automated academy verification to prove owner tooling, publishing, and content persistence.",
    categoryId: snapshot.categories[0]?.id || "",
    instructorId: snapshot.instructors[0]?.id || null,
    visibility: "public",
    accessModel: "free",
    difficulty: "intermediate",
    price: 0,
    currency: "NGN",
    durationText: "45 min",
    estimatedMinutes: 45,
    status: "published",
    featured: false,
    certification: false,
    tags: ["qa", "academy", "ops"],
    prerequisites: ["HenryCo Learn access"],
    outcomes: ["Verify owner editing", "Validate live content publishing"],
  });

  await addModuleLessonDefinition({
    actor: ownerViewer,
    courseId: createdCourse.id,
    moduleTitle: "QA Operations Module",
    moduleSummary: "Ensures module and lesson creation works live.",
    lessonTitle: "Publishing discipline",
    lessonSummary: "Validates lesson authoring inside HenryCo Learn.",
    lessonBody:
      "This lesson exists to verify that owners can create new modules and lessons without falling back to static content.",
    lessonType: "reading",
    durationMinutes: 12,
    preview: true,
  });

  const createdPath = await savePathDefinition({
    actor: ownerViewer,
    slug: `academy-qa-path-${runId}`,
    title: `Academy QA Path ${runId}`,
    summary: "Verification path for publishing workflows.",
    description: "Bundles the new QA course with a live academy course to prove path persistence.",
    audience: "academy operators",
    visibility: "public",
    accessModel: "free",
    featured: false,
    status: "published",
    courseIds: [createdCourse.id, featuredCourse.id],
  });

  const paidEnrollment = await enrollInCourse({
    viewer: learnerViewer,
    courseId: certificateCourse.id,
    source: "self",
  });
  assert(
    ["awaiting_payment", "active", "completed"].includes(paidEnrollment.enrollment.status),
    "Paid enrollment could not be created or resumed."
  );

  let paymentResult:
    | {
        enrollment: typeof paidEnrollment.enrollment;
        payment: NonNullable<typeof paidEnrollment.payment>;
      }
    | null = null;

  if (paidEnrollment.enrollment.status === "awaiting_payment") {
    assert(paidEnrollment.payment?.status === "pending", "Paid enrollment did not create a pending payment.");
    const confirmed = await confirmEnrollmentPayment({
      paymentId: paidEnrollment.payment!.id,
      actor: ownerViewer,
    });
    paymentResult = {
      enrollment: confirmed.enrollment,
      payment: confirmed.payment,
    };
  } else {
    snapshot = await getLearnSnapshot();
    const existingPayment = snapshot.payments.find((item) => item.enrollmentId === paidEnrollment.enrollment.id) || null;
    assert(existingPayment, "Active paid enrollment is missing its payment record.");
    if (existingPayment.status === "pending") {
      const confirmed = await confirmEnrollmentPayment({
        paymentId: existingPayment.id,
        actor: ownerViewer,
      });
      paymentResult = {
        enrollment: confirmed.enrollment,
        payment: confirmed.payment,
      };
    } else {
      paymentResult = {
        enrollment: paidEnrollment.enrollment,
        payment: existingPayment,
      };
    }
  }

  assert(paymentResult.enrollment.status !== "awaiting_payment", "Payment confirmation did not unlock the enrollment.");
  assert(
    ["paid", "sponsored", "pending"].includes(paymentResult.payment.status),
    "Paid enrollment is missing a valid payment state."
  );

  await toggleSavedCourse({
    viewer: learnerViewer,
    courseId: featuredCourse.id,
  });

  snapshot = await getLearnSnapshot();
  const certificateLessons = snapshot.lessons
    .filter((lesson) => lesson.courseId === certificateCourse.id)
    .sort((left, right) => left.sortOrder - right.sortOrder);
  assert(certificateLessons.length > 0, "Certification course has no lessons.");
  for (const lesson of certificateLessons) {
    await completeLesson({
      viewer: learnerViewer,
      courseId: certificateCourse.id,
      lessonId: lesson.id,
      secondsWatched: Math.max(lesson.durationMinutes * 60, 120),
    });
  }

  snapshot = await getLearnSnapshot();
  const quiz = snapshot.quizzes.find((item) => item.courseId === certificateCourse.id);
  assert(quiz, "Certification course has no assessment.");
  const questions = snapshot.questions.filter((item) => item.quizId === quiz.id);
  assert(questions.length > 0, "Certification quiz has no questions.");

  const quizResult = await submitQuizAttempt({
    viewer: learnerViewer,
    courseId: certificateCourse.id,
    quizId: quiz.id,
    answers: Object.fromEntries(questions.map((question) => [question.id, question.correctAnswer])),
  });
  assert(quizResult.passed, "Correct quiz submission did not pass.");
  assert(quizResult.certificate, "Certificate was not issued after successful completion.");

  const certificateLookup = await getCertificateByCode(quizResult.certificate!.verificationCode);
  assert(certificateLookup, "Certificate verification lookup failed.");

  const assignmentResult = await assignTraining({
    actor: ownerViewer,
    courseId: internalCourse.id,
    email: internalEmail,
    assigneeRole: "care_staff",
    sponsorName: "HenryCo Learn QA",
    note: "Assigned to verify restricted academy training flow.",
    dueAt: "2026-04-03T18:00:00.000Z",
  });

  await syncViewerIdentity(internalViewer);
  const internalCourseView = await getCourseBySlug("care-service-excellence", internalViewer);
  assert(internalCourseView, "Assigned internal learner could not access restricted course.");

  const existingTeacherApplication = await getTeacherApplicationForViewer(internalViewer);
  if (existingTeacherApplication?.status === "approved") {
    await reviewTeacherApplication({
      actor: ownerViewer,
      applicationId: existingTeacherApplication.id,
      status: "changes_requested",
      reviewNotes: "Automation is reopening this application to verify the full review cycle.",
      adminNotes: `QA reset ${runId}`,
      payoutModel: "revenue_share",
      revenueSharePercent: 30,
    });
  }

  const teacherApplication = await submitTeacherApplication({
    viewer: internalViewer,
    fullName: internalViewer.user?.fullName || "HenryCo Academy QA Internal",
    phone: "+2349133957084",
    country: "Nigeria",
    expertiseArea: "Academy QA and operational training systems",
    teachingTopics: [`Academy QA ${runId}`, "Operations readiness", "Internal enablement"],
    credentials:
      "Operational QA lead for HenryCo academy verification with practical experience in structured learning flows, publishing checks, and readiness reviews.",
    portfolioLinks: ["https://learn.henrycogroup.com/academy", "https://henrycogroup.com"],
    courseProposal:
      "A practical academy operations course that teaches staff and partners how to structure learning experiences, validate readiness, and deliver premium instructional quality inside HenryCo Learn.",
    supportingFiles: [],
    agreementAccepted: true,
  });

  const teacherChangesRequested = await reviewTeacherApplication({
    actor: ownerViewer,
    applicationId: teacherApplication.id,
    status: "changes_requested",
    reviewNotes: "Please sharpen the audience framing and sequence the learning outcomes more clearly.",
    adminNotes: `QA change request ${runId}`,
    payoutModel: "revenue_share",
    revenueSharePercent: 30,
  });
  assert(
    teacherChangesRequested.status === "changes_requested",
    "Teaching application could not move into changes requested state."
  );

  const teacherApproved = await reviewTeacherApplication({
    actor: ownerViewer,
    applicationId: teacherApplication.id,
    status: "approved",
    reviewNotes: "Application approved for instructor onboarding readiness.",
    adminNotes: `QA approval ${runId}`,
    payoutModel: "revenue_share",
    revenueSharePercent: 30,
  });
  assert(teacherApproved.status === "approved", "Teaching application approval failed.");
  assert(
    cleanText(teacherApproved.instructorMembershipId),
    "Approved teaching application did not create an instructor membership reference."
  );

  const supportRequest = await createLearnerSupportRequest({
    viewer: learnerViewer,
    subject: `Academy QA support ${runId}`,
    body: "Support workflow verification for HenryCo Learn.",
  });
  assert(cleanText(supportRequest.threadId), "Support request did not return a thread id.");

  const announcement = await publishAcademyAnnouncement({
    actor: ownerViewer,
    title: `Academy QA announcement ${runId}`,
    body: "Verification announcement to confirm academy-wide messaging and notification persistence.",
    audience: "all_active_learners",
  });
  assert(announcement.count >= 1, "Announcement did not reach active learners.");

  snapshot = await getLearnSnapshot();

  const nudgeEnrollment =
    snapshot.enrollments.find(
      (item) => item.courseId === createdCourse.id && item.userId === learnerUser.id
    ) ||
    (await enrollInCourse({
      viewer: learnerViewer,
      courseId: createdCourse.id,
      source: "self",
    })).enrollment;

  await upsertLearnRecord(
    "learn_enrollments",
    {
      id: nudgeEnrollment.id,
      course_id: nudgeEnrollment.courseId,
      user_id: learnerUser.id,
      normalized_email: learnerEmail.toLowerCase(),
      source: nudgeEnrollment.source,
      status: "active",
      payment_status: "not_required",
      sponsor_name: nudgeEnrollment.sponsorName,
      enrolled_at: "2026-03-30T09:00:00.000Z",
      started_at: null,
      completed_at: null,
      percent_complete: 0,
      last_lesson_id: null,
      last_activity_at: null,
    },
    {
      userId: ownerUser.id,
      email: ownerEmail.toLowerCase(),
      role: "academy_owner",
    }
  );

  snapshot = await getLearnSnapshot();
  const progressLessons = snapshot.lessons
    .filter((lesson) => lesson.courseId === progressCourse.id)
    .sort((left, right) => left.sortOrder - right.sortOrder);
  assert(progressLessons.length > 1, "Progress verification course does not have enough lessons.");

  const progressEnrollment =
    snapshot.enrollments.find(
      (item) => item.courseId === progressCourse.id && item.userId === learnerUser.id
    ) ||
    (await enrollInCourse({
      viewer: learnerViewer,
      courseId: progressCourse.id,
      source: "self",
    })).enrollment;

  await completeLesson({
    viewer: learnerViewer,
    courseId: progressCourse.id,
    lessonId: progressLessons[0]!.id,
    secondsWatched: Math.max(progressLessons[0]!.durationMinutes * 60, 120),
  });

  snapshot = await getLearnSnapshot();
  const refreshedProgressEnrollment = snapshot.enrollments.find((item) => item.id === progressEnrollment.id);
  assert(refreshedProgressEnrollment, "Progress enrollment could not be reloaded.");
  assert(
    refreshedProgressEnrollment.percentComplete > 0 &&
      refreshedProgressEnrollment.percentComplete < 100,
    "Partial progress course did not remain mid-progress."
  );

  await upsertLearnRecord(
    "learn_enrollments",
    {
      id: refreshedProgressEnrollment.id,
      course_id: refreshedProgressEnrollment.courseId,
      user_id: learnerUser.id,
      normalized_email: learnerEmail.toLowerCase(),
      source: refreshedProgressEnrollment.source,
      status: refreshedProgressEnrollment.status,
      payment_status: refreshedProgressEnrollment.paymentStatus,
      sponsor_name: refreshedProgressEnrollment.sponsorName,
      enrolled_at: "2026-03-28T09:00:00.000Z",
      started_at: refreshedProgressEnrollment.startedAt,
      completed_at: refreshedProgressEnrollment.completedAt,
      percent_complete: refreshedProgressEnrollment.percentComplete,
      last_lesson_id: refreshedProgressEnrollment.lastLessonId,
      last_activity_at: "2026-03-29T09:00:00.000Z",
    },
    {
      userId: ownerUser.id,
      email: ownerEmail.toLowerCase(),
      role: "academy_owner",
    }
  );

  const automation = await runLearnAutomationSweep(new Date("2026-04-05T18:00:00.000Z"));
  assert(automation.courseNudgesSent >= 1, "Automation did not send a course nudge.");
  assert(automation.progressRemindersSent >= 1, "Automation did not send a progress reminder.");
  assert(automation.assignmentRemindersSent >= 1, "Automation did not send an assignment reminder.");

  const learnerWorkspace = await getLearnerWorkspace(learnerViewer);
  assert(
    learnerWorkspace.enrollments.some((item) => item.courseId === certificateCourse.id),
    "Learner workspace is missing the paid certification enrollment."
  );
  assert(
    learnerWorkspace.certificates.some((item) => item.courseId === certificateCourse.id),
    "Learner workspace is missing the earned certificate."
  );
  assert(learnerWorkspace.savedCourses.length >= 1, "Learner workspace is missing saved courses.");
  assert(learnerWorkspace.notifications.length >= 5, "Learner notifications did not populate.");

  const internalWorkspace = await getLearnerWorkspace(internalViewer);
  assert(
    internalWorkspace.assignments.some((item) => item.id === assignmentResult.assignmentId),
    "Assigned learner workspace is missing the internal assignment."
  );
  assert(
    snapshot.teacherApplications.some(
      (item) => item.id === teacherApproved.id && item.status === "approved"
    ),
    "Approved teacher application did not persist in the academy snapshot."
  );

  const analytics = await getOwnerAnalytics();
  assert(analytics.metrics.totalCourses >= 8, "Owner analytics did not reflect academy course inventory.");
  assert(analytics.metrics.totalRevenue > 0, "Owner analytics did not reflect academy revenue.");

  const { count: activityCount, error: activityError } = await admin
    .from("customer_activity")
    .select("*", { count: "exact", head: true })
    .eq("user_id", learnerUser.id)
    .eq("division", "learn");
  if (activityError) throw activityError;

  const { count: invoiceCount, error: invoiceError } = await admin
    .from("customer_invoices")
    .select("*", { count: "exact", head: true })
    .eq("user_id", learnerUser.id)
    .eq("division", "learn");
  if (invoiceError) throw invoiceError;

  const { count: documentCount, error: documentError } = await admin
    .from("customer_documents")
    .select("*", { count: "exact", head: true })
    .eq("user_id", learnerUser.id)
    .eq("division", "learn");
  if (documentError) throw documentError;

  const { count: customerNotificationCount, error: customerNotificationError } = await admin
    .from("customer_notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", learnerUser.id)
    .eq("division", "learn");
  if (customerNotificationError) throw customerNotificationError;

  const { data: supportThread, error: supportThreadError } = await admin
    .from("support_threads")
    .select("id,status,division")
    .eq("id", supportRequest.threadId)
    .maybeSingle();
  if (supportThreadError) throw supportThreadError;

  snapshot = await getLearnSnapshot();
  const announcementNotifications = snapshot.notifications.filter(
    (item) => item.templateKey === "academy_announcement"
  );
  const courseNudges = snapshot.notifications.filter((item) => item.templateKey === "course_nudge");
  const progressReminders = snapshot.notifications.filter((item) => item.templateKey === "progress_reminder");
  const assignmentReminders = snapshot.notifications.filter((item) => item.templateKey === "internal_assignment");
  const teacherApplicationNotifications = snapshot.notifications.filter((item) =>
    [
      "teacher_application_submitted",
      "teacher_application_changes_requested",
      "teacher_application_approved",
    ].includes(item.templateKey)
  );

  assert((activityCount || 0) >= 3, "Shared account activity did not persist.");
  assert((invoiceCount || 0) >= 1, "Shared account invoice did not persist.");
  assert((documentCount || 0) >= 1, "Certificate document did not persist.");
  assert((customerNotificationCount || 0) >= 3, "Shared account notifications did not persist.");
  assert(supportThread?.division === "learn", "Support thread was not created for the learn division.");
  assert(announcementNotifications.length >= 2, "Announcement notifications were not stored.");
  assert(courseNudges.length >= 1, "Course nudge notifications were not stored.");
  assert(progressReminders.length >= 1, "Progress reminder notifications were not stored.");
  assert(assignmentReminders.length >= 2, "Assignment notifications/reminders were not stored.");
  assert(
    teacherApplicationNotifications.length >= 3,
    "Teacher application notifications were not stored."
  );

  const resendConfigured = Boolean(cleanText(process.env.RESEND_API_KEY));
  const whatsappConfigured = Boolean(
    cleanText(process.env.TWILIO_ACCOUNT_SID) ||
      cleanText(process.env.WHATSAPP_PHONE_NUMBER_ID)
  );

  console.log(
    JSON.stringify(
      {
        runId,
        learnerUserId: learnerUser.id,
        ownerUserId: ownerUser.id,
        internalUserId: internalUser.id,
        publicCatalogCount: publicCatalog.length,
        createdCourse,
        createdPath,
        certificate: quizResult.certificate,
        assignmentId: assignmentResult.assignmentId,
        teacherApplication: {
          id: teacherApproved.id,
          status: teacherApproved.status,
          instructorMembershipId: teacherApproved.instructorMembershipId,
        },
        announcementCount: announcement.count,
        automation,
        learnerWorkspace: {
          enrollments: learnerWorkspace.enrollments.length,
          certificates: learnerWorkspace.certificates.length,
          notifications: learnerWorkspace.notifications.length,
          savedCourses: learnerWorkspace.savedCourses.length,
        },
        internalWorkspace: {
          assignments: internalWorkspace.assignments.length,
          enrollments: internalWorkspace.enrollments.length,
        },
        ownerAnalytics: analytics.metrics,
        sharedAccount: {
          activityCount,
          invoiceCount,
          documentCount,
          customerNotificationCount,
        },
        messaging: {
          resendConfigured,
          whatsappConfigured,
          emailNotificationCount: snapshot.notifications.filter((item) => item.channel === "email").length,
          whatsappNotificationCount: snapshot.notifications.filter((item) => item.channel === "whatsapp").length,
        },
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[learn:verify-flows] Verification failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
