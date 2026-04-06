import type {
  LearnAssignment,
  LearnCategory,
  LearnCertificate,
  LearnCourse,
  LearnEnrollment,
  LearnInstructor,
  LearnLesson,
  LearnLessonResource,
  LearnNotification,
  LearnPath,
  LearnPathItem,
  LearnPaymentRecord,
  LearnPlan,
  LearnProgressRecord,
  LearnQuiz,
  LearnQuizAttempt,
  LearnQuizQuestion,
  LearnReview,
  LearnSavedCourse,
  LearnSnapshot,
  LearnTeacherApplication,
  LearnViewer,
} from "@/lib/learn/types";
import { getLearnSetting, readLearnCollection } from "@/lib/learn/store";
import { LEARN_BOOTSTRAP_VERSION, seedLearnBaseline } from "@/lib/learn/seed";
import { hasSupabaseServiceRole } from "@/lib/supabase";

let bootstrapPromise: Promise<void> | null = null;

function cleanText(value?: unknown) {
  return String(value ?? "").trim();
}

function asNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function arrayOfText(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => cleanText(item)).filter(Boolean);
}

function asBoolean(value: unknown) {
  return value === true || value === "true" || value === 1;
}

function mapCategory(row: Record<string, unknown>): LearnCategory {
  return {
    id: cleanText(row.id),
    slug: cleanText(row.slug),
    name: cleanText(row.name),
    description: cleanText(row.description),
    heroCopy: cleanText(row.hero_copy),
    accent: cleanText(row.accent) || "#3C8C7A",
    icon: cleanText(row.icon) || "BookOpen",
    featured: asBoolean(row.is_featured),
    courseCount: asNumber(row.course_count),
    audienceTags: arrayOfText(row.audience_tags),
  };
}

function mapInstructor(row: Record<string, unknown>): LearnInstructor {
  return {
    id: cleanText(row.id),
    slug: cleanText(row.slug),
    fullName: cleanText(row.full_name),
    title: cleanText(row.title),
    bio: cleanText(row.bio),
    expertise: arrayOfText(row.expertise),
    accent: cleanText(row.accent) || "#3C8C7A",
    avatarUrl: cleanText(row.avatar_url) || null,
    spotlightQuote: cleanText(row.spotlight_quote),
    rating: asNumber(row.rating, 4.8),
  };
}

function mapPlan(row: Record<string, unknown>): LearnPlan {
  return {
    id: cleanText(row.id),
    slug: cleanText(row.slug),
    name: cleanText(row.name),
    description: cleanText(row.description),
    price: asNumber(row.price),
    currency: cleanText(row.currency) || "NGN",
    billingType: cleanText(row.billing_type) as LearnPlan["billingType"],
    accessScope: cleanText(row.access_scope),
    perks: arrayOfText(row.perks),
    public: asBoolean(row.is_public),
  };
}

function mapCourse(row: Record<string, unknown>): LearnCourse {
  return {
    id: cleanText(row.id),
    slug: cleanText(row.slug),
    categoryId: cleanText(row.category_id),
    title: cleanText(row.title),
    subtitle: cleanText(row.subtitle),
    summary: cleanText(row.summary),
    description: cleanText(row.description),
    heroImageUrl: cleanText(row.hero_image_url) || null,
    previewVideoUrl: cleanText(row.preview_video_url) || null,
    durationText: cleanText(row.duration_text),
    estimatedMinutes: asNumber(row.estimated_minutes),
    difficulty: cleanText(row.difficulty) as LearnCourse["difficulty"],
    prerequisites: arrayOfText(row.prerequisites),
    outcomes: arrayOfText(row.outcomes),
    tags: arrayOfText(row.tags),
    visibility: cleanText(row.visibility) as LearnCourse["visibility"],
    accessModel: cleanText(row.access_model) as LearnCourse["accessModel"],
    planId: cleanText(row.plan_id) || null,
    price: row.price == null ? null : asNumber(row.price),
    currency: cleanText(row.currency) || "NGN",
    featured: asBoolean(row.featured),
    certification: asBoolean(row.is_certification),
    passingScore: asNumber(row.passing_score, 70),
    completionRule: cleanText(row.completion_rule),
    status: cleanText(row.status) as LearnCourse["status"],
    primaryInstructorId: cleanText(row.primary_instructor_id) || null,
    createdAt: cleanText(row.created_at),
    updatedAt: cleanText(row.updated_at),
  };
}

