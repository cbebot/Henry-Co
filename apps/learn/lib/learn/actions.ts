"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireLearnRoles, requireLearnUser } from "@/lib/learn/auth";
import { getAccountLearnUrl } from "@/lib/learn/links";
import {
  addModuleLessonDefinition,
  assignTraining,
  completeLesson,
  confirmEnrollmentPayment,
  createLearnerSupportRequest,
  enrollInCourse,
  markNotificationRead,
  publishAcademyAnnouncement,
  reviewTeacherApplication,
  saveCourseDefinition,
  savePathDefinition,
  submitTeacherApplication,
  submitQuizAttempt,
  syncViewerIdentity,
  toggleSavedCourse,
  updateLearnerPreferences,
} from "@/lib/learn/workflows";

function asList(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => String(value || "").trim())
    .filter(Boolean);
}

function asCsvList(formData: FormData, key: string) {
  return String(formData.get(key) || "")
    .split(/\r?\n|,/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function asBoolean(formData: FormData, key: string) {
  const value = String(formData.get(key) || "");
  return value === "on" || value === "true";
}

function asFiles(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is File => value instanceof File && value.size > 0);
}

export async function enrollInCourseAction(formData: FormData) {
  const courseId = String(formData.get("courseId") || "");
  if (!courseId) redirect("/courses");
  const viewer = await requireLearnUser("/courses");
  await syncViewerIdentity(viewer);
  const result = await enrollInCourse({ viewer, courseId });
  revalidatePath("/courses");
  revalidatePath(`/courses/${result.course.slug}`);
  revalidatePath("/learner");
  redirect(
    result.enrollment.status === "awaiting_payment"
      ? getAccountLearnUrl("payments")
      : `/learner/courses/${result.course.id}`
  );
}

export async function toggleSavedCourseAction(formData: FormData) {
  const viewer = await requireLearnUser("/learner/saved");
  const courseId = String(formData.get("courseId") || "");
  if (!courseId) redirect("/courses");
  await toggleSavedCourse({ viewer, courseId });
  revalidatePath("/courses");
  revalidatePath("/learner/saved");
}

export async function completeLessonAction(formData: FormData) {
  const viewer = await requireLearnUser("/learner/courses");
  const courseId = String(formData.get("courseId") || "");
  const lessonId = String(formData.get("lessonId") || "");
  if (!courseId || !lessonId) redirect("/learner/courses");
  const result = await completeLesson({ viewer, courseId, lessonId });
  revalidatePath(`/learner/courses/${courseId}`);
  revalidatePath("/learner/progress");
  if (result.certificate) {
    revalidatePath("/learner/certificates");
  }
  redirect(`/learner/courses/${courseId}`);
}

export async function submitQuizAttemptAction(formData: FormData) {
  const viewer = await requireLearnUser("/learner/courses");
  const courseId = String(formData.get("courseId") || "");
  const quizId = String(formData.get("quizId") || "");
  if (!courseId || !quizId) redirect("/learner/courses");

  const answers: Record<string, string[]> = {};
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("question:")) continue;
    const questionId = key.replace("question:", "");
    const current = answers[questionId] || [];
    current.push(String(value || ""));
    answers[questionId] = current;
  }

  await submitQuizAttempt({ viewer, courseId, quizId, answers });
  revalidatePath(`/learner/courses/${courseId}`);
  revalidatePath("/learner/certificates");
  revalidatePath("/learner/progress");
  redirect(`/learner/courses/${courseId}`);
}

export async function markNotificationReadAction(formData: FormData) {
  const viewer = await requireLearnUser("/learner/notifications");
  const notificationId = String(formData.get("notificationId") || "");
  if (!notificationId) redirect("/learner/notifications");
  await markNotificationRead({ viewer, notificationId });
  revalidatePath("/learner/notifications");
}

