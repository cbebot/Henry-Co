export type LearnRole =
  | "learner"
  | "academy_owner"
  | "academy_admin"
  | "instructor"
  | "content_manager"
  | "support"
  | "finance"
  | "internal_manager";

export type LearnStaffRole = Extract<
  LearnRole,
  "academy_owner" | "academy_admin" | "instructor" | "content_manager" | "support" | "finance" | "internal_manager"
>;

export type LearnVisibility = "public" | "internal" | "private";
export type LearnAccessModel = "free" | "paid" | "internal" | "sponsored";
export type LearnDifficulty = "beginner" | "intermediate" | "advanced";
export type LearnCourseStatus = "draft" | "published" | "archived";
export type LearnEnrollmentStatus = "active" | "awaiting_payment" | "completed" | "paused" | "cancelled";
export type LearnPaymentStatus = "not_required" | "pending" | "paid" | "sponsored" | "refunded";
export type LearnProgressStatus = "locked" | "in_progress" | "completed";
export type LearnAssignmentStatus = "assigned" | "in_progress" | "completed" | "overdue" | "cancelled";
export type LearnQuestionType = "single_choice" | "multiple_choice" | "short_text";
export type LearnNotificationChannel = "in_app" | "email" | "whatsapp" | "system";
export type LearnNotificationStatus = "queued" | "sent" | "failed" | "skipped";
export type LearnTeacherApplicationStatus =
  | "submitted"
  | "under_review"
  | "changes_requested"
  | "approved"
  | "rejected";
export type LearnTeacherPayoutModel = "pending" | "revenue_share" | "fixed_fee" | "stipend";
export type LearnEventKey =
  | "academy_welcome"
  | "enrollment_confirmed"
  | "payment_confirmed"
  | "progress_reminder"
  | "course_nudge"
  | "certificate_earned"
  | "internal_assignment"
  | "academy_announcement"
  | "teacher_application_submitted"
  | "teacher_application_changes_requested"
  | "teacher_application_approved"
  | "teacher_application_rejected"
  | "owner_alert";

export type LearnViewer = {
  user: null | {
    id: string;
    email: string | null;
    fullName: string | null;
    avatarUrl: string | null;
  };
  normalizedEmail: string | null;
  roles: LearnRole[];
  memberships: Array<{
    id: string;
    role: LearnRole;
    scopeType: string;
    scopeId: string | null;
  }>;
};

export type LearnCategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
  heroCopy: string;
  accent: string;
  icon: string;
  featured: boolean;
  courseCount: number;
  audienceTags: string[];
};

export type LearnInstructor = {
  id: string;
  slug: string;
  fullName: string;
  title: string;
  bio: string;
  expertise: string[];
  accent: string;
  avatarUrl: string | null;
  spotlightQuote: string;
  rating: number;
};

export type LearnPlan = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingType: "one_time" | "membership" | "internal";
  accessScope: string;
  perks: string[];
  public: boolean;
};

export type LearnCourse = {
  id: string;
  slug: string;
  categoryId: string;
  title: string;
  subtitle: string;
  summary: string;
  description: string;
  heroImageUrl: string | null;
  previewVideoUrl: string | null;
  durationText: string;
  estimatedMinutes: number;
  difficulty: LearnDifficulty;
  prerequisites: string[];
  outcomes: string[];
  tags: string[];
  visibility: LearnVisibility;
  accessModel: LearnAccessModel;
  planId: string | null;
  price: number | null;
  currency: string;
  featured: boolean;
  certification: boolean;
  passingScore: number;
  completionRule: string;
  status: LearnCourseStatus;
  primaryInstructorId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LearnModule = {
  id: string;
  courseId: string;
  title: string;
  summary: string;
  sortOrder: number;
  unlockRule: string;
  estimatedMinutes: number;
};

export type LearnLesson = {
  id: string;
  courseId: string;
  moduleId: string;
  slug: string;
  title: string;
  summary: string;
  bodyMarkdown: string;
  videoUrl: string | null;
  durationMinutes: number;
  lessonType: "video" | "reading" | "resource" | "workshop" | "quiz";
  preview: boolean;
  sortOrder: number;
};

export type LearnLessonResource = {
  id: string;
  lessonId: string;
  label: string;
  resourceType: "worksheet" | "guide" | "template" | "checklist" | "link";
  url: string;
};

export type LearnQuiz = {
  id: string;
  courseId: string;
  lessonId: string | null;
  title: string;
  description: string;
  passScore: number;
  maxAttempts: number;
};

export type LearnQuizQuestion = {
  id: string;
  quizId: string;
  prompt: string;
  questionType: LearnQuestionType;
  options: string[];
  correctAnswer: string[];
  explanation: string;
  sortOrder: number;
};

export type LearnPath = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  heroImageUrl: string | null;
  audience: string;
  visibility: LearnVisibility;
  accessModel: LearnAccessModel;
  planId: string | null;
  featured: boolean;
  status: LearnCourseStatus;
};