function mapPath(row: Record<string, unknown>): LearnPath {
  return {
    id: cleanText(row.id),
    slug: cleanText(row.slug),
    title: cleanText(row.title),
    summary: cleanText(row.summary),
    description: cleanText(row.description),
    heroImageUrl: cleanText(row.hero_image_url) || null,
    audience: cleanText(row.audience),
    visibility: cleanText(row.visibility) as LearnPath["visibility"],
    accessModel: cleanText(row.access_model) as LearnPath["accessModel"],
    planId: cleanText(row.plan_id) || null,
    featured: asBoolean(row.featured),
    status: cleanText(row.status) as LearnPath["status"],
  };
}

function mapPathItem(row: Record<string, unknown>): LearnPathItem {
  return {
    id: cleanText(row.id),
    pathId: cleanText(row.path_id),
    itemType: cleanText(row.item_type) as LearnPathItem["itemType"],
    courseId: cleanText(row.course_id) || null,
    label: cleanText(row.label),
    description: cleanText(row.description),
    sortOrder: asNumber(row.sort_order, 1),
    required: asBoolean(row.required),
  };
}

function mapModule(row: Record<string, unknown>) {
  return {
    id: cleanText(row.id),
    courseId: cleanText(row.course_id),
    title: cleanText(row.title),
    summary: cleanText(row.summary),
    sortOrder: asNumber(row.sort_order, 1),
    unlockRule: cleanText(row.unlock_rule) || "sequential",
    estimatedMinutes: asNumber(row.estimated_minutes),
  };
}

function mapLesson(row: Record<string, unknown>): LearnLesson {
  return {
    id: cleanText(row.id),
    courseId: cleanText(row.course_id),
    moduleId: cleanText(row.module_id),
    slug: cleanText(row.slug),
    title: cleanText(row.title),
    summary: cleanText(row.summary),
    bodyMarkdown: cleanText(row.body_markdown),
    videoUrl: cleanText(row.video_url) || null,
    durationMinutes: asNumber(row.duration_minutes),
    lessonType: cleanText(row.lesson_type) as LearnLesson["lessonType"],
    preview: asBoolean(row.is_preview),
    sortOrder: asNumber(row.sort_order, 1),
  };
}

function mapResource(row: Record<string, unknown>): LearnLessonResource {
  return {
    id: cleanText(row.id),
    lessonId: cleanText(row.lesson_id),
    label: cleanText(row.label),
    resourceType: cleanText(row.resource_type) as LearnLessonResource["resourceType"],
    url: cleanText(row.url),
  };
}

function mapQuiz(row: Record<string, unknown>): LearnQuiz {
  return {
    id: cleanText(row.id),
    courseId: cleanText(row.course_id),
    lessonId: cleanText(row.lesson_id) || null,
    title: cleanText(row.title),
    description: cleanText(row.description),
    passScore: asNumber(row.pass_score, 70),
    maxAttempts: asNumber(row.max_attempts, 3),
  };
}

function mapQuestion(row: Record<string, unknown>): LearnQuizQuestion {
  return {
    id: cleanText(row.id),
    quizId: cleanText(row.quiz_id),
    prompt: cleanText(row.prompt),
    questionType: cleanText(row.question_type) as LearnQuizQuestion["questionType"],
    options: arrayOfText(row.options),
    correctAnswer: arrayOfText(row.correct_answer),
    explanation: cleanText(row.explanation),
    sortOrder: asNumber(row.sort_order, 1),
  };
}

function mapEnrollment(row: Record<string, unknown>): LearnEnrollment {
  return {
    id: cleanText(row.id),
    courseId: cleanText(row.course_id),
    userId: cleanText(row.user_id) || null,
    normalizedEmail: cleanText(row.normalized_email) || null,
    source: cleanText(row.source) as LearnEnrollment["source"],
    status: cleanText(row.status) as LearnEnrollment["status"],
    paymentStatus: cleanText(row.payment_status) as LearnEnrollment["paymentStatus"],
    sponsorName: cleanText(row.sponsor_name) || null,
    enrolledAt: cleanText(row.enrolled_at),
    startedAt: cleanText(row.started_at) || null,
    completedAt: cleanText(row.completed_at) || null,
    percentComplete: asNumber(row.percent_complete),
    lastLessonId: cleanText(row.last_lesson_id) || null,
    lastActivityAt: cleanText(row.last_activity_at) || null,
  };
}