export async function updateLearnerPreferencesAction(formData: FormData) {
  const viewer = await requireLearnUser("/learner/settings");
  await updateLearnerPreferences({
    viewer,
    fullName: String(formData.get("fullName") || ""),
    phone: String(formData.get("phone") || ""),
    reminderChannel: String(formData.get("reminderChannel") || "email"),
    announcementOptIn: asBoolean(formData, "announcementOptIn"),
  });
  revalidatePath("/learner/settings");
  redirect("/learner/settings");
}

export async function createSupportRequestAction(formData: FormData) {
  const viewer = await requireLearnUser("/help");
  await createLearnerSupportRequest({
    viewer,
    subject: String(formData.get("subject") || ""),
    body: String(formData.get("body") || ""),
  });
  revalidatePath("/support");
  redirect("/help?sent=1");
}

export async function submitTeacherApplicationAction(formData: FormData) {
  const viewer = await requireLearnUser("/teach");
  await submitTeacherApplication({
    viewer,
    fullName: String(formData.get("fullName") || ""),
    phone: String(formData.get("phone") || ""),
    country: String(formData.get("country") || ""),
    expertiseArea: String(formData.get("expertiseArea") || ""),
    teachingTopics: asCsvList(formData, "teachingTopics"),
    credentials: String(formData.get("credentials") || ""),
    portfolioLinks: asCsvList(formData, "portfolioLinks"),
    courseProposal: String(formData.get("courseProposal") || ""),
    supportingFiles: asFiles(formData, "supportingFiles"),
    agreementAccepted: asBoolean(formData, "agreementAccepted"),
  });
  revalidatePath("/teach");
  revalidatePath("/owner/instructors");
  redirect("/teach?submitted=1");
}

export async function reviewTeacherApplicationAction(formData: FormData) {
  const actor = await requireLearnRoles(
    ["academy_owner", "academy_admin"],
    "/owner/instructors"
  );
  await reviewTeacherApplication({
    actor,
    applicationId: String(formData.get("applicationId") || ""),
    status: String(formData.get("decision") || "under_review") as never,
    reviewNotes: String(formData.get("reviewNotes") || ""),
    adminNotes: String(formData.get("adminNotes") || ""),
    payoutModel: String(formData.get("payoutModel") || "pending") as never,
    revenueSharePercent:
      formData.get("revenueSharePercent") == null || String(formData.get("revenueSharePercent")).trim() === ""
        ? null
        : Number(formData.get("revenueSharePercent")),
  });
  revalidatePath("/teach");
  revalidatePath("/owner");
  revalidatePath("/owner/instructors");
  redirect(`/owner/instructors?updated=${encodeURIComponent(String(formData.get("decision") || ""))}`);
}

export async function confirmEnrollmentPaymentAction(formData: FormData) {
  const actor = await requireLearnRoles(
    ["academy_owner", "academy_admin", "finance", "internal_manager"],
    "/owner/learners"
  );
  const paymentId = String(formData.get("paymentId") || "");
  if (!paymentId) redirect("/owner/learners");
  await confirmEnrollmentPayment({
    paymentId,
    sponsor: asBoolean(formData, "sponsor"),
    actor,
  });
  revalidatePath("/owner");
  revalidatePath("/owner/learners");
  revalidatePath("/learner/payments");
  redirect("/owner/learners");
}

export async function saveCourseDefinitionAction(formData: FormData) {
  const actor = await requireLearnRoles(
    ["academy_owner", "academy_admin", "content_manager", "instructor"],
    "/owner/courses"
  );
  await saveCourseDefinition({
    actor,
    id: String(formData.get("id") || ""),
    slug: String(formData.get("slug") || ""),
    title: String(formData.get("title") || ""),
    subtitle: String(formData.get("subtitle") || ""),
    summary: String(formData.get("summary") || ""),
    description: String(formData.get("description") || ""),
    categoryId: String(formData.get("categoryId") || ""),
    instructorId: String(formData.get("instructorId") || ""),
    visibility: String(formData.get("visibility") || "public") as never,
    accessModel: String(formData.get("accessModel") || "free") as never,
    difficulty: String(formData.get("difficulty") || "beginner") as never,
    price: Number(formData.get("price") || 0),
    currency: String(formData.get("currency") || "NGN"),
    durationText: String(formData.get("durationText") || ""),
    estimatedMinutes: Number(formData.get("estimatedMinutes") || 60),
    status: String(formData.get("status") || "published") as never,
    featured: asBoolean(formData, "featured"),
    certification: asBoolean(formData, "certification"),
    tags: asCsvList(formData, "tags"),
    prerequisites: asCsvList(formData, "prerequisites"),
    outcomes: asCsvList(formData, "outcomes"),
  });
  revalidatePath("/owner/courses");
  revalidatePath("/courses");
  redirect("/owner/courses");
}

