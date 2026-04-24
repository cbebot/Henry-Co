import "server-only";

import {
  NEWSLETTER_SUBSCRIBERS_TABLE,
  NEWSLETTER_SUBSCRIBER_TOPICS_TABLE,
  NEWSLETTER_SUPPRESSION_TABLE,
  NEWSLETTER_CAMPAIGNS_TABLE,
  NEWSLETTER_CAMPAIGN_SENDS_TABLE,
  NEWSLETTER_EDITORIAL_EVENTS_TABLE,
  NEWSLETTER_EVENT_NAMES,
  buildPreferenceToken,
  normalizeEmail,
  normalizeSubscriptionInput,
  verifyPreferenceToken,
  listPubliclySubscribableTopics,
  type NewsletterSubscriber,
  type NewsletterSubscriberStatus,
  type NewsletterSuppressionReason,
  type NewsletterSuppressionScope,
  type SubscriptionInput,
  resolveBrevoConfig,
  isBrevoEnabled,
  brevoSendTransactional,
  brevoSyncContact,
  brevoRemoveContactFromLists,
  brevoBlocklistContact,
  renderDraftAsHtml,
  runVoiceGuard,
  type NewsletterCampaignContent,
  type NewsletterCampaignClass,
} from "@henryco/newsletter";

import { createAdminSupabase } from "@/lib/supabase";
import { getOptionalEnv } from "@/lib/env";

const ALLOWED_TOPIC_KEYS = new Set(listPubliclySubscribableTopics().map((t) => t.key));

function getPreferenceSecret(): string {
  const candidates = [
    getOptionalEnv("NEWSLETTER_PREFERENCES_SECRET"),
    getOptionalEnv("MARKETING_PREFERENCES_SECRET"),
    getOptionalEnv("CRON_SECRET"),
    getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY"),
  ];
  for (const candidate of candidates) {
    if (candidate && candidate.trim().length >= 16) return candidate.trim();
  }
  throw new Error("No newsletter preference secret available (need >= 16 chars)");
}

function getHubPublicBase(): string {
  const explicit = getOptionalEnv("NEXT_PUBLIC_HUB_URL");
  if (explicit && explicit.trim()) return explicit.trim().replace(/\/+$/, "");
  return "https://henrycogroup.com";
}

type SubscriberRow = {
  id: string;
  email: string;
  user_id: string | null;
  locale: string;
  country: string | null;
  status: NewsletterSubscriberStatus;
  source_surface: string | null;
  source_division: string | null;
  consent_given_at: string | null;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
  last_engagement_at: string | null;
  last_bounced_at: string | null;
  hard_bounce_count: number;
  soft_bounce_count: number;
  created_at: string;
  updated_at: string;
};