function mapProgress(row: Record<string, unknown>): LearnProgressRecord {
  return {
    id: cleanText(row.id),
    enrollmentId: cleanText(row.enrollment_id),
    courseId: cleanText(row.course_id),
    moduleId: cleanText(row.module_id) || null,
    lessonId: cleanText(row.lesson_id),
    status: cleanText(row.status) as LearnProgressRecord["status"],
    secondsWatched: asNumber(row.seconds_watched),
    score: row.score == null ? null : asNumber(row.score),
    completedAt: cleanText(row.completed_at) || null,
  };
}

function mapAttempt(row: Record<string, unknown>): LearnQuizAttempt {
  return {
    id: cleanText(row.id),
    quizId: cleanText(row.quiz_id),
    enrollmentId: cleanText(row.enrollment_id),
    userId: cleanText(row.user_id) || null,
    normalizedEmail: cleanText(row.normalized_email) || null,
    score: asNumber(row.score),
    passed: asBoolean(row.passed),
    submittedAt: cleanText(row.submitted_at),
    answers:
      row.answers && typeof row.answers === "object" && !Array.isArray(row.answers)
        ? (row.answers as Record<string, string[]>)
        : {},
  };
}

function mapCertificate(row: Record<string, unknown>): LearnCertificate {
  return {
    id: cleanText(row.id),
    enrollmentId: cleanText(row.enrollment_id),
    courseId: cleanText(row.course_id),
    userId: cleanText(row.user_id) || null,
    normalizedEmail: cleanText(row.normalized_email) || null,
    certificateNo: cleanText(row.certificate_no),
    verificationCode: cleanText(row.verification_code),
    issuedAt: cleanText(row.issued_at),
    score: row.score == null ? null : asNumber(row.score),
    status: cleanText(row.status) as LearnCertificate["status"],
  };
}

function mapReview(row: Record<string, unknown>): LearnReview {
  return {
    id: cleanText(row.id),
    courseId: cleanText(row.course_id),
    userId: cleanText(row.user_id) || null,
    normalizedEmail: cleanText(row.normalized_email) || null,
    rating: asNumber(row.rating, 5),
    title: cleanText(row.title),
    body: cleanText(row.body),
    status: cleanText(row.status) as LearnReview["status"],
    createdAt: cleanText(row.created_at),
  };
}

function mapNotification(row: Record<string, unknown>): LearnNotification {
  return {
    id: cleanText(row.id),
    userId: cleanText(row.user_id) || null,
    normalizedEmail: cleanText(row.normalized_email) || null,
    channel: cleanText(row.channel) as LearnNotification["channel"],
    templateKey: cleanText(row.template_key) as LearnNotification["templateKey"],
    recipient: cleanText(row.recipient),
    title: cleanText(row.title),
    body: cleanText(row.body),
    status: cleanText(row.status) as LearnNotification["status"],
    reason: cleanText(row.reason) || null,
    entityType: cleanText(row.entity_type) || null,
    entityId: cleanText(row.entity_id) || null,
    readAt: cleanText(row.read_at) || null,
    createdAt: cleanText(row.created_at),
  };
}

function mapAssignment(row: Record<string, unknown>): LearnAssignment {
  return {
    id: cleanText(row.id),
    courseId: cleanText(row.course_id) || null,
    pathId: cleanText(row.path_id) || null,
    userId: cleanText(row.user_id) || null,
    normalizedEmail: cleanText(row.normalized_email) || null,
    assigneeRole: cleanText(row.assignee_role) || null,
    assignedByUserId: cleanText(row.assigned_by_user_id) || null,
    sponsorName: cleanText(row.sponsor_name) || null,
    note: cleanText(row.note),
    required: asBoolean(row.required),
    dueAt: cleanText(row.due_at) || null,
    assignedAt: cleanText(row.assigned_at),
    status: cleanText(row.status) as LearnAssignment["status"],
  };
}

function mapPayment(row: Record<string, unknown>): LearnPaymentRecord {
  return {
    id: cleanText(row.id),
    enrollmentId: cleanText(row.enrollment_id),
    courseId: cleanText(row.course_id),
    userId: cleanText(row.user_id) || null,
    normalizedEmail: cleanText(row.normalized_email) || null,
    amount: asNumber(row.amount),
    currency: cleanText(row.currency) || "NGN",
    status: cleanText(row.status) as LearnPaymentRecord["status"],
    method: cleanText(row.method) as LearnPaymentRecord["method"],
    reference: cleanText(row.reference),
    createdAt: cleanText(row.created_at),
    confirmedAt: cleanText(row.confirmed_at) || null,
  };
}

