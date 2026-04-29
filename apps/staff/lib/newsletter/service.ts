import "server-only";

import {
  NEWSLETTER_CAMPAIGNS_TABLE,
  NEWSLETTER_CAMPAIGN_SENDS_TABLE,
  NEWSLETTER_EDITORIAL_EVENTS_TABLE,
  NEWSLETTER_SUBSCRIBERS_TABLE,
  NEWSLETTER_SUBSCRIBER_TOPICS_TABLE,
  NEWSLETTER_SUPPRESSION_TABLE,
  NEWSLETTER_VOICE_RULES_TABLE,
  NEWSLETTER_SEGMENTS_TABLE,
  NEWSLETTER_EVENT_NAMES,
  buildPreferenceToken,
  brevoBlocklistContact,
  brevoRemoveContactFromLists,
  brevoSendTransactional,
  isBrevoEnabled,
  normalizeEmail,
  renderDraftAsHtml,
  resolveBrevoConfig,
  runVoiceGuard,
  summarizeVoiceWarnings,
  listTopicsForDivision,
  type NewsletterBrandVoiceRule,
  type NewsletterCampaignClass,
  type NewsletterCampaignContent,
  type NewsletterCampaignStatus,
  type NewsletterDivision,
  type NewsletterSuppressionReason,
  type NewsletterSuppressionScope,
  type VoiceGuardWarning,
} from "@henryco/newsletter";

import { createStaffAdminSupabase } from "@/lib/supabase/admin";

function getOptionalEnv(key: string): string | undefined {
  const v = process.env[key];
  if (typeof v !== "string") return undefined;
  const trimmed = v.trim();
  return trimmed || undefined;
}

function getPreferenceSecret(): string {
  const candidates = [
    getOptionalEnv("NEWSLETTER_PREFERENCES_SECRET"),
    getOptionalEnv("MARKETING_PREFERENCES_SECRET"),
    getOptionalEnv("CRON_SECRET"),
    getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY"),
  ];
  for (const candidate of candidates) {
    if (candidate && candidate.length >= 16) return candidate;
  }
  throw new Error("No newsletter preference secret available (need >= 16 chars)");
}

function getHubPublicBase(): string {
  const explicit = getOptionalEnv("NEXT_PUBLIC_HUB_URL");
  if (explicit) return explicit.replace(/\/+$/, "");
  return "https://henrycogroup.com";
}

type VoiceRuleRow = {
  rule_key: string;
  kind: NewsletterBrandVoiceRule["kind"];
  pattern: string;
  reason: string;
  severity: NewsletterBrandVoiceRule["severity"];
  applies_to_classes: string[];
  active: boolean;
};

async function fetchVoiceRules(): Promise<
  Array<
    Pick<
      NewsletterBrandVoiceRule,
      "ruleKey" | "kind" | "pattern" | "reason" | "severity" | "appliesToClasses" | "active"
    >
  > | null
> {
  const admin = createStaffAdminSupabase();
  const { data, error } = await admin
    .from(NEWSLETTER_VOICE_RULES_TABLE)
    .select("rule_key, kind, pattern, reason, severity, applies_to_classes, active")
    .eq("active", true);
  if (error || !data) return null;
  return (data as VoiceRuleRow[]).map((row) => ({
    ruleKey: row.rule_key,
    kind: row.kind,
    pattern: row.pattern,
    reason: row.reason,
    severity: row.severity,
    appliesToClasses: (row.applies_to_classes ?? []) as NewsletterCampaignClass[],
    active: row.active,
  }));
}

async function runVoiceGuardWithDbRules(
  content: NewsletterCampaignContent,
  campaignClass: NewsletterCampaignClass
) {
  const rules = await fetchVoiceRules();
  return runVoiceGuard({ content, campaignClass, rules: rules ?? undefined });
}

export type StaffCampaignRow = {
  id: string;
  key: string;
  status: NewsletterCampaignStatus;
  campaign_class: NewsletterCampaignClass;
  division: NewsletterDivision;
  topic_keys: string[];
  content: NewsletterCampaignContent;
  segment_id: string | null;
  scheduled_for: string | null;
  send_started_at: string | null;
  send_completed_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  paused_reason: string | null;
  author_id: string | null;
  voice_guard_score: number | null;
  voice_guard_warnings: string[];
  metrics: Record<string, unknown>;
  updated_at: string;
  created_at: string;
};

