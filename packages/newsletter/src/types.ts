export const NEWSLETTER_DIVISIONS = [
  "hub",
  "account",
  "care",
  "jobs",
  "learn",
  "logistics",
  "marketplace",
  "property",
  "studio",
] as const;

export type NewsletterDivision = (typeof NEWSLETTER_DIVISIONS)[number];

export const NEWSLETTER_FREQUENCIES = ["weekly", "biweekly", "monthly", "ad_hoc"] as const;
export type NewsletterFrequency = (typeof NEWSLETTER_FREQUENCIES)[number];

export const NEWSLETTER_SUBSCRIBER_STATUSES = [
  "pending_confirmation",
  "active",
  "paused",
  "unsubscribed",
  "suppressed",
] as const;
export type NewsletterSubscriberStatus = (typeof NEWSLETTER_SUBSCRIBER_STATUSES)[number];

export const NEWSLETTER_SUPPRESSION_REASONS = [
  "manual_optout",
  "hard_bounce",
  "soft_bounce_repeated",
  "spam_complaint",
  "invalid_address",
  "support_sensitive",
  "trust_hold",
  "dispute_active",
  "payment_incident",
  "unsubscribed",
  "role_address",
  "legal_hold",
] as const;
export type NewsletterSuppressionReason = (typeof NEWSLETTER_SUPPRESSION_REASONS)[number];

export const NEWSLETTER_SUPPRESSION_SCOPES = [
  "all",
  "marketing",
  "lifecycle",
  "digest",
  "transactional_only",
] as const;
export type NewsletterSuppressionScope = (typeof NEWSLETTER_SUPPRESSION_SCOPES)[number];

export const NEWSLETTER_CAMPAIGN_STATUSES = [
  "draft",
  "in_review",
  "changes_requested",
  "approved",
  "scheduled",
  "sending",
  "paused",
  "sent",
  "cancelled",
  "archived",
] as const;
export type NewsletterCampaignStatus = (typeof NEWSLETTER_CAMPAIGN_STATUSES)[number];

export const NEWSLETTER_CAMPAIGN_CLASSES = [
  "company_wide",
  "division_digest",
  "lifecycle_journey",
  "transactional_education",
  "announcement",
] as const;
export type NewsletterCampaignClass = (typeof NEWSLETTER_CAMPAIGN_CLASSES)[number];

export const NEWSLETTER_SEND_STATUSES = [
  "queued",
  "skipped_suppressed",
  "skipped_preference",
  "skipped_trust_hold",
  "skipped_support_sensitive",
  "sent",
  "bounced",
  "complained",
  "opened",
  "clicked",
  "unsubscribed_from_send",
  "failed",
] as const;
export type NewsletterSendStatus = (typeof NEWSLETTER_SEND_STATUSES)[number];

export type NewsletterTopicKey = string;

export type NewsletterTopicDefinition = {
  key: NewsletterTopicKey;
  division: NewsletterDivision;
  label: string;
  description: string;
  defaultFrequency: NewsletterFrequency;
  editorialOnly: boolean;
  lifecycleOnly: boolean;
};

export type NewsletterSubscriber = {
  id: string;
  email: string;
  userId: string | null;
  locale: string;
  country: string | null;
  status: NewsletterSubscriberStatus;
  sourceSurface: string | null;
  sourceDivision: NewsletterDivision | null;
  consentGivenAt: string | null;
  confirmedAt: string | null;
  unsubscribedAt: string | null;
  lastEngagementAt: string | null;
  lastBouncedAt: string | null;
  hardBounceCount: number;
  softBounceCount: number;
  createdAt: string;
  updatedAt: string;
};

export type NewsletterSubscriberTopicPref = {
  subscriberId: string;
  topicKey: NewsletterTopicKey;
  optedInAt: string | null;
  optedOutAt: string | null;
  frequencyOverride: NewsletterFrequency | null;
};

export type NewsletterSuppressionEntry = {
  id: string;
  email: string;
  reason: NewsletterSuppressionReason;
  scope: NewsletterSuppressionScope;
  division: NewsletterDivision | null;
  note: string | null;
  recordedBy: string | null;
  recordedAt: string;
  expiresAt: string | null;
};

export type NewsletterSegmentCriteria = {
  divisions?: NewsletterDivision[];
  topics?: NewsletterTopicKey[];
  countries?: string[];
  locales?: string[];
  lifecycleStages?: string[];
  trustStates?: string[];
  userRoleHints?: string[];
  minEngagementWithinDays?: number;
  excludeDormant?: boolean;
  excludeSupportSensitive?: boolean;
  excludeTrustHold?: boolean;
  excludeDisputeActive?: boolean;
};

export type NewsletterAudienceSegment = {
  id: string;
  key: string;
  label: string;
  description: string;
  criteria: NewsletterSegmentCriteria;
  estimatedSize: number | null;
  lastResolvedAt: string | null;
  ownerTeam: string;
  createdAt: string;
  updatedAt: string;
};

export type NewsletterCampaignContent = {
  subject: string;
  previewText: string;
  headline: string;
  bodyBlocks: Array<{
    kind: "paragraph" | "heading" | "callout" | "cta" | "divider";
    text?: string;
    href?: string;
    variant?: "primary" | "secondary" | "muted";
  }>;
  footerNote: string | null;
  ctaPrimary: { label: string; href: string } | null;
  ctaSecondary: { label: string; href: string } | null;
};

export type NewsletterCampaign = {
  id: string;
  key: string;
  status: NewsletterCampaignStatus;
  campaignClass: NewsletterCampaignClass;
  division: NewsletterDivision;
  segmentId: string | null;
  topicKeys: NewsletterTopicKey[];
  content: NewsletterCampaignContent;
  scheduledFor: string | null;
  sendStartedAt: string | null;
  sendCompletedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  pausedReason: string | null;
  authorId: string;
  voiceGuardScore: number | null;
  voiceGuardWarnings: string[];
  createdAt: string;
  updatedAt: string;
};

export type NewsletterCampaignSendRecord = {
  id: string;
  campaignId: string;
  subscriberId: string;
  email: string;
  status: NewsletterSendStatus;
  provider: string;
  providerMessageId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  suppressionReason: NewsletterSuppressionReason | null;
  sentAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  bouncedAt: string | null;
  complainedAt: string | null;
  unsubscribedAt: string | null;
  createdAt: string;
};

export type NewsletterEditorialEventKind =
  | "created"
  | "updated"
  | "submitted_for_review"
  | "changes_requested"
  | "approved"
  | "scheduled"
  | "paused"
  | "cancelled"
  | "send_started"
  | "send_completed"
  | "archived"
  | "voice_guard_triggered"
  | "test_sent";

export type NewsletterEditorialEvent = {
  id: string;
  campaignId: string;
  actorId: string | null;
  kind: NewsletterEditorialEventKind;
  note: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type NewsletterBrandVoiceRule = {
  id: string;
  ruleKey: string;
  kind: "banned_phrase" | "required_disclosure" | "truth_constraint" | "tone_rule" | "compliance";
  pattern: string;
  reason: string;
  severity: "info" | "warning" | "block";
  appliesToClasses: NewsletterCampaignClass[];
  active: boolean;
  createdAt: string;
};

export type NewsletterDraftAssist = {
  id: string;
  campaignId: string;
  prompt: string | null;
  variant: string;
  assistModel: string | null;
  rawDraft: NewsletterCampaignContent;
  humanEditedDraft: NewsletterCampaignContent | null;
  voiceScore: number | null;
  voiceWarnings: string[];
  acceptedBy: string | null;
  acceptedAt: string | null;
  createdAt: string;
};