function mapSavedCourse(row: Record<string, unknown>): LearnSavedCourse {
  return {
    id: cleanText(row.id),
    courseId: cleanText(row.course_id),
    userId: cleanText(row.user_id) || null,
    normalizedEmail: cleanText(row.normalized_email) || null,
    createdAt: cleanText(row.created_at),
  };
}

function mapTeacherApplication(row: Record<string, unknown>): LearnTeacherApplication {
  const files = Array.isArray(row.supporting_files)
    ? (row.supporting_files as Array<Record<string, unknown>>)
        .map((file) => ({
          name: cleanText(file.name),
          url: cleanText(file.url),
          publicId: cleanText(file.publicId || file.public_id),
          mimeType: cleanText(file.mimeType || file.mime_type) || null,
          size: file.size == null ? null : asNumber(file.size),
        }))
        .filter((file) => file.name && file.url)
    : [];

  return {
    id: cleanText(row.id),
    userId: cleanText(row.user_id) || null,
    normalizedEmail: cleanText(row.normalized_email) || null,
    fullName: cleanText(row.full_name),
    phone: cleanText(row.phone) || null,
    country: cleanText(row.country) || null,
    expertiseArea: cleanText(row.expertise_area),
    teachingTopics: arrayOfText(row.teaching_topics),
    credentials: cleanText(row.credentials),
    portfolioLinks: arrayOfText(row.portfolio_links),
    courseProposal: cleanText(row.course_proposal),
    supportingFiles: files,
    termsAcceptedAt: cleanText(row.terms_accepted_at),
    status: cleanText(row.status) as LearnTeacherApplication["status"],
    reviewNotes: cleanText(row.review_notes) || null,
    adminNotes: cleanText(row.admin_notes) || null,
    payoutModel: cleanText(row.payout_model) as LearnTeacherApplication["payoutModel"],
    revenueSharePercent:
      row.revenue_share_percent == null ? null : asNumber(row.revenue_share_percent),
    reviewedAt: cleanText(row.reviewed_at) || null,
    reviewedByUserId: cleanText(row.reviewed_by_user_id) || null,
    instructorMembershipId: cleanText(row.instructor_membership_id) || null,
    createdAt: cleanText(row.created_at),
    updatedAt: cleanText(row.updated_at),
  };
}

async function ensureLearnBootstrap() {
  const current = await getLearnSetting<{ version?: string }>("bootstrap_version");
  if (current?.version === LEARN_BOOTSTRAP_VERSION) {
    return;
  }

  // Auto-seed requires the service role. Without it (common misconfig on Vercel),
  // public pages must still render using empty/fallback reads — never 500 the homepage.
  if (!hasSupabaseServiceRole()) {
    return;
  }

  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      try {
        await seedLearnBaseline({ role: "academy_system" });
      } catch (err) {
        console.error("[henryco/learn] bootstrap failed:", err);
      }
    })();
  }

  await bootstrapPromise;
}

