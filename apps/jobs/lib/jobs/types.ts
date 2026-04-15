export type JobsRole =
  | "candidate"
  | "employer"
  | "recruiter"
  | "admin"
  | "owner"
  | "moderator";

export type StageTone = "neutral" | "good" | "warn" | "danger";

export type JobsViewer = {
  user: {
    id: string;
    email: string | null;
    fullName: string | null;
    phone: string | null;
    avatarUrl: string | null;
  } | null;
  normalizedEmail: string | null;
  internalRole: string | null;
  roles: JobsRole[];
  employerMemberships: EmployerMembership[];
  candidateProfile: CandidateProfile | null;
};

export type EmployerMembership = {
  activityId: string;
  employerSlug: string;
  employerName: string;
  membershipRole: "owner" | "admin" | "recruiter";
  status: string;
};

export type CandidateProfile = {
  userId: string;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  headline: string;
  summary: string;
  location: string;
  timezone: string | null;
  workModes: string[];
  roleTypes: string[];
  preferredFunctions: string[];
  salaryExpectation: string | null;
  availability: string | null;
  portfolioLinks: string[];
  workHistory: Array<Record<string, unknown>>;
  education: Array<Record<string, unknown>>;
  certifications: Array<Record<string, unknown>>;
  skills: string[];
  completionScore: number;
  trustScore: number;
  verificationStatus: "unverified" | "pending" | "verified" | "rejected";
  readinessLabel: string;
  updatedAt: string | null;
};

export type CandidateDocument = {
  id: string;
  name: string;
  kind: string;
  fileUrl: string;
  mimeType: string | null;
  fileSize: number | null;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type EmployerProfile = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  website: string | null;
  logoUrl: string | null;
  accent: string;
  industry: string;
  locations: string[];
  headcount: string | null;
  remotePolicy: string | null;
  benefitsHeadline: string;
  culturePoints: string[];
  verificationStatus: "pending" | "verified" | "watch" | "rejected";
  trustScore: number;
  responseSlaHours: number;
  employerType: "internal" | "external";
  openRoleCount: number;
  verificationNotes: string[];
  updatedAt: string | null;
};

export type JobPost = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  employerSlug: string;
  employerName: string;
  employerType: "internal" | "external";
  categorySlug: string;
  categoryName: string;
  location: string;
  workMode: "remote" | "hybrid" | "onsite";
  employmentType: string;
  seniority: string;
  team: string;
  summary: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  skills: string[];
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  salaryLabel: string | null;
  featured: boolean;
  internal: boolean;
  isPublished: boolean;
  moderationStatus: "approved" | "pending_review" | "flagged" | "draft";
  employerVerification: string;
  employerTrustScore: number;
  employerResponseSlaHours: number | null;
  trustHighlights: string[];
  pipelineStages: string[];
  postedAt: string;
  closesAt: string | null;
  applicationCount: number;
};

export type SavedJob = {
  id: string;
  createdAt: string;
  job: JobPost;
};

export type JobAlert = {
  id: string;
  label: string;
  status: string;
  createdAt: string;
  criteria: Record<string, unknown>;
};

export type JobApplication = {
  rowId: string;
  applicationId: string;
  candidateUserId: string;
  candidateName: string;
  candidateEmail: string | null;
  candidatePhone: string | null;
  jobSlug: string;
  jobTitle: string;
  employerSlug: string;
  employerName: string;
  stage: string;
  status: string;
  createdAt: string;
  updatedAt: string | null;
  coverNote: string;
  availability: string | null;
  salaryExpectation: string | null;
  recruiterConfidence: number;
  candidateReadiness: number;
  internal: boolean;
  metadata: Record<string, unknown>;
};

export type JobsNotification = {
  id: string;
  title: string;
  body: string;
  priority: string | null;
  actionUrl: string | null;
  actionLabel: string | null;
  isRead: boolean;
  createdAt: string;
};

export type ProfileChecklistItem = {
  id: string;
  label: string;
  detail: string;
  complete: boolean;
  href: string;
};

export type CandidateNextAction = {
  id: string;
  label: string;
  body: string;
  href: string;
  tone: StageTone;
};

export type JobRecommendation = {
  job: JobPost;
  score: number;
  reason: string;
};

export type RecruiterActivity = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  href: string | null;
  tone: StageTone;
  source: "notification" | "timeline" | "thread";
};

export type ApplicationStageStep = {
  key: string;
  label: string;
  status: "done" | "current" | "upcoming";
};

export type ApplicationJourney = {
  application: JobApplication;
  job: JobPost | null;
  thread: ConversationThread | null;
  timeline: TimelineEvent[];
  sharedMessages: ConversationMessage[];
  pipeline: ApplicationStageStep[];
  stageTone: StageTone;
  stageLabel: string;
  progressPercent: number;
  latestSharedUpdate: RecruiterActivity | null;
  recruiterActionLabel: string;
  recruiterActionBody: string;
  recruiterActionAt: string | null;
  nextStepLabel: string;
  nextStepBody: string;
};

export type TimelineEvent = {
  id: string;
  action: string;
  actorRole: string | null;
  reason: string | null;
  createdAt: string;
  newValues: Record<string, unknown>;
};

export type ConversationThread = {
  id: string;
  subject: string;
  status: string;
  priority: string | null;
  referenceType: string | null;
  referenceId: string | null;
  updatedAt: string;
};

export type ConversationMessage = {
  id: string;
  senderId: string | null;
  senderType: string | null;
  body: string;
  attachments: Array<Record<string, unknown>>;
  createdAt: string;
};

export type ModerationCase = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  reason: string | null;
  actorRole: string | null;
  createdAt: string;
  details: Record<string, unknown>;
};

export type Differentiator = {
  id: string;
  title: string;
  summary: string;
  pros: string[];
  cons: string[];
  difficulty: "low" | "medium" | "high";
  innovationScore: number;
};

export type JobsHomeData = {
  featuredJobs: JobPost[];
  latestJobs: JobPost[];
  internalJobs: JobPost[];
  employers: EmployerProfile[];
  categories: Array<{ slug: string; name: string; count: number }>;
  differentiators: Differentiator[];
  stats: Array<{ label: string; value: string; detail: string }>;
};

export type CandidateDashboardData = {
  profile: CandidateProfile | null;
  documents: CandidateDocument[];
  applications: JobApplication[];
  savedJobs: SavedJob[];
  alerts: JobAlert[];
  notifications: JobsNotification[];
  threads: ConversationThread[];
  pipelineSummary: Record<string, number>;
  applicationJourneys: ApplicationJourney[];
  nextActions: CandidateNextAction[];
  profileChecklist: ProfileChecklistItem[];
  recommendedJobs: JobRecommendation[];
  recruiterFeed: RecruiterActivity[];
};