export async function addModuleLessonDefinitionAction(formData: FormData) {
  const actor = await requireLearnRoles(
    ["academy_owner", "academy_admin", "content_manager", "instructor"],
    "/content"
  );
  await addModuleLessonDefinition({
    actor,
    courseId: String(formData.get("courseId") || ""),
    moduleTitle: String(formData.get("moduleTitle") || ""),
    moduleSummary: String(formData.get("moduleSummary") || ""),
    lessonTitle: String(formData.get("lessonTitle") || ""),
    lessonSummary: String(formData.get("lessonSummary") || ""),
    lessonBody: String(formData.get("lessonBody") || ""),
    lessonType: String(formData.get("lessonType") || "reading") as never,
    durationMinutes: Number(formData.get("durationMinutes") || 20),
    preview: asBoolean(formData, "preview"),
  });
  revalidatePath("/content");
  revalidatePath("/owner/courses");
  redirect("/content");
}

export async function savePathDefinitionAction(formData: FormData) {
  const actor = await requireLearnRoles(
    ["academy_owner", "academy_admin", "content_manager", "internal_manager"],
    "/owner/paths"
  );
  await savePathDefinition({
    actor,
    id: String(formData.get("id") || ""),
    slug: String(formData.get("slug") || ""),
    title: String(formData.get("title") || ""),
    summary: String(formData.get("summary") || ""),
    description: String(formData.get("description") || ""),
    audience: String(formData.get("audience") || ""),
    visibility: String(formData.get("visibility") || "public") as never,
    accessModel: String(formData.get("accessModel") || "free") as never,
    featured: asBoolean(formData, "featured"),
    status: String(formData.get("status") || "published") as never,
    courseIds: asList(formData, "courseIds").length > 0 ? asList(formData, "courseIds") : asCsvList(formData, "courseIds"),
  });
  revalidatePath("/owner/paths");
  revalidatePath("/paths");
  redirect("/owner/paths");
}

export async function assignTrainingAction(formData: FormData) {
  const actor = await requireLearnRoles(
    ["academy_owner", "academy_admin", "internal_manager", "support"],
    "/owner/assignments"
  );
  await assignTraining({
    actor,
    courseId: String(formData.get("courseId") || "") || null,
    pathId: String(formData.get("pathId") || "") || null,
    email: String(formData.get("email") || ""),
    assigneeRole: String(formData.get("assigneeRole") || ""),
    sponsorName: String(formData.get("sponsorName") || ""),
    note: String(formData.get("note") || ""),
    dueAt: String(formData.get("dueAt") || ""),
  });
  revalidatePath("/owner/assignments");
  revalidatePath("/owner/learners");
  redirect("/owner/assignments");
}

export async function publishAcademyAnnouncementAction(formData: FormData) {
  const actor = await requireLearnRoles(
    ["academy_owner", "academy_admin", "support"],
    "/owner/settings"
  );
  await publishAcademyAnnouncement({
    actor,
    title: String(formData.get("title") || ""),
    body: String(formData.get("body") || ""),
    audience: String(formData.get("audience") || "all_active_learners") as never,
  });
  revalidatePath("/owner/settings");
  revalidatePath("/learner/notifications");
  redirect("/owner/settings");
}