export async function getLearnSnapshot(): Promise<LearnSnapshot> {
  await ensureLearnBootstrap();

  const [categoryRows, instructorRows, planRows, courseRows, pathRows, pathItemRows, moduleRows, lessonRows, resourceRows, quizRows, questionRows, enrollmentRows, progressRows, attemptRows, certificateRows, reviewRows, notificationRows, assignmentRows, paymentRows, savedRows, teacherApplicationRows] =
    await Promise.all([
      readLearnCollection<Record<string, unknown>>("learn_course_categories", "sort_order"),
      readLearnCollection<Record<string, unknown>>("learn_instructors", "full_name"),
      readLearnCollection<Record<string, unknown>>("learn_plans", "name"),
      readLearnCollection<Record<string, unknown>>("learn_courses", "updated_at", false),
      readLearnCollection<Record<string, unknown>>("learn_learning_paths", "updated_at", false),
      readLearnCollection<Record<string, unknown>>("learn_path_items", "sort_order"),
      readLearnCollection<Record<string, unknown>>("learn_modules", "sort_order"),
      readLearnCollection<Record<string, unknown>>("learn_lessons", "sort_order"),
      readLearnCollection<Record<string, unknown>>("learn_lesson_resources", "created_at"),
      readLearnCollection<Record<string, unknown>>("learn_quizzes", "created_at"),
      readLearnCollection<Record<string, unknown>>("learn_quiz_questions", "sort_order"),
      readLearnCollection<Record<string, unknown>>("learn_enrollments", "enrolled_at", false),
      readLearnCollection<Record<string, unknown>>("learn_progress", "completed_at", false),
      readLearnCollection<Record<string, unknown>>("learn_quiz_attempts", "submitted_at", false),
      readLearnCollection<Record<string, unknown>>("learn_certificates", "issued_at", false),
      readLearnCollection<Record<string, unknown>>("learn_reviews", "created_at", false),
      readLearnCollection<Record<string, unknown>>("learn_notifications", "created_at", false),
      readLearnCollection<Record<string, unknown>>("learn_assignments", "assigned_at", false),
      readLearnCollection<Record<string, unknown>>("learn_payments", "created_at", false),
      readLearnCollection<Record<string, unknown>>("learn_saved_courses", "created_at", false),
      readLearnCollection<Record<string, unknown>>("learn_teacher_applications", "updated_at", false),
    ]);

  const courses = courseRows.map(mapCourse);
  const courseCountByCategory = new Map<string, number>();
  for (const course of courses) {
    courseCountByCategory.set(course.categoryId, (courseCountByCategory.get(course.categoryId) ?? 0) + 1);
  }

  return {
    categories: categoryRows.map(mapCategory).map((category) => ({
      ...category,
      courseCount: courseCountByCategory.get(category.id) ?? 0,
    })),
    instructors: instructorRows.map(mapInstructor),
    plans: planRows.map(mapPlan),
    courses,
    paths: pathRows.map(mapPath),
    pathItems: pathItemRows.map(mapPathItem),
    modules: moduleRows.map(mapModule),
    lessons: lessonRows.map(mapLesson),
    resources: resourceRows.map(mapResource),
    quizzes: quizRows.map(mapQuiz),
    questions: questionRows.map(mapQuestion),
    enrollments: enrollmentRows.map(mapEnrollment),
    progress: progressRows.map(mapProgress),
    attempts: attemptRows.map(mapAttempt),
    certificates: certificateRows.map(mapCertificate),
    reviews: reviewRows.map(mapReview),
    notifications: notificationRows.map(mapNotification),
    assignments: assignmentRows.map(mapAssignment),
    payments: paymentRows.map(mapPayment),
    savedCourses: savedRows.map(mapSavedCourse),
    teacherApplications: teacherApplicationRows.map(mapTeacherApplication),
  };
}

export function isCourseVisibleToPublic(course: LearnCourse) {
  return course.status === "published" && course.visibility === "public";
}

export function canViewerAccessCourse(
  course: LearnCourse,
  viewer: LearnViewer | null | undefined,
  snapshot: LearnSnapshot
) {
  if (isCourseVisibleToPublic(course)) {
    return true;
  }

  if (!viewer?.user) {
    return false;
  }

  const isPrivileged = viewer.roles.some((role) =>
    ["academy_owner", "academy_admin", "instructor", "content_manager", "internal_manager"].includes(role)
  );
  if (isPrivileged) {
    return true;
  }

  const matchesEnrollment = snapshot.enrollments.some(
    (enrollment) =>
      enrollment.courseId === course.id &&
      ["active", "completed"].includes(enrollment.status) &&
      (enrollment.userId === viewer.user?.id ||
        (viewer.normalizedEmail && enrollment.normalizedEmail === viewer.normalizedEmail))
  );

  if (matchesEnrollment) {
    return true;
  }

  return snapshot.assignments.some(
    (assignment) =>
      assignment.courseId === course.id &&
      (assignment.userId === viewer.user?.id ||
        (viewer.normalizedEmail && assignment.normalizedEmail === viewer.normalizedEmail))
  );
}

export async function getPublicAcademyData() {
  const snapshot = await getLearnSnapshot();
  return {
    ...snapshot,
    courses: snapshot.courses.filter(isCourseVisibleToPublic),
    paths: snapshot.paths.filter((path) => path.status === "published" && path.visibility === "public"),
    reviews: snapshot.reviews.filter((review) => review.status === "published"),
  };
}