export type LearnPathItem = {
  id: string;
  pathId: string;
  itemType: "course" | "checkpoint";
  courseId: string | null;
  label: string;
  description: string;
  sortOrder: number;
  required: boolean;
};

export type LearnEnrollment = {
  id: string;
  courseId: string;
  userId: string | null;
  normalizedEmail: string | null;
  source: "self" | "assignment" | "admin" | "company";
  status: LearnEnrollmentStatus;
  paymentStatus: LearnPaymentStatus;
  sponsorName: string | null;
  enrolledAt: string;
  startedAt: string | null;
  completedAt: string | null;
  percentComplete: number;
  lastLessonId: string | null;
  lastActivityAt: string | null;
};

export type LearnProgressRecord = {
  id: string;
  enrollmentId: string;
  courseId: string;
  moduleId: string | null;
  lessonId: string;
  status: LearnProgressStatus;
  secondsWatched: number;
  score: number | null;
  completedAt: string | null;
};

export type LearnQuizAttempt = {
  id: string;
  quizId: string;
  enrollmentId: string;
  userId: string | null;
  normalizedEmail: string | null;
  score: number;
  passed: boolean;
  submittedAt: string;
  answers: Record<string, string[]>;
};

export type LearnCertificate = {
  id: string;
  enrollmentId: string;
  courseId: string;
  userId: string | null;
  normalizedEmail: string | null;
  certificateNo: string;
  verificationCode: string;
  issuedAt: string;
  score: number | null;
  status: "issued" | "revoked";
};

export type LearnReview = {
  id: string;
  courseId: string;
  userId: string | null;
  normalizedEmail: string | null;
  rating: number;
  title: string;
  body: string;
  status: "pending" | "published" | "hidden";
  createdAt: string;
};

export type LearnNotification = {
  id: string;
  userId: string | null;
  normalizedEmail: string | null;
  channel: LearnNotificationChannel;
  templateKey: LearnEventKey;
  recipient: string;
  title: string;
  body: string;
  status: LearnNotificationStatus;
  reason: string | null;
  entityType: string | null;
  entityId: string | null;
  readAt: string | null;
  createdAt: string;
};

export type LearnAssignment = {
  id: string;
  courseId: string | null;
  pathId: string | null;
  userId: string | null;
  normalizedEmail: string | null;
  assigneeRole: string | null;
  assignedByUserId: string | null;
  sponsorName: string | null;
  note: string;
  required: boolean;
  dueAt: string | null;
  assignedAt: string;
  status: LearnAssignmentStatus;
};

export type LearnPaymentRecord = {
  id: string;
  enrollmentId: string;
  courseId: string;
  userId: string | null;
  normalizedEmail: string | null;
  amount: number;
  currency: string;
  status: LearnPaymentStatus;
  method: "manual" | "transfer" | "sponsored";
  reference: string;
  createdAt: string;
  confirmedAt: string | null;
};

export type LearnSavedCourse = {
  id: string;
  courseId: string;
  userId: string | null;
  normalizedEmail: string | null;
  createdAt: string;
};

export type LearnTeacherApplicationFile = {
  name: string;
  url: string;
  publicId: string;
  mimeType: string | null;
  size: number | null;
};

export type LearnTeacherApplication = {
  id: string;
  userId: string | null;
  normalizedEmail: string | null;
  fullName: string;
  phone: string | null;
  country: string | null;
  expertiseArea: string;
  teachingTopics: string[];
  credentials: string;
  portfolioLinks: string[];
  courseProposal: string;
  supportingFiles: LearnTeacherApplicationFile[];
  termsAcceptedAt: string;
  status: LearnTeacherApplicationStatus;
  reviewNotes: string | null;
  adminNotes: string | null;
  payoutModel: LearnTeacherPayoutModel;
  revenueSharePercent: number | null;
  reviewedAt: string | null;
  reviewedByUserId: string | null;
  instructorMembershipId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LearnSnapshot = {
  categories: LearnCategory[];
  instructors: LearnInstructor[];
  plans: LearnPlan[];
  courses: LearnCourse[];
  paths: LearnPath[];
  pathItems: LearnPathItem[];
  modules: LearnModule[];
  lessons: LearnLesson[];
  resources: LearnLessonResource[];
  quizzes: LearnQuiz[];
  questions: LearnQuizQuestion[];
  enrollments: LearnEnrollment[];
  progress: LearnProgressRecord[];
  attempts: LearnQuizAttempt[];
  certificates: LearnCertificate[];
  reviews: LearnReview[];
  notifications: LearnNotification[];
  assignments: LearnAssignment[];
  payments: LearnPaymentRecord[];
  savedCourses: LearnSavedCourse[];
  teacherApplications: LearnTeacherApplication[];
};