export type StaffEditorialEvent = {
  id: string;
  campaign_id: string;
  actor_id: string | null;
  kind: string;
  note: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};

export type StaffCampaignSendSummary = {
  attempted: number;
  sent: number;
  skipped: number;
  failed: number;
  pending: number;
  bounced: number;
  complained: number;
};

export async function listCampaigns(limit = 50): Promise<StaffCampaignRow[]> {
  const admin = createStaffAdminSupabase();
  const { data, error } = await admin
    .from(NEWSLETTER_CAMPAIGNS_TABLE)
    .select(
      "id, key, status, campaign_class, division, topic_keys, content, segment_id, scheduled_for, send_started_at, send_completed_at, approved_by, approved_at, paused_reason, author_id, voice_guard_score, voice_guard_warnings, metrics, updated_at, created_at"
    )
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[staff/newsletter] listCampaigns failed:", error);
    return [];
  }
  return (data ?? []) as StaffCampaignRow[];
}

export async function getCampaign(id: string): Promise<{
  campaign: StaffCampaignRow | null;
  events: StaffEditorialEvent[];
  sendSummary: StaffCampaignSendSummary;
}> {
  const admin = createStaffAdminSupabase();
  const [campaignRes, eventsRes, sendsRes] = await Promise.all([
    admin
      .from(NEWSLETTER_CAMPAIGNS_TABLE)
      .select(
        "id, key, status, campaign_class, division, topic_keys, content, segment_id, scheduled_for, send_started_at, send_completed_at, approved_by, approved_at, paused_reason, author_id, voice_guard_score, voice_guard_warnings, metrics, updated_at, created_at"
      )
      .eq("id", id)
      .maybeSingle<StaffCampaignRow>(),
    admin
      .from(NEWSLETTER_EDITORIAL_EVENTS_TABLE)
      .select("id, campaign_id, actor_id, kind, note, payload, created_at")
      .eq("campaign_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from(NEWSLETTER_CAMPAIGN_SENDS_TABLE)
      .select("status")
      .eq("campaign_id", id)
      .limit(2000),
  ]);

  const summary: StaffCampaignSendSummary = {
    attempted: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    pending: 0,
    bounced: 0,
    complained: 0,
  };
  for (const row of (sendsRes.data ?? []) as Array<{ status: string }>) {
    summary.attempted++;
    if (row.status === "sent" || row.status === "opened" || row.status === "clicked")
      summary.sent++;
    else if (row.status.startsWith("skipped_")) summary.skipped++;
    else if (row.status === "failed") summary.failed++;
    else if (row.status === "queued") summary.pending++;
    else if (row.status === "bounced") summary.bounced++;
    else if (row.status === "complained") summary.complained++;
  }

  return {
    campaign: campaignRes.data ?? null,
    events: (eventsRes.data ?? []) as StaffEditorialEvent[],
    sendSummary: summary,
  };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export type CreateDraftInput = {
  key?: string | null;
  campaignClass: NewsletterCampaignClass;
  division: NewsletterDivision;
  topicKeys: string[];
  content: NewsletterCampaignContent;
  authorId: string | null;
  note?: string | null;
};

export type CreateDraftResult =
  | { ok: true; campaign: StaffCampaignRow }
  | { ok: false; code: "validation_failed" | "storage_error"; message: string };

function contentIsMinimallyFilled(content: NewsletterCampaignContent): boolean {
  if (!content.subject?.trim()) return false;
  if (!content.previewText?.trim()) return false;
  if (!content.headline?.trim()) return false;
  if (!Array.isArray(content.bodyBlocks) || content.bodyBlocks.length === 0) return false;
  return true;
}

export async function createDraft(input: CreateDraftInput): Promise<CreateDraftResult> {
  if (!contentIsMinimallyFilled(input.content)) {
    return {
      ok: false,
      code: "validation_failed",
      message: "Missing required fields (subject, previewText, headline, at least one body block).",
    };
  }
  if (!Array.isArray(input.topicKeys) || input.topicKeys.length === 0) {
    return {
      ok: false,
      code: "validation_failed",
      message: "At least one topic key is required for targeting.",
    };
  }
  const divisionTopics = new Set(listTopicsForDivision(input.division).map((t) => t.key));
  const invalidTopic = input.topicKeys.find((k) => !divisionTopics.has(k));
  if (invalidTopic && input.division !== "hub") {
    return {
      ok: false,
      code: "validation_failed",
      message: `Topic "${invalidTopic}" does not belong to division "${input.division}".`,
    };
  }

  const voice = await runVoiceGuardWithDbRules(input.content, input.campaignClass);
  const warningsText = summarizeVoiceWarnings(voice.warnings);

  const admin = createStaffAdminSupabase();
  const keyBase = input.key && input.key.trim() ? input.key.trim() : input.content.subject;
  const keySlug = slugify(keyBase) || `draft-${Date.now()}`;
  const finalKey = `${keySlug}-${Math.random().toString(36).slice(2, 8)}`;

  const inserted = await admin
    .from(NEWSLETTER_CAMPAIGNS_TABLE)
    .insert({
      key: finalKey,
      status: "draft",
      campaign_class: input.campaignClass,
      division: input.division,
      topic_keys: input.topicKeys,
      content: input.content,
      author_id: input.authorId,
      voice_guard_score: voice.score,
      voice_guard_warnings: warningsText,
    })
    .select(
      "id, key, status, campaign_class, division, topic_keys, content, segment_id, scheduled_for, send_started_at, send_completed_at, approved_by, approved_at, paused_reason, author_id, voice_guard_score, voice_guard_warnings, metrics, updated_at, created_at"
    )
    .maybeSingle<StaffCampaignRow>();

  if (inserted.error || !inserted.data) {
    console.error("[staff/newsletter] createDraft insert failed:", inserted.error);
    return { ok: false, code: "storage_error", message: "Draft create failed." };
  }

  await recordEditorialEvent({
    campaignId: inserted.data.id,
    actorId: input.authorId,
    kind: "created",
    note: input.note ?? null,
    payload: {
      voiceScore: voice.score,
      voiceWarnings: warningsText,
      event: NEWSLETTER_EVENT_NAMES.CAMPAIGN_DRAFT_CREATED,
    },
  });

  return { ok: true, campaign: inserted.data };
}

export type UpdateDraftInput = {
  id: string;
  content?: NewsletterCampaignContent;
  topicKeys?: string[];
  campaignClass?: NewsletterCampaignClass;
  division?: NewsletterDivision;
  actorId: string | null;
  note?: string | null;
};

export type UpdateDraftResult =
  | { ok: true; campaign: StaffCampaignRow; voice: { score: number; warnings: VoiceGuardWarning[] } }
  | { ok: false; code: "not_found" | "invalid_state" | "storage_error"; message: string };

const EDITABLE_STATUSES: NewsletterCampaignStatus[] = [
  "draft",
  "in_review",
  "changes_requested",
];

export async function updateDraft(input: UpdateDraftInput): Promise<UpdateDraftResult> {
  const admin = createStaffAdminSupabase();
  const existing = await admin
    .from(NEWSLETTER_CAMPAIGNS_TABLE)
    .select(
      "id, key, status, campaign_class, division, topic_keys, content, segment_id, scheduled_for, send_started_at, send_completed_at, approved_by, approved_at, paused_reason, author_id, voice_guard_score, voice_guard_warnings, metrics, updated_at, created_at"
    )
    .eq("id", input.id)
    .maybeSingle<StaffCampaignRow>();

  if (existing.error || !existing.data) {
    return { ok: false, code: "not_found", message: "Campaign not found." };
  }
  if (!EDITABLE_STATUSES.includes(existing.data.status)) {
    return {
      ok: false,
      code: "invalid_state",
      message: `Cannot edit a campaign in state "${existing.data.status}".`,
    };
  }

  const nextContent = input.content ?? existing.data.content;
  if (!contentIsMinimallyFilled(nextContent)) {
    return {
      ok: false,
      code: "invalid_state",
      message: "Content is missing required fields.",
    };
  }
  const nextClass = input.campaignClass ?? existing.data.campaign_class;
  const nextDivision = input.division ?? existing.data.division;
  const nextTopicKeys = input.topicKeys ?? existing.data.topic_keys;

  const voice = await runVoiceGuardWithDbRules(nextContent, nextClass);
  const warningsText = summarizeVoiceWarnings(voice.warnings);

  const updateRes = await admin
    .from(NEWSLETTER_CAMPAIGNS_TABLE)
    .update({
      content: nextContent,
      topic_keys: nextTopicKeys,
      campaign_class: nextClass,
      division: nextDivision,
      voice_guard_score: voice.score,
      voice_guard_warnings: warningsText,
      status:
        existing.data.status === "changes_requested" ? "draft" : existing.data.status,
    })
    .eq("id", input.id)
    .select(
      "id, key, status, campaign_class, division, topic_keys, content, segment_id, scheduled_for, send_started_at, send_completed_at, approved_by, approved_at, paused_reason, author_id, voice_guard_score, voice_guard_warnings, metrics, updated_at, created_at"
    )
    .maybeSingle<StaffCampaignRow>();

  if (updateRes.error || !updateRes.data) {
    return { ok: false, code: "storage_error", message: "Update failed." };
  }

  await recordEditorialEvent({
    campaignId: input.id,
    actorId: input.actorId,
    kind: "updated",
    note: input.note ?? null,
    payload: {
      voiceScore: voice.score,
      voiceWarnings: warningsText,
      event: NEWSLETTER_EVENT_NAMES.CAMPAIGN_DRAFT_UPDATED,
    },
  });

  return { ok: true, campaign: updateRes.data, voice: { score: voice.score, warnings: voice.warnings } };
}

export type TransitionInput = {
  id: string;
  actorId: string | null;
  note?: string | null;
};

type TransitionOutcome =
  | { ok: true; campaign: StaffCampaignRow }
  | {
      ok: false;
      code: "not_found" | "invalid_state" | "storage_error" | "voice_guard_blocked";
      message: string;
      blocks?: VoiceGuardWarning[];
    };

async function transitionTo(
  id: string,
  actorId: string | null,
  nextStatus: NewsletterCampaignStatus,
  kind:
    | "submitted_for_review"
    | "changes_requested"
    | "approved"
    | "scheduled"
    | "paused"
    | "cancelled"
    | "archived",
  validFrom: NewsletterCampaignStatus[],
  extraFields: Record<string, unknown> = {},
  note: string | null = null,
  runVoiceCheck = false
): Promise<TransitionOutcome> {
  const admin = createStaffAdminSupabase();
  const existing = await admin
    .from(NEWSLETTER_CAMPAIGNS_TABLE)
    .select(
      "id, key, status, campaign_class, division, topic_keys, content, segment_id, scheduled_for, send_started_at, send_completed_at, approved_by, approved_at, paused_reason, author_id, voice_guard_score, voice_guard_warnings, metrics, updated_at, created_at"
    )
    .eq("id", id)
    .maybeSingle<StaffCampaignRow>();
  if (existing.error || !existing.data) {
    return { ok: false, code: "not_found", message: "Campaign not found." };
  }
  if (!validFrom.includes(existing.data.status)) {
    return {
      ok: false,
      code: "invalid_state",
      message: `Cannot transition from "${existing.data.status}" to "${nextStatus}".`,
    };
  }
  if (runVoiceCheck) {
    const voice = await runVoiceGuardWithDbRules(
      existing.data.content,
      existing.data.campaign_class
    );
    if (voice.blocks.length > 0) {
      return {
        ok: false,
        code: "voice_guard_blocked",
        message: "Voice guard blocks present. Resolve them before this transition.",
        blocks: voice.blocks,
      };
    }
  }

  const update = await admin
    .from(NEWSLETTER_CAMPAIGNS_TABLE)
    .update({ status: nextStatus, ...extraFields })
    .eq("id", id)
    .select(
      "id, key, status, campaign_class, division, topic_keys, content, segment_id, scheduled_for, send_started_at, send_completed_at, approved_by, approved_at, paused_reason, author_id, voice_guard_score, voice_guard_warnings, metrics, updated_at, created_at"
    )
    .maybeSingle<StaffCampaignRow>();
  if (update.error || !update.data) {
    return { ok: false, code: "storage_error", message: "Transition failed." };
  }
  await recordEditorialEvent({
    campaignId: id,
    actorId,
    kind,
    note,
    payload: { nextStatus },
  });
  return { ok: true, campaign: update.data };
}

export async function submitForReview(input: TransitionInput): Promise<TransitionOutcome> {
  return transitionTo(
    input.id,
    input.actorId,
    "in_review",
    "submitted_for_review",
    ["draft", "changes_requested"],
    {},
    input.note ?? null,
    true
  );
}

export async function requestChanges(input: TransitionInput): Promise<TransitionOutcome> {
  return transitionTo(
    input.id,
    input.actorId,
    "changes_requested",
    "changes_requested",
    ["in_review"],
    {},
    input.note ?? null
  );
}

export async function approveDraft(input: TransitionInput): Promise<TransitionOutcome> {
  return transitionTo(
    input.id,
    input.actorId,
    "approved",
    "approved",
    ["in_review"],
    {
      approved_by: input.actorId,
      approved_at: new Date().toISOString(),
    },
    input.note ?? null,
    true
  );
}

export async function scheduleDraft(
  input: TransitionInput & { scheduledFor: string }
): Promise<TransitionOutcome> {
  const scheduledDate = new Date(input.scheduledFor);
  if (Number.isNaN(scheduledDate.getTime())) {
    return {
      ok: false,
      code: "invalid_state",
      message: "Invalid scheduled date.",
    };
  }
  if (scheduledDate.getTime() < Date.now() - 5 * 60_000) {
    return {
      ok: false,
      code: "invalid_state",
      message: "Scheduled date must not be in the past.",
    };
  }
  return transitionTo(
    input.id,
    input.actorId,
    "scheduled",
    "scheduled",
    ["approved", "scheduled"],
    { scheduled_for: scheduledDate.toISOString() },
    input.note ?? null,
    true
  );
}

export async function pauseCampaign(input: TransitionInput & { reason: string }): Promise<TransitionOutcome> {
  return transitionTo(
    input.id,
    input.actorId,
    "paused",
    "paused",
    ["approved", "scheduled", "sending"],
    { paused_reason: input.reason },
    input.note ?? null
  );
}

export async function cancelDraft(input: TransitionInput): Promise<TransitionOutcome> {
  return transitionTo(
    input.id,
    input.actorId,
    "cancelled",
    "cancelled",
    ["draft", "in_review", "changes_requested", "approved", "scheduled", "paused"],
    {},
    input.note ?? null
  );
}

export async function archiveCampaign(input: TransitionInput): Promise<TransitionOutcome> {
  return transitionTo(
    input.id,
    input.actorId,
    "archived",
    "archived",
    ["sent", "cancelled", "paused"],
    {},
    input.note ?? null
  );
}

export type SendTestDraftInput = {
  id: string;
  to: string;
  actorId: string | null;
};

export type SendTestDraftResult =
  | { ok: true; provider: string; messageId: string }
  | { ok: false; reason: string };

export async function sendTestDraft(input: SendTestDraftInput): Promise<SendTestDraftResult> {
  const email = normalizeEmail(input.to);
  if (!email) return { ok: false, reason: "invalid_email" };

  const admin = createStaffAdminSupabase();
  const campaignRes = await admin
    .from(NEWSLETTER_CAMPAIGNS_TABLE)
    .select("id, content, campaign_class, division, topic_keys, status")
    .eq("id", input.id)
    .maybeSingle<{
      id: string;
      content: NewsletterCampaignContent;
      campaign_class: NewsletterCampaignClass;
      division: string;
      topic_keys: string[];
      status: string;
    }>();
  if (campaignRes.error || !campaignRes.data) {
    return { ok: false, reason: "campaign_not_found" };
  }

  const voice = await runVoiceGuardWithDbRules(
    campaignRes.data.content,
    campaignRes.data.campaign_class
  );
  if (voice.blocks.length > 0) {
    await admin.from(NEWSLETTER_EDITORIAL_EVENTS_TABLE).insert({
      campaign_id: input.id,
      actor_id: input.actorId,
      kind: "voice_guard_triggered",
      note: "Voice guard blocked test send.",
      payload: { blocks: voice.blocks },
    });
    return {
      ok: false,
      reason: `voice_guard_blocks:${voice.blocks.map((b) => b.ruleKey).join(",")}`,
    };
  }

  const html = renderDraftAsHtml(campaignRes.data.content)
    .replace("{{preferences_url}}", `${getHubPublicBase()}/newsletter/preferences`)
    .replace("{{unsubscribe_url}}", `${getHubPublicBase()}/newsletter/unsubscribe`);

  const brevoConfig = resolveBrevoConfig();
  if (!isBrevoEnabled(brevoConfig)) {
    await admin.from(NEWSLETTER_EDITORIAL_EVENTS_TABLE).insert({
      campaign_id: input.id,
      actor_id: input.actorId,
      kind: "test_sent",
      note: "Brevo disabled — test send simulated.",
      payload: { to: email, provider: "disabled" },
    });
    return { ok: false, reason: "brevo_not_configured" };
  }

  const result = await brevoSendTransactional(brevoConfig, {
    to: email,
    subject: `[TEST] ${campaignRes.data.content.subject}`,
    html,
    tags: ["newsletter-test"],
  });

  await admin.from(NEWSLETTER_EDITORIAL_EVENTS_TABLE).insert({
    campaign_id: input.id,
    actor_id: input.actorId,
    kind: "test_sent",
    note: `Test send to ${email}`,
    payload: {
      ok: result.ok,
      provider: result.provider,
      messageId: result.ok ? result.messageId : null,
      error: result.ok ? null : result.error,
    },
  });

  if (!result.ok) return { ok: false, reason: result.error };
  return { ok: true, provider: result.provider, messageId: result.messageId };
}

export async function recordEditorialEvent(input: {
  campaignId: string;
  actorId: string | null;
  kind:
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
  note?: string | null;
  payload?: Record<string, unknown>;
}): Promise<void> {
  const admin = createStaffAdminSupabase();
  await admin.from(NEWSLETTER_EDITORIAL_EVENTS_TABLE).insert({
    campaign_id: input.campaignId,
    actor_id: input.actorId,
    kind: input.kind,
    note: input.note ?? null,
    payload: input.payload ?? {},
  });
}

type SubscriberRow = {
  id: string;
  email: string;
  status: string;
  hard_bounce_count: number;
  locale: string;
  country: string | null;
};

export type RunCampaignSendInput = {
  campaignId: string;
  actorId: string | null;
  dryRun?: boolean;
  maxPerRun?: number;
};

export type RunCampaignSendResult = {
  ok: boolean;
  attempted: number;
  sent: number;
  skipped: number;
  failed: number;
  notes: string[];
};

export async function runCampaignSend(
  input: RunCampaignSendInput
): Promise<RunCampaignSendResult> {
  const admin = createStaffAdminSupabase();
  const campaignRes = await admin
    .from(NEWSLETTER_CAMPAIGNS_TABLE)
    .select("*")
    .eq("id", input.campaignId)
    .maybeSingle();
  if (campaignRes.error || !campaignRes.data) {
    return { ok: false, attempted: 0, sent: 0, skipped: 0, failed: 0, notes: ["campaign_not_found"] };
  }
  const campaign = campaignRes.data as {
    id: string;
    status: string;
    campaign_class: NewsletterCampaignClass;
    division: string;
    content: NewsletterCampaignContent;
    topic_keys: string[];
  };
  if (!["approved", "scheduled", "sending"].includes(campaign.status)) {
    return {
      ok: false,
      attempted: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      notes: [`campaign_not_sendable:${campaign.status}`],
    };
  }

  const voice = await runVoiceGuardWithDbRules(
    campaign.content,
    campaign.campaign_class
  );
  if (voice.blocks.length > 0) {
    await admin
      .from(NEWSLETTER_CAMPAIGNS_TABLE)
      .update({ status: "paused", paused_reason: "voice_guard_blocks" })
      .eq("id", campaign.id);
    await recordEditorialEvent({
      campaignId: campaign.id,
      actorId: input.actorId,
      kind: "voice_guard_triggered",
      note: "Voice guard blocked send.",
      payload: { blocks: voice.blocks },
    });
    return { ok: false, attempted: 0, sent: 0, skipped: 0, failed: 0, notes: ["voice_guard_blocked"] };
  }

  await admin
    .from(NEWSLETTER_CAMPAIGNS_TABLE)
    .update({ status: "sending", send_started_at: new Date().toISOString() })
    .eq("id", campaign.id);

  await recordEditorialEvent({
    campaignId: campaign.id,
    actorId: input.actorId,
    kind: "send_started",
    note: "Send run started.",
    payload: { dryRun: Boolean(input.dryRun) },
  });

  const topicKeys = Array.isArray(campaign.topic_keys) ? campaign.topic_keys : [];
  if (topicKeys.length === 0) {
    return {
      ok: false,
      attempted: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      notes: ["no_topic_keys_on_campaign"],
    };
  }

  const topicOptins = await admin
    .from(NEWSLETTER_SUBSCRIBER_TOPICS_TABLE)
    .select("subscriber_id")
    .in("topic_key", topicKeys)
    .is("opted_out_at", null)
    .not("opted_in_at", "is", null)
    .limit(input.maxPerRun ?? 500);
  if (topicOptins.error) {
    return {
      ok: false,
      attempted: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      notes: [`topic_lookup_failed:${topicOptins.error.message}`],
    };
  }
  const subscriberIds = Array.from(
    new Set((topicOptins.data ?? []).map((r: { subscriber_id: string }) => r.subscriber_id))
  );
  if (subscriberIds.length === 0) {
    await admin
      .from(NEWSLETTER_CAMPAIGNS_TABLE)
      .update({ status: "sent", send_completed_at: new Date().toISOString() })
      .eq("id", campaign.id);
    return { ok: true, attempted: 0, sent: 0, skipped: 0, failed: 0, notes: ["no_matching_subscribers"] };
  }

  const subscribersRes = await admin
    .from(NEWSLETTER_SUBSCRIBERS_TABLE)
    .select("id, email, status, hard_bounce_count, locale, country")
    .in("id", subscriberIds);
  if (subscribersRes.error) {
    return {
      ok: false,
      attempted: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      notes: [`subscribers_lookup_failed:${subscribersRes.error.message}`],
    };
  }
  const rows = (subscribersRes.data ?? []) as SubscriberRow[];

  const suppressionRes = await admin
    .from(NEWSLETTER_SUPPRESSION_TABLE)
    .select("email, reason, scope, expires_at")
    .in(
      "email",
      rows.map((r) => r.email)
    );
  const suppressionEntries = (suppressionRes.data ?? []) as Array<{
    email: string;
    reason: NewsletterSuppressionReason;
    scope: NewsletterSuppressionScope;
    expires_at: string | null;
  }>;

  const brevoConfig = resolveBrevoConfig();
  const brevoReady = isBrevoEnabled(brevoConfig);
  const html = renderDraftAsHtml(campaign.content);
  const preferencesBase = `${getHubPublicBase()}/newsletter/preferences`;
  const unsubscribeBase = `${getHubPublicBase()}/newsletter/unsubscribe`;

  let attempted = 0;
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  const notes: string[] = [];

  for (const row of rows) {
    attempted++;
    const scope = suppressionEntries
      .filter((e) => e.email.toLowerCase() === row.email.toLowerCase())
      .find((e) => {
        if (e.scope === "transactional_only") return false;
        if (e.expires_at) {
          const exp = Date.parse(e.expires_at);
          if (!Number.isNaN(exp) && exp <= Date.now()) return false;
        }
        return true;
      });
    if (scope || row.status !== "active" || row.hard_bounce_count >= 2) {
      skipped++;
      await admin.from(NEWSLETTER_CAMPAIGN_SENDS_TABLE).insert({
        campaign_id: campaign.id,
        subscriber_id: row.id,
        email: row.email,
        status: "skipped_suppressed",
        suppression_reason: scope?.reason ?? "manual_optout",
      });
      continue;
    }
    if (input.dryRun) {
      sent++;
      await admin.from(NEWSLETTER_CAMPAIGN_SENDS_TABLE).insert({
        campaign_id: campaign.id,
        subscriber_id: row.id,
        email: row.email,
        status: "queued",
        provider: "dry_run",
      });
      continue;
    }
    if (!brevoReady) {
      failed++;
      await admin.from(NEWSLETTER_CAMPAIGN_SENDS_TABLE).insert({
        campaign_id: campaign.id,
        subscriber_id: row.id,
        email: row.email,
        status: "failed",
        provider: "disabled",
        error_code: "brevo_not_configured",
        error_message: "BREVO_API_KEY not configured.",
      });
      notes.push("brevo_not_configured");
      continue;
    }
    const token = buildPreferenceToken({
      secret: getPreferenceSecret(),
      email: row.email,
      subscriberId: row.id,
    });
    const personalizedHtml = html
      .replace("{{preferences_url}}", `${preferencesBase}?token=${encodeURIComponent(token)}`)
      .replace("{{unsubscribe_url}}", `${unsubscribeBase}?token=${encodeURIComponent(token)}`);
    const result = await brevoSendTransactional(brevoConfig, {
      to: row.email,
      subject: campaign.content.subject,
      html: personalizedHtml,
      tags: ["newsletter", campaign.division, ...topicKeys].slice(0, 10),
    });
    if (result.ok) {
      sent++;
      await admin.from(NEWSLETTER_CAMPAIGN_SENDS_TABLE).insert({
        campaign_id: campaign.id,
        subscriber_id: row.id,
        email: row.email,
        status: "sent",
        provider: "brevo",
        provider_message_id: result.messageId,
        sent_at: new Date().toISOString(),
      });
    } else {
      failed++;
      await admin.from(NEWSLETTER_CAMPAIGN_SENDS_TABLE).insert({
        campaign_id: campaign.id,
        subscriber_id: row.id,
        email: row.email,
        status: "failed",
        provider: "brevo",
        error_code: `http_${result.status ?? "unknown"}`,
        error_message: result.error,
      });
    }
  }

  const finalStatus = failed > 0 && sent === 0 ? "paused" : sent > 0 ? "sent" : "approved";
  await admin
    .from(NEWSLETTER_CAMPAIGNS_TABLE)
    .update({
      status: finalStatus,
      send_completed_at: finalStatus === "sent" ? new Date().toISOString() : null,
      paused_reason: finalStatus === "paused" ? "all_recipients_failed" : null,
      metrics: {
        attempted,
        sent,
        skipped,
        failed,
        last_run_at: new Date().toISOString(),
      },
    })
    .eq("id", campaign.id);

  if (finalStatus === "sent") {
    await recordEditorialEvent({
      campaignId: campaign.id,
      actorId: input.actorId,
      kind: "send_completed",
      note: `Send completed — sent=${sent}, skipped=${skipped}, failed=${failed}.`,
      payload: { attempted, sent, skipped, failed },
    });
  }
  return { ok: true, attempted, sent, skipped, failed, notes };
}

export async function listSegments() {
  const admin = createStaffAdminSupabase();
  const { data, error } = await admin
    .from(NEWSLETTER_SEGMENTS_TABLE)
    .select("id, key, label, description, criteria, estimated_size, owner_team, updated_at")
    .eq("active", true)
    .order("updated_at", { ascending: false })
    .limit(40);
  if (error) return [];
  return data ?? [];
}

export async function suppressionSnapshot(limit = 40) {
  const admin = createStaffAdminSupabase();
  const { data, error } = await admin
    .from(NEWSLETTER_SUPPRESSION_TABLE)
    .select("email, reason, scope, division, note, recorded_at, expires_at")
    .order("recorded_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return data ?? [];
}

export async function subscribersSnapshot() {
  const admin = createStaffAdminSupabase();
  const statuses = ["pending_confirmation", "active", "paused", "unsubscribed", "suppressed"];
  const counts: Record<string, number> = {};
  for (const status of statuses) {
    const res = await admin
      .from(NEWSLETTER_SUBSCRIBERS_TABLE)
      .select("id", { count: "exact", head: true })
      .eq("status", status);
    counts[status] = res.count ?? 0;
  }
  return counts;
}

export async function manuallySuppress(input: {
  email: string;
  reason: NewsletterSuppressionReason;
  scope: NewsletterSuppressionScope;
  note?: string | null;
  division?: string | null;
  actorId: string | null;
}) {
  const email = normalizeEmail(input.email);
  if (!email) return { ok: false, error: "invalid_email" };
  const admin = createStaffAdminSupabase();
  const { error } = await admin.from(NEWSLETTER_SUPPRESSION_TABLE).upsert(
    {
      email,
      reason: input.reason,
      scope: input.scope,
      division: input.division ?? null,
      note: input.note ?? null,
      recorded_by: input.actorId,
    },
    { onConflict: "email,reason,scope" }
  );
  if (error) return { ok: false, error: error.message };

  if (input.reason === "hard_bounce" || input.reason === "spam_complaint") {
    try {
      const brevoConfig = resolveBrevoConfig();
      if (isBrevoEnabled(brevoConfig)) {
        await brevoBlocklistContact(brevoConfig, email);
      }
    } catch (err) {
      console.warn("[staff/newsletter] brevo blocklist soft-failed:", err);
    }
  }
  if (input.scope === "all" || input.scope === "marketing") {
    try {
      const brevoConfig = resolveBrevoConfig();
      if (isBrevoEnabled(brevoConfig)) {
        await brevoRemoveContactFromLists(brevoConfig, { email });
      }
    } catch (err) {
      console.warn("[staff/newsletter] brevo list remove soft-failed:", err);
    }
  }
  return { ok: true };
}

export { runVoiceGuardWithDbRules };