export async function getCourseCatalog(filters?: {
  search?: string;
  category?: string;
  difficulty?: string;
}) {
  const snapshot = await getPublicAcademyData();
  const search = cleanText(filters?.search).toLowerCase();

  return snapshot.courses.filter((course) => {
    if (filters?.category && course.categoryId !== filters.category) return false;
    if (filters?.difficulty && course.difficulty !== filters.difficulty) return false;
    if (!search) return true;
    return [course.title, course.subtitle, course.summary, course.description, ...course.tags]
      .join(" ")
      .toLowerCase()
      .includes(search);
  });
}

export async function getCourseBySlug(slug: string, viewer?: LearnViewer | null) {
  const snapshot = await getLearnSnapshot();
  const course = snapshot.courses.find((item) => item.slug === slug) ?? null;
  if (!course) return null;
  if (!canViewerAccessCourse(course, viewer, snapshot)) return null;

  const category = snapshot.categories.find((item) => item.id === course.categoryId) ?? null;
  const instructor = snapshot.instructors.find((item) => item.id === course.primaryInstructorId) ?? null;
  const modules = snapshot.modules
    .filter((item) => item.courseId === course.id)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((module) => ({
      ...module,
      lessons: snapshot.lessons
        .filter((lesson) => lesson.moduleId === module.id)
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((lesson) => ({
          ...lesson,
          resources: snapshot.resources.filter((resource) => resource.lessonId === lesson.id),
        })),
    }));

  const quiz = snapshot.quizzes.find((item) => item.courseId === course.id) ?? null;
  const questions = quiz
    ? snapshot.questions
        .filter((item) => item.quizId === quiz.id)
        .sort((left, right) => left.sortOrder - right.sortOrder)
    : [];

  const reviews = snapshot.reviews.filter(
    (review) => review.courseId === course.id && review.status === "published"
  );
  const related = snapshot.courses
    .filter(
      (item) =>
        item.id !== course.id &&
        item.categoryId === course.categoryId &&
        canViewerAccessCourse(item, viewer, snapshot)
    )
    .slice(0, 3);
  const paths = snapshot.paths.filter((path) =>
    snapshot.pathItems.some((item) => item.pathId === path.id && item.courseId === course.id)
  );
  const enrollment = viewer?.user
    ? snapshot.enrollments.find(
        (item) =>
          item.courseId === course.id &&
          (item.userId === viewer.user?.id ||
            (viewer.normalizedEmail && item.normalizedEmail === viewer.normalizedEmail))
      ) ?? null
    : null;
  const saved = viewer?.user
    ? snapshot.savedCourses.some(
        (item) =>
          item.courseId === course.id &&
          (item.userId === viewer.user?.id ||
            (viewer.normalizedEmail && item.normalizedEmail === viewer.normalizedEmail))
      )
    : false;

  return {
    course,
    category,
    instructor,
    modules,
    quiz,
    questions,
    reviews,
    related,
    paths,
    enrollment,
    saved,
    averageRating:
      reviews.length > 0
        ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10
        : 0,
  };
}

export async function getCategoryBySlug(slug: string) {
  const snapshot = await getPublicAcademyData();
  const category = snapshot.categories.find((item) => item.slug === slug) ?? null;
  if (!category) return null;

  return {
    category,
    courses: snapshot.courses.filter((course) => course.categoryId === category.id),
  };
}

export async function getPathBySlug(slug: string, viewer?: LearnViewer | null) {
  const snapshot = await getLearnSnapshot();
  const path = snapshot.paths.find((item) => item.slug === slug) ?? null;
  if (!path) return null;
  if (path.visibility !== "public" && !viewer?.user) return null;

  const items = snapshot.pathItems
    .filter((item) => item.pathId === path.id)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((item) => ({
      ...item,
      course: item.courseId ? snapshot.courses.find((course) => course.id === item.courseId) ?? null : null,
    }))
    .filter((item) => !item.course || canViewerAccessCourse(item.course, viewer, snapshot));

  return { path, items };
}

export async function getInstructorBySlug(slug: string) {
  const snapshot = await getPublicAcademyData();
  const instructor = snapshot.instructors.find((item) => item.slug === slug) ?? null;
  if (!instructor) return null;
  return {
    instructor,
    courses: snapshot.courses.filter((course) => course.primaryInstructorId === instructor.id),
  };
}