function rowToSubscriber(row: SubscriberRow): NewsletterSubscriber {
  return {
    id: row.id,
    email: row.email,
    userId: row.user_id,
    locale: row.locale,
    country: row.country,
    status: row.status,
    sourceSurface: row.source_surface,
    sourceDivision: (row.source_division as NewsletterSubscriber["sourceDivision"]) ?? null,
    consentGivenAt: row.consent_given_at,
    confirmedAt: row.confirmed_at,
    unsubscribedAt: row.unsubscribed_at,
    lastEngagementAt: row.last_engagement_at,
    lastBouncedAt: row.last_bounced_at,
    hardBounceCount: row.hard_bounce_count,
    softBounceCount: row.soft_bounce_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type SubscribeResult =
  | {
      ok: true;
      subscriber: NewsletterSubscriber;
      topicKeys: string[];
      preferenceUrl: string;
      created: boolean;
    }
  | {
      ok: false;
      code:
        | "validation_failed"
        | "suppressed"
        | "storage_error";
      message: string;
      errors?: Array<{ field: string; reason: string }>;
    };

async function isEmailSuppressed(email: string): Promise<boolean> {
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from(NEWSLETTER_SUPPRESSION_TABLE)
    .select("id, scope, expires_at")
    .eq("email", email)
    .limit(50);
  if (error) throw new Error(`Failed to check suppression: ${error.message}`);
  if (!data) return false;
  const now = Date.now();
  return data.some((row: { scope: string; expires_at: string | null }) => {
    if (row.scope === "transactional_only") return false;
    if (row.expires_at) {
      const exp = Date.parse(row.expires_at);
      if (!Number.isNaN(exp) && exp <= now) return false;
    }
    return true;
  });
}

export async function subscribe(input: SubscriptionInput): Promise<SubscribeResult> {
  const normalization = normalizeSubscriptionInput(input, { allowedTopicKeys: ALLOWED_TOPIC_KEYS });
  if (!normalization.ok) {
    return {
      ok: false,
      code: "validation_failed",
      message: "Input validation failed",
      errors: normalization.errors.map((e) => ({ field: e.field, reason: e.reason })),
    };
  }

  const { value } = normalization;

  try {
    if (await isEmailSuppressed(value.email)) {
      return {
        ok: false,
        code: "suppressed",
        message:
          "This address is on our suppression list. We'll remove it only after a documented review.",
      };
    }
  } catch (err) {
    console.error("[newsletter/service] suppression check failed:", err);
    return { ok: false, code: "storage_error", message: "Temporary storage error" };
  }

  const admin = createAdminSupabase();
  const now = new Date().toISOString();

  const existing = await admin
    .from(NEWSLETTER_SUBSCRIBERS_TABLE)
    .select("*")
    .eq("email", value.email)
    .maybeSingle<SubscriberRow>();

  if (existing.error) {
    console.error("[newsletter/service] existing lookup failed:", existing.error);
    return { ok: false, code: "storage_error", message: "Temporary storage error" };
  }

  let subscriberRow: SubscriberRow;
  let created = false;

  if (existing.data) {
    const next = {
      locale: value.locale,
      country: value.country ?? existing.data.country,
      source_surface: existing.data.source_surface ?? value.sourceSurface,
      source_division: existing.data.source_division ?? value.sourceDivision,
      status:
        existing.data.status === "unsubscribed" ? "pending_confirmation" : existing.data.status,
      unsubscribed_at:
        existing.data.status === "unsubscribed" ? null : existing.data.unsubscribed_at,
      consent_given_at: existing.data.consent_given_at ?? now,
      user_id: existing.data.user_id ?? value.userId,
    };
    const updated = await admin
      .from(NEWSLETTER_SUBSCRIBERS_TABLE)
      .update(next)
      .eq("id", existing.data.id)
      .select("*")
      .maybeSingle<SubscriberRow>();
    if (updated.error || !updated.data) {
      console.error("[newsletter/service] subscriber update failed:", updated.error);
      return { ok: false, code: "storage_error", message: "Temporary storage error" };
    }
    subscriberRow = updated.data;
  } else {
    const inserted = await admin
      .from(NEWSLETTER_SUBSCRIBERS_TABLE)
      .insert({
        email: value.email,
        user_id: value.userId,
        locale: value.locale,
        country: value.country,
        source_surface: value.sourceSurface,
        source_division: value.sourceDivision,
        status: "active",
        consent_given_at: now,
        confirmed_at: now,
      })
      .select("*")
      .maybeSingle<SubscriberRow>();
    if (inserted.error || !inserted.data) {
      console.error("[newsletter/service] subscriber insert failed:", inserted.error);
      return { ok: false, code: "storage_error", message: "Temporary storage error" };
    }
    subscriberRow = inserted.data;
    created = true;
  }

  const topicRows = value.topicKeys.map((topicKey) => ({
    subscriber_id: subscriberRow.id,
    topic_key: topicKey,
    opted_in_at: now,
    opted_out_at: null,
    source_surface: value.sourceSurface,
  }));

  if (topicRows.length > 0) {
    const upsert = await admin
      .from(NEWSLETTER_SUBSCRIBER_TOPICS_TABLE)
      .upsert(topicRows, { onConflict: "subscriber_id,topic_key" });
    if (upsert.error) {
      console.error("[newsletter/service] topic upsert failed:", upsert.error);
    }
  }

  const subscriber = rowToSubscriber(subscriberRow);
  const token = buildPreferenceToken({
    secret: getPreferenceSecret(),
    email: subscriber.email,
    subscriberId: subscriber.id,
  });
  const preferenceUrl = `${getHubPublicBase()}/newsletter/preferences?token=${encodeURIComponent(token)}`;

  try {
    const brevoConfig = resolveBrevoConfig();
    if (isBrevoEnabled(brevoConfig)) {
      await brevoSyncContact(brevoConfig, {
        email: subscriber.email,
        attributes: {
          LOCALE: subscriber.locale,
          COUNTRY: subscriber.country ?? "",
          SOURCE_DIVISION: subscriber.sourceDivision ?? "",
          TOPICS: value.topicKeys.join(","),
        },
      });
    }
  } catch (err) {
    console.warn("[newsletter/service] Brevo contact sync soft-failed:", err);
  }

  try {
    const admin2 = createAdminSupabase();
    await admin2.from("notification_delivery_log").insert({
      user_id: subscriber.userId ?? "00000000-0000-0000-0000-000000000000",
      channel: "email",
      provider: "internal",
      status: "subscriber_captured",
      division: subscriber.sourceDivision,
      category: "newsletter",
      event_name: NEWSLETTER_EVENT_NAMES.SUBSCRIBER_CREATED,
      metadata: {
        subscriber_id: subscriber.id,
        topics: value.topicKeys,
        created,
      },
    });
  } catch {
    // delivery log is non-critical for subscription capture
  }

  return {
    ok: true,
    subscriber,
    topicKeys: value.topicKeys,
    preferenceUrl,
    created,
  };
}

export type LoadPreferencesResult =
  | {
      ok: true;
      subscriber: NewsletterSubscriber;
      topicKeys: string[];
    }
  | {
      ok: false;
      code: "invalid_token" | "expired_token" | "not_found";
      message: string;
    };

export async function loadPreferencesByToken(token: string): Promise<LoadPreferencesResult> {
  let secret: string;
  try {
    secret = getPreferenceSecret();
  } catch {
    return {
      ok: false,
      code: "invalid_token",
      message:
        "Preference links are not configured on this environment. Contact support to unsubscribe.",
    };
  }
  const verified = verifyPreferenceToken({ secret, token });
  if (!verified.ok) {
    return {
      ok: false,
      code: verified.reason === "expired" ? "expired_token" : "invalid_token",
      message:
        verified.reason === "expired"
          ? "Your preferences link has expired. Request a new one."
          : "This preferences link is not valid. Request a new one.",
    };
  }
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from(NEWSLETTER_SUBSCRIBERS_TABLE)
    .select("*")
    .eq("id", verified.payload.sid)
    .maybeSingle<SubscriberRow>();
  if (error) {
    return { ok: false, code: "not_found", message: "Subscriber lookup failed" };
  }
  if (!data) return { ok: false, code: "not_found", message: "Subscriber not found" };
  if (data.email.toLowerCase() !== verified.payload.e.toLowerCase()) {
    return { ok: false, code: "invalid_token", message: "Token does not match subscriber" };
  }

  const topicsRes = await admin
    .from(NEWSLETTER_SUBSCRIBER_TOPICS_TABLE)
    .select("topic_key, opted_out_at")
    .eq("subscriber_id", data.id);

  const topicKeys: string[] = [];
  if (topicsRes.data) {
    for (const row of topicsRes.data as Array<{ topic_key: string; opted_out_at: string | null }>) {
      if (!row.opted_out_at) topicKeys.push(row.topic_key);
    }
  }

  return { ok: true, subscriber: rowToSubscriber(data), topicKeys };
}

export type UpdatePreferencesInput = {
  token: string;
  topicKeys: string[];
  pause?: boolean;
  locale?: string | null;
  country?: string | null;
};

export type UpdatePreferencesResult =
  | { ok: true; subscriber: NewsletterSubscriber; topicKeys: string[] }
  | { ok: false; code: "invalid_token" | "storage_error"; message: string };

export async function updatePreferences(
  input: UpdatePreferencesInput
): Promise<UpdatePreferencesResult> {
  const load = await loadPreferencesByToken(input.token);
  if (!load.ok) {
    return { ok: false, code: "invalid_token", message: load.message };
  }
  const admin = createAdminSupabase();
  const topicSet = new Set(
    input.topicKeys.filter((k) => typeof k === "string" && ALLOWED_TOPIC_KEYS.has(k))
  );
  const now = new Date().toISOString();

  const nextStatus: NewsletterSubscriberStatus =
    topicSet.size === 0 && input.pause !== true
      ? "unsubscribed"
      : input.pause
      ? "paused"
      : "active";

  const update = await admin
    .from(NEWSLETTER_SUBSCRIBERS_TABLE)
    .update({
      status: nextStatus,
      unsubscribed_at: nextStatus === "unsubscribed" ? now : null,
      locale: input.locale ?? load.subscriber.locale,
      country: input.country ?? load.subscriber.country,
    })
    .eq("id", load.subscriber.id)
    .select("*")
    .maybeSingle<SubscriberRow>();

  if (update.error || !update.data) {
    return { ok: false, code: "storage_error", message: "Preferences update failed" };
  }

  const current = await admin
    .from(NEWSLETTER_SUBSCRIBER_TOPICS_TABLE)
    .select("topic_key, opted_in_at, opted_out_at")
    .eq("subscriber_id", load.subscriber.id);
  const currentKeys = new Set(
    (current.data ?? []).map((row: { topic_key: string }) => row.topic_key)
  );

  const upserts: Array<{
    subscriber_id: string;
    topic_key: string;
    opted_in_at: string | null;
    opted_out_at: string | null;
  }> = [];
  for (const key of topicSet) {
    upserts.push({
      subscriber_id: load.subscriber.id,
      topic_key: key,
      opted_in_at: now,
      opted_out_at: null,
    });
  }
  for (const key of currentKeys) {
    if (!topicSet.has(key)) {
      upserts.push({
        subscriber_id: load.subscriber.id,
        topic_key: key,
        opted_in_at: null,
        opted_out_at: now,
      });
    }
  }
  if (upserts.length > 0) {
    await admin
      .from(NEWSLETTER_SUBSCRIBER_TOPICS_TABLE)
      .upsert(upserts, { onConflict: "subscriber_id,topic_key" });
  }

  if (nextStatus === "unsubscribed") {
    try {
      const brevoConfig = resolveBrevoConfig();
      if (isBrevoEnabled(brevoConfig)) {
        await brevoRemoveContactFromLists(brevoConfig, { email: load.subscriber.email });
      }
    } catch (err) {
      console.warn("[newsletter/service] Brevo list remove soft-failed:", err);
    }
    await recordSuppression({
      email: load.subscriber.email,
      reason: "unsubscribed",
      scope: "marketing",
      note: "User unsubscribed from preferences center",
    });
  }

  return {
    ok: true,
    subscriber: rowToSubscriber(update.data),
    topicKeys: Array.from(topicSet),
  };
}

export type RecordSuppressionInput = {
  email: string;
  reason: NewsletterSuppressionReason;
  scope: NewsletterSuppressionScope;
  division?: string | null;
  note?: string | null;
  recordedBy?: string | null;
  expiresAt?: string | null;
};

export async function recordSuppression(input: RecordSuppressionInput): Promise<{
  ok: boolean;
  error?: string;
}> {
  const email = normalizeEmail(input.email);
  if (!email) return { ok: false, error: "invalid_email" };
  const admin = createAdminSupabase();
  const { error } = await admin.from(NEWSLETTER_SUPPRESSION_TABLE).upsert(
    {
      email,
      reason: input.reason,
      scope: input.scope,
      division: input.division ?? null,
      note: input.note ?? null,
      recorded_by: input.recordedBy ?? null,
      expires_at: input.expiresAt ?? null,
    },
    { onConflict: "email,reason,scope" }
  );
  if (error) {
    console.error("[newsletter/service] suppression upsert failed:", error);
    return { ok: false, error: error.message };
  }
  if (input.reason === "hard_bounce" || input.reason === "spam_complaint") {
    try {
      const brevoConfig = resolveBrevoConfig();
      if (isBrevoEnabled(brevoConfig)) {
        await brevoBlocklistContact(brevoConfig, email);
      }
    } catch (err) {
      console.warn("[newsletter/service] Brevo blocklist soft-failed:", err);
    }
  }
  return { ok: true };
}

export type UnsubscribeByTokenResult =
  | { ok: true; email: string }
  | { ok: false; code: "invalid_token" | "storage_error"; message: string };

export async function unsubscribeByToken(token: string): Promise<UnsubscribeByTokenResult> {
  const load = await loadPreferencesByToken(token);
  if (!load.ok) {
    return { ok: false, code: "invalid_token", message: load.message };
  }
  const admin = createAdminSupabase();
  const now = new Date().toISOString();
  const update = await admin
    .from(NEWSLETTER_SUBSCRIBERS_TABLE)
    .update({ status: "unsubscribed", unsubscribed_at: now })
    .eq("id", load.subscriber.id)
    .select("email")
    .maybeSingle<{ email: string }>();
  if (update.error || !update.data) {
    return { ok: false, code: "storage_error", message: "Unsubscribe failed" };
  }
  await admin
    .from(NEWSLETTER_SUBSCRIBER_TOPICS_TABLE)
    .update({ opted_out_at: now, opted_in_at: null })
    .eq("subscriber_id", load.subscriber.id);
  await recordSuppression({
    email: update.data.email,
    reason: "unsubscribed",
    scope: "marketing",
    note: "One-click unsubscribe",
  });
  return { ok: true, email: update.data.email };
}

export type SendTestDraftInput = {
  to: string;
  content: NewsletterCampaignContent;
  campaignId: string;
  campaignClass: NewsletterCampaignClass;
  actorId?: string | null;
};

export type SendTestDraftResult =
  | { ok: true; provider: string; messageId: string }
  | { ok: false; reason: string };

export async function sendTestDraft(input: SendTestDraftInput): Promise<SendTestDraftResult> {
  const email = normalizeEmail(input.to);
  if (!email) return { ok: false, reason: "invalid_email" };

  const voice = runVoiceGuard({ content: input.content, campaignClass: input.campaignClass });
  if (voice.blocks.length > 0) {
    return {
      ok: false,
      reason: `voice_guard_blocks:${voice.blocks.map((b) => b.ruleKey).join(",")}`,
    };
  }

  const html = renderDraftAsHtml(input.content)
    .replace("{{preferences_url}}", `${getHubPublicBase()}/newsletter/preferences`)
    .replace("{{unsubscribe_url}}", `${getHubPublicBase()}/newsletter/unsubscribe`);

  const brevoConfig = resolveBrevoConfig();
  if (!isBrevoEnabled(brevoConfig)) {
    const admin = createAdminSupabase();
    await admin.from(NEWSLETTER_EDITORIAL_EVENTS_TABLE).insert({
      campaign_id: input.campaignId,
      actor_id: input.actorId ?? null,
      kind: "test_sent",
      note: "Brevo disabled — test send simulated",
      payload: { to: email, provider: "disabled" },
    });
    return { ok: false, reason: "brevo_not_configured" };
  }
  const result = await brevoSendTransactional(brevoConfig, {
    to: email,
    subject: `[TEST] ${input.content.subject}`,
    html,
    tags: ["newsletter-test"],
  });
  const admin = createAdminSupabase();
  await admin.from(NEWSLETTER_EDITORIAL_EVENTS_TABLE).insert({
    campaign_id: input.campaignId,
    actor_id: input.actorId ?? null,
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

export type ListCampaignsRow = {
  id: string;
  key: string;
  status: string;
  campaign_class: string;
  division: string;
  scheduled_for: string | null;
  send_started_at: string | null;
  send_completed_at: string | null;
  updated_at: string;
  voice_guard_score: number | null;
  metrics: Record<string, unknown>;
  content: NewsletterCampaignContent;
};

export async function listCampaigns(limit = 30): Promise<ListCampaignsRow[]> {
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from(NEWSLETTER_CAMPAIGNS_TABLE)
    .select(
      "id, key, status, campaign_class, division, scheduled_for, send_started_at, send_completed_at, updated_at, voice_guard_score, metrics, content"
    )
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[newsletter/service] listCampaigns failed:", error);
    return [];
  }
  return (data ?? []) as ListCampaignsRow[];
}

export async function recordEditorialEvent(input: {
  campaignId: string;
  actorId?: string | null;
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
  const admin = createAdminSupabase();
  await admin.from(NEWSLETTER_EDITORIAL_EVENTS_TABLE).insert({
    campaign_id: input.campaignId,
    actor_id: input.actorId ?? null,
    kind: input.kind,
    note: input.note ?? null,
    payload: input.payload ?? {},
  });
}

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
  const admin = createAdminSupabase();
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
    content: NewsletterCampaignContent;
    topic_keys: string[];
    division: string;
    voice_guard_score: number | null;
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

  const voice = runVoiceGuard({
    content: campaign.content,
    campaignClass: campaign.campaign_class,
  });
  if (voice.blocks.length > 0) {
    await admin
      .from(NEWSLETTER_CAMPAIGNS_TABLE)
      .update({ status: "paused", paused_reason: "voice_guard_blocks" })
      .eq("id", campaign.id);
    await recordEditorialEvent({
      campaignId: campaign.id,
      actorId: input.actorId,
      kind: "voice_guard_triggered",
      note: "Voice guard blocked send",
      payload: { blocks: voice.blocks },
    });
    return {
      ok: false,
      attempted: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      notes: ["voice_guard_blocked"],
    };
  }

  await admin
    .from(NEWSLETTER_CAMPAIGNS_TABLE)
    .update({ status: "sending", send_started_at: new Date().toISOString() })
    .eq("id", campaign.id);

  await recordEditorialEvent({
    campaignId: campaign.id,
    actorId: input.actorId,
    kind: "send_started",
    note: "Send run started",
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
    return {
      ok: true,
      attempted: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      notes: ["no_matching_subscribers"],
    };
  }

  const subscribersRes = await admin
    .from(NEWSLETTER_SUBSCRIBERS_TABLE)
    .select("*")
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
    const subscriber = rowToSubscriber(row);

    const scope = suppressionEntries
      .filter((e) => e.email.toLowerCase() === subscriber.email.toLowerCase())
      .find((e) => {
        if (e.scope === "transactional_only") return false;
        if (e.expires_at) {
          const exp = Date.parse(e.expires_at);
          if (!Number.isNaN(exp) && exp <= Date.now()) return false;
        }
        return true;
      });

    if (scope || subscriber.status !== "active" || subscriber.hardBounceCount >= 2) {
      skipped++;
      await admin.from(NEWSLETTER_CAMPAIGN_SENDS_TABLE).insert({
        campaign_id: campaign.id,
        subscriber_id: subscriber.id,
        email: subscriber.email,
        status: "skipped_suppressed",
        suppression_reason: scope?.reason ?? "manual_optout",
      });
      continue;
    }

    if (input.dryRun) {
      sent++;
      await admin.from(NEWSLETTER_CAMPAIGN_SENDS_TABLE).insert({
        campaign_id: campaign.id,
        subscriber_id: subscriber.id,
        email: subscriber.email,
        status: "queued",
        provider: "dry_run",
      });
      continue;
    }

    if (!brevoReady) {
      failed++;
      await admin.from(NEWSLETTER_CAMPAIGN_SENDS_TABLE).insert({
        campaign_id: campaign.id,
        subscriber_id: subscriber.id,
        email: subscriber.email,
        status: "failed",
        provider: "disabled",
        error_code: "brevo_not_configured",
        error_message: "BREVO_API_KEY not configured",
      });
      notes.push("brevo_not_configured");
      continue;
    }

    const token = buildPreferenceToken({
      secret: getPreferenceSecret(),
      email: subscriber.email,
      subscriberId: subscriber.id,
    });
    const personalizedHtml = html
      .replace("{{preferences_url}}", `${preferencesBase}?token=${encodeURIComponent(token)}`)
      .replace("{{unsubscribe_url}}", `${unsubscribeBase}?token=${encodeURIComponent(token)}`);

    const result = await brevoSendTransactional(brevoConfig, {
      to: subscriber.email,
      subject: campaign.content.subject,
      html: personalizedHtml,
      tags: ["newsletter", campaign.division, ...topicKeys].slice(0, 10),
    });
    if (result.ok) {
      sent++;
      await admin.from(NEWSLETTER_CAMPAIGN_SENDS_TABLE).insert({
        campaign_id: campaign.id,
        subscriber_id: subscriber.id,
        email: subscriber.email,
        status: "sent",
        provider: "brevo",
        provider_message_id: result.messageId,
        sent_at: new Date().toISOString(),
      });
    } else {
      failed++;
      await admin.from(NEWSLETTER_CAMPAIGN_SENDS_TABLE).insert({
        campaign_id: campaign.id,
        subscriber_id: subscriber.id,
        email: subscriber.email,
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
      note: `Send completed — sent=${sent}, skipped=${skipped}, failed=${failed}`,
      payload: { attempted, sent, skipped, failed },
    });
  }

  return { ok: true, attempted, sent, skipped, failed, notes };
}
