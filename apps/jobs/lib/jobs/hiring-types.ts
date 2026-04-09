export type HiringPipeline = {
  id: string;
  employerId: string;
  jobId: string;
  jobTitle: string;
  jobSlug: string;
  status: "active" | "paused" | "closed" | "draft";
  stages: string[];
  applicantCount: number;
  createdAt: string;
  updatedAt: string | null;
};

export type Application = {
  id: string;
  pipelineId: string;
  candidateUserId: string;
  candidateName: string;
  candidateEmail: string | null;
  candidateAvatarUrl: string | null;
  jobTitle: string;
  stage: string;
  status: "active" | "withdrawn" | "rejected" | "hired";
  coverNote: string;
  createdAt: string;
  updatedAt: string | null;
};

export type Conversation = {
  id: string;
  applicationId: string;
  subject: string;
  status: "open" | "closed" | "archived";
  unreadCount: number;
  lastMessageAt: string | null;
  createdAt: string;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: "employer" | "candidate" | "system";
  senderName: string | null;
  body: string;
  isRead: boolean;
  readAt: string | null;
  isFlagged: boolean;
  flagReason: string | null;
  createdAt: string;
};

export type Interview = {
  id: string;
  applicationId: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  timezone: string;
  interviewType: "video" | "phone" | "in-person";
  location: string | null;
  meetingUrl: string | null;
  notes: string | null;
  status: "scheduled" | "completed" | "cancelled" | "rescheduled";
  createdAt: string;
  updatedAt: string | null;
};

export type InterviewInput = {
  applicationId: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  timezone: string;
  interviewType: "video" | "phone" | "in-person";
  location?: string;
  meetingUrl?: string;
  notes?: string;
};

export type ModerationFlag = {
  id: string;
  messageId: string;
  reason: string;
  status: "pending" | "reviewed" | "dismissed";
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
};