export async function getCertificateByCode(code: string) {
  const snapshot = await getLearnSnapshot();
  const certificate = snapshot.certificates.find((item) => item.verificationCode === code) ?? null;
  if (!certificate) return null;

  return {
    certificate,
    course: snapshot.courses.find((item) => item.id === certificate.courseId) ?? null,
    enrollment: snapshot.enrollments.find((item) => item.id === certificate.enrollmentId) ?? null,
  };
}

function matchesViewer(
  item: { userId: string | null; normalizedEmail: string | null },
  viewer: LearnViewer
) {
  return (
    (!!viewer.user?.id && item.userId === viewer.user.id) ||
    (!!viewer.normalizedEmail && item.normalizedEmail === viewer.normalizedEmail)
  );
}

export async function getLearnerWorkspace(viewer: LearnViewer) {
  const snapshot = await getLearnSnapshot();
  const enrollments = snapshot.enrollments.filter((item) => matchesViewer(item, viewer));
  const enrollmentIds = new Set(enrollments.map((item) => item.id));
  const savedCourses = snapshot.savedCourses.filter((item) => matchesViewer(item, viewer));
  const certificates = snapshot.certificates.filter((item) => matchesViewer(item, viewer));
  const notifications = snapshot.notifications.filter((item) => matchesViewer(item, viewer));
  const assignments = snapshot.assignments.filter((item) => matchesViewer(item, viewer));
  const payments = snapshot.payments.filter((item) => matchesViewer(item, viewer));
  const progress = snapshot.progress.filter((item) => enrollmentIds.has(item.enrollmentId));
  const attempts = snapshot.attempts.filter((item) => enrollmentIds.has(item.enrollmentId));

  const courses = enrollments
    .map((enrollment) => ({
      enrollment,
      course: snapshot.courses.find((course) => course.id === enrollment.courseId) ?? null,
    }))
    .filter((item) => item.course);

  const saved = savedCourses
    .map((item) => snapshot.courses.find((course) => course.id === item.courseId) ?? null)
    .filter(Boolean) as LearnCourse[];

  const recommended = snapshot.courses
    .filter(
      (course) =>
        isCourseVisibleToPublic(course) &&
        !enrollments.some((enrollment) => enrollment.courseId === course.id) &&
        !savedCourses.some((savedItem) => savedItem.courseId === course.id)
    )
    .slice(0, 4);

  return {
    viewer,
    snapshot,
    enrollments,
    courses,
    savedCourses: saved,
    certificates,
    notifications,
    assignments,
    payments,
    progress,
    attempts,
    recommended,
    totals: {
      activeCourses: enrollments.filter((item) => item.status === "active").length,
      completedCourses: enrollments.filter((item) => item.status === "completed").length,
      certificates: certificates.length,
      pendingAssignments: assignments.filter((item) => item.status !== "completed").length,
    },
  };
}

export async function getTeacherApplicationForViewer(viewer: LearnViewer) {
  const snapshot = await getLearnSnapshot();
  return (
    snapshot.teacherApplications.find((application) => matchesViewer(application, viewer)) || null
  );
}

export async function getOwnerAnalytics() {
  const snapshot = await getLearnSnapshot();
  const totalRevenue = snapshot.payments
    .filter((payment) => payment.status === "paid" || payment.status === "sponsored")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const completedEnrollments = snapshot.enrollments.filter((item) => item.status === "completed");
  const completionRate = snapshot.enrollments.length
    ? Math.round((completedEnrollments.length / snapshot.enrollments.length) * 100)
    : 0;
  const averageRating = snapshot.reviews.length
    ? Math.round(
        (snapshot.reviews.reduce((sum, review) => sum + review.rating, 0) / snapshot.reviews.length) * 10
      ) / 10
    : 0;

  return {
    snapshot,
    metrics: {
      totalCourses: snapshot.courses.length,
      publicCourses: snapshot.courses.filter(isCourseVisibleToPublic).length,
      paths: snapshot.paths.length,
      activeLearners: new Set(
        snapshot.enrollments
          .filter((item) => item.status === "active" || item.status === "completed")
          .map((item) => item.userId || item.normalizedEmail)
      ).size,
      completionRate,
      certificatesIssued: snapshot.certificates.length,
      teacherApplications: snapshot.teacherApplications.length,
      approvedInstructors: snapshot.teacherApplications.filter((item) => item.status === "approved").length,
      overdueAssignments: snapshot.assignments.filter(
        (item) => item.status !== "completed" && item.dueAt && new Date(item.dueAt) < new Date()
      ).length,
      totalRevenue,
      averageRating,
    },
  };
}
