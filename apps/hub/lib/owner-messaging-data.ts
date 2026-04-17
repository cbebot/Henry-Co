import "server-only";

import { COMPANY, getDivisionUrl } from "@henryco/config";
import { getOptionalEnv, normalizeEmail } from "@/lib/env";
import { createAdminSupabase } from "@/lib/supabase";

type JsonRecord = Record<string, unknown>;

type SupportThreadSnapshot = {
  threadId: string;
  threadRef: string | null;
  subject: string | null;
  status: string | null;
  assignedToName: string | null;
  assignedToRole: string | null;
  lastActivityAt: string | null;
  lastCustomerActivityAt: string | null;
  lastSupportReplyAt: string | null;
  replyCount: number;
};

type InboundEmailLog = {
  inboundEmailId: string;
  providerMessageId: string | null;
  subject: string;
  senderEmail: string | null;
  senderName: string | null;
  mailbox: string | null;
  recipients: string[];
  cc: string[];
  bcc: string[];
  preview: string | null;
  fetchReason: string | null;
  attachmentCount: number;
  receivedAt: string | null;
  capturedAt: string | null;
  threadId: string | null;
  threadRef: string | null;
  eventType: string;
};

type ProviderIncomingEmail = {
  id: string;
  to: string[];
  from: string;
  created_at: string | null;
  subject: string | null;
  bcc: string[];
  cc: string[];
  reply_to: string[];
  message_id: string | null;
  attachments: unknown[];
};

export type OwnerInboxItem = {
  id: string;
  source: "provider+log" | "provider_only" | "logged_history";
  subject: string;
  senderEmail: string | null;
  senderName: string | null;
  mailbox: string | null;
  recipients: string[];
  cc: string[];
  bcc: string[];
  receivedAt: string | null;
  capturedAt: string | null;
  preview: string | null;
  attachmentCount: number;
  fetchReason: string | null;
  inboundEmailId: string | null;
  providerMessageId: string | null;
  threadId: string | null;
  threadRef: string | null;
  threadStatus: string | null;
  assignedToName: string | null;
  assignedToRole: string | null;
  replyCount: number;
  lastActivityAt: string | null;
  lastCustomerActivityAt: string | null;
  lastSupportReplyAt: string | null;
  attentionState: "needs_triage" | "unassigned" | "needs_reply" | "monitor" | "resolved";
  attentionLabel: string;
  actionHref: string;
  replyHref: string | null;
};

export type OwnerMailboxCoverage = {
  email: string;
  label: string;
  division: string | null;
  mode: "receiving_live" | "receiving_webhook_only" | "outbound_only" | "declared_only";
  note: string;
  recentCount: number;
  lastReceivedAt: string | null;
};

type InboxCapability = {
  configured: boolean;
  canFetchContent: boolean;
  supportInbox: string | null;
  reason: string;
};

type InboxSyncSummary = {
  lastCompletedAt: string | null;
  lastFailureAt: string | null;
  lastFailureReason: string | null;
  lastProcessedCount: number;
  lastDuplicateCount: number;
  lastIgnoredCount: number;
};

export type OwnerIncomingEmailData = {
  items: OwnerInboxItem[];
  metrics: {
    total: number;
    needsTriage: number;
    needsReply: number;
    unassigned: number;
    resolved: number;
    trackedMailboxes: number;
  };
  coverage: OwnerMailboxCoverage[];
  filters: {
    q: string;
    state: string;
    mailbox: string;
    mailboxes: string[];
  };
  provider: InboxCapability;
  sync: InboxSyncSummary;
  truth: {
    title: string;
    body: string;
  };
};

const SUPPORT_EVENT_TYPES = {
  threadCreated: "support_thread_created",
  threadStatusUpdated: "support_thread_status_updated",
  threadAssigned: "support_thread_assigned",
  replySent: "support_reply_sent",
  noteAdded: "support_note_added",
  customerEmailReceived: "support_customer_email_received",
  inboundSyncCompleted: "support_inbound_sync_completed",
  inboundSyncFailed: "support_inbound_sync_failed",
} as const;

function toText(value: unknown) {
  return String(value ?? "").trim();
}

function toNullableText(value: unknown) {
  const text = toText(value);
  return text || null;
}

function toNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function toStringList(value: unknown) {
  if (!Array.isArray(value)) return [] as string[];
  return value.map((entry) => toText(entry)).filter(Boolean);
}

function looksLikeEmailAddress(value?: string | null) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(String(value || "").trim());
}

function extractMailbox(value: unknown) {
  const raw = toText(value);
  if (!raw) {
    return { email: null as string | null, name: null as string | null };
  }

  const match = raw.match(/^(.*?)(?:<([^<>]+)>)?$/);
  const explicitName = toNullableText(match?.[1]?.replace(/^["']|["']$/g, ""));
  const emailCandidate = toText(match?.[2]) || raw;
  const emailMatch = emailCandidate.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const email = normalizeEmail(emailMatch?.[0] || null);

  return {
    email,
    name: explicitName || (email ? email.split("@")[0]?.replace(/[._-]+/g, " ") || null : null),
  };
}

function resolveSupportInbox() {
  const explicit = normalizeEmail(
    getOptionalEnv("INBOUND_SUPPORT_INBOX") || getOptionalEnv("RESEND_SUPPORT_INBOX")
  );
  if (explicit) return explicit;

  const webhookSecret =
    getOptionalEnv("INBOUND_EMAIL_WEBHOOK_SECRET") || getOptionalEnv("RESEND_WEBHOOK_SECRET");
  return looksLikeEmailAddress(webhookSecret) ? normalizeEmail(webhookSecret) : null;
}

function resolveSendingMailbox() {
  return (
    extractMailbox(getOptionalEnv("BREVO_SENDER_EMAIL")).email ||
    extractMailbox(getOptionalEnv("RESEND_FROM_EMAIL")).email ||
    extractMailbox(getOptionalEnv("RESEND_FROM")).email ||
    null
  );
}

async function probeIncomingMailbox(): Promise<InboxCapability> {
  const apiKey = getOptionalEnv("INBOUND_EMAIL_API_KEY") || getOptionalEnv("RESEND_API_KEY");
  const supportInbox = resolveSupportInbox();
  const rawWebhookSecret =
    getOptionalEnv("INBOUND_EMAIL_WEBHOOK_SECRET") || getOptionalEnv("RESEND_WEBHOOK_SECRET");

  if (!rawWebhookSecret) {
    return {
      configured: false,
      canFetchContent: false,
      supportInbox,
      reason:
        "RESEND_WEBHOOK_SECRET is missing, so inbound company-mail routing cannot be verified from this runtime.",
    };
  }

  if (looksLikeEmailAddress(rawWebhookSecret)) {
    return {
      configured: false,
      canFetchContent: false,
      supportInbox,
      reason:
        "RESEND_WEBHOOK_SECRET currently contains an inbox address instead of the signing secret, so inbound verification is not trustworthy yet.",
    };
  }

  if (!supportInbox) {
    return {
      configured: false,
      canFetchContent: false,
      supportInbox,
      reason:
        "RESEND_SUPPORT_INBOX is not configured, so no live receiving mailbox can be confirmed for the owner inbox.",
    };
  }

  if (!apiKey) {
    return {
      configured: false,
      canFetchContent: false,
      supportInbox,
      reason:
        "RESEND_API_KEY is missing, so provider-side inbound mailbox state cannot be read from this runtime.",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch("https://api.resend.com/emails/receiving?limit=1", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    if (response.ok) {
      return {
        configured: true,
        canFetchContent: true,
        supportInbox,
        reason:
          "Inbound mailbox listing is live, so the owner inbox can reconcile provider traffic against logged support events.",
      };
    }

    const restrictedApiKey = String(payload?.message || "")
      .toLowerCase()
      .includes("restricted_api_key");

    if (restrictedApiKey) {
      return {
        configured: true,
        canFetchContent: false,
        supportInbox,
        reason:
          "Webhook-based receiving is configured, but the current Resend key cannot list mailbox contents yet. Logged history remains available.",
      };
    }

    return {
      configured: false,
      canFetchContent: false,
      supportInbox,
      reason:
        payload?.message ||
        `Resend receiving verification failed with status ${response.status}.`,
    };
  } catch (error) {
    return {
      configured: false,
      canFetchContent: false,
      supportInbox,
      reason:
        error instanceof Error && error.name === "AbortError"
          ? "Inbound mailbox verification timed out from this runtime."
          : error instanceof Error
            ? error.message
            : "Inbound mailbox verification could not be completed.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function listReceivedEmails(limit: number) {
  const apiKey = getOptionalEnv("INBOUND_EMAIL_API_KEY") || getOptionalEnv("RESEND_API_KEY");
  if (!apiKey) return [] as ProviderIncomingEmail[];

  const response = await fetch(
    `https://api.resend.com/emails/receiving?limit=${Math.max(1, Math.min(limit, 100))}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    }
  );

  const payload = (await response.json().catch(() => null)) as
    | { data?: ProviderIncomingEmail[]; message?: string }
    | null;

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        `Resend receiving list request failed with status ${response.status}.`
    );
  }

  return Array.isArray(payload?.data) ? payload.data : [];
}

async function fetchCareSupportLogs(limit = 800) {
  try {
    const admin = createAdminSupabase();
    const { data, error } = await admin
      .from("care_security_logs")
      .select("id, event_type, details, created_at, success")
      .in("event_type", [
        SUPPORT_EVENT_TYPES.threadCreated,
        SUPPORT_EVENT_TYPES.threadStatusUpdated,
        SUPPORT_EVENT_TYPES.threadAssigned,
        SUPPORT_EVENT_TYPES.replySent,
        SUPPORT_EVENT_TYPES.noteAdded,
        SUPPORT_EVENT_TYPES.customerEmailReceived,
        SUPPORT_EVENT_TYPES.inboundSyncCompleted,
        SUPPORT_EVENT_TYPES.inboundSyncFailed,
      ])
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return [] as JsonRecord[];
    return ((data ?? []) as unknown[]) as JsonRecord[];
  } catch {
    return [] as JsonRecord[];
  }
}

function getOrCreateThreadSnapshot(
  snapshots: Map<string, SupportThreadSnapshot>,
  threadId: string
) {
  const existing = snapshots.get(threadId);
  if (existing) return existing;

  const created: SupportThreadSnapshot = {
    threadId,
    threadRef: null,
    subject: null,
    status: null,
    assignedToName: null,
    assignedToRole: null,
    lastActivityAt: null,
    lastCustomerActivityAt: null,
    lastSupportReplyAt: null,
    replyCount: 0,
  };
  snapshots.set(threadId, created);
  return created;
}

function pickTrackedMailbox(
  candidates: string[],
  trackedEmails: Set<string>,
  fallbackInbox: string | null
) {
  for (const candidate of candidates) {
    const email = extractMailbox(candidate).email;
    if (email && trackedEmails.has(email)) return email;
  }

  return fallbackInbox;
}

function buildSupportTelemetry(
  logRows: JsonRecord[],
  trackedEmails: Set<string>,
  fallbackInbox: string | null
) {
  const threadSnapshots = new Map<string, SupportThreadSnapshot>();
  const inboundLogs = new Map<string, InboundEmailLog>();
  const syncSummary: InboxSyncSummary = {
    lastCompletedAt: null,
    lastFailureAt: null,
    lastFailureReason: null,
    lastProcessedCount: 0,
    lastDuplicateCount: 0,
    lastIgnoredCount: 0,
  };

  const ordered = [...logRows].sort((left, right) => {
    return new Date(toText(left.created_at)).getTime() - new Date(toText(right.created_at)).getTime();
  });

  for (const row of ordered) {
    const eventType = toText(row.event_type);
    const createdAt = toNullableText(row.created_at);
    const details = asRecord(row.details);
    const threadId = toNullableText(details?.thread_id);

    if (eventType === SUPPORT_EVENT_TYPES.inboundSyncCompleted) {
      syncSummary.lastCompletedAt = createdAt;
      syncSummary.lastProcessedCount = toNumber(details?.processed);
      syncSummary.lastDuplicateCount = toNumber(details?.duplicates);
      syncSummary.lastIgnoredCount = toNumber(details?.ignored);
      continue;
    }

    if (eventType === SUPPORT_EVENT_TYPES.inboundSyncFailed) {
      syncSummary.lastFailureAt = createdAt;
      syncSummary.lastFailureReason = toNullableText(details?.reason);
      continue;
    }

    if (threadId) {
      const snapshot = getOrCreateThreadSnapshot(threadSnapshots, threadId);
      snapshot.threadRef = toNullableText(details?.thread_ref) || snapshot.threadRef;
      snapshot.subject = toNullableText(details?.subject) || snapshot.subject;
      snapshot.lastActivityAt = createdAt || snapshot.lastActivityAt;

      if (eventType === SUPPORT_EVENT_TYPES.threadCreated) {
        snapshot.status = toNullableText(details?.status) || snapshot.status || "open";
        snapshot.lastCustomerActivityAt = createdAt || snapshot.lastCustomerActivityAt;
      }
      if (eventType === SUPPORT_EVENT_TYPES.customerEmailReceived) {
        snapshot.lastCustomerActivityAt = createdAt || snapshot.lastCustomerActivityAt;
      }
      if (eventType === SUPPORT_EVENT_TYPES.threadStatusUpdated) {
        snapshot.status = toNullableText(details?.status) || snapshot.status;
      }
      if (eventType === SUPPORT_EVENT_TYPES.threadAssigned) {
        snapshot.assignedToName = toNullableText(details?.assigned_to_name);
        snapshot.assignedToRole = toNullableText(details?.assigned_to_role);
      }
      if (eventType === SUPPORT_EVENT_TYPES.replySent) {
        snapshot.replyCount += 1;
        snapshot.lastSupportReplyAt = createdAt || snapshot.lastSupportReplyAt;
      }
    }

    const inboundEmailId = toNullableText(details?.inbound_email_id);
    if (!inboundEmailId) continue;

    const recipients = toStringList(details?.to);
    const cc = toStringList(details?.cc);
    const bcc = toStringList(details?.bcc);
    const existing = inboundLogs.get(inboundEmailId);
    const mailbox =
      pickTrackedMailbox([...recipients, ...cc, ...bcc], trackedEmails, fallbackInbox) ||
      existing?.mailbox ||
      null;

    inboundLogs.set(inboundEmailId, {
      inboundEmailId,
      providerMessageId: toNullableText(details?.inbound_message_id) || existing?.providerMessageId || null,
      subject: toText(details?.subject) || existing?.subject || "Inbound email",
      senderEmail: toNullableText(details?.customer_email) || existing?.senderEmail || null,
      senderName:
        toNullableText(details?.customer_name) ||
        toNullableText(details?.full_name) ||
        existing?.senderName ||
        null,
      mailbox,
      recipients: recipients.length ? recipients : existing?.recipients || [],
      cc: cc.length ? cc : existing?.cc || [],
      bcc: bcc.length ? bcc : existing?.bcc || [],
      preview:
        toNullableText(details?.preview) ||
        toNullableText(details?.message) ||
        existing?.preview ||
        null,
      fetchReason: toNullableText(details?.fetch_reason) || existing?.fetchReason || null,
      attachmentCount: toNumber(details?.attachment_count) || existing?.attachmentCount || 0,
      receivedAt: toNullableText(details?.received_at) || existing?.receivedAt || createdAt,
      capturedAt: createdAt || existing?.capturedAt || null,
      threadId: threadId || existing?.threadId || null,
      threadRef: toNullableText(details?.thread_ref) || existing?.threadRef || null,
      eventType,
    });
  }

  return { threadSnapshots, inboundLogs, syncSummary };
}

function deriveAttentionState(
  thread: SupportThreadSnapshot | null
): Pick<OwnerInboxItem, "attentionState" | "attentionLabel"> {
  if (!thread) {
    return { attentionState: "needs_triage", attentionLabel: "Needs triage" };
  }

  if (thread.status === "resolved") {
    return { attentionState: "resolved", attentionLabel: "Resolved" };
  }

  if (!thread.assignedToName) {
    return { attentionState: "unassigned", attentionLabel: "Needs owner routing" };
  }

  if (
    thread.lastCustomerActivityAt &&
    (!thread.lastSupportReplyAt ||
      new Date(thread.lastCustomerActivityAt).getTime() >
        new Date(thread.lastSupportReplyAt).getTime())
  ) {
    return { attentionState: "needs_reply", attentionLabel: "Customer waiting" };
  }

  return { attentionState: "monitor", attentionLabel: "Under control" };
}

function buildCompanyMailboxCatalog(
  supportInbox: string | null,
  sendingMailbox: string | null,
  items: OwnerInboxItem[],
  provider: InboxCapability
) {
  const seen = new Set<string>();
  const declared = [
    {
      email: normalizeEmail(COMPANY.group.supportEmail),
      label: "Group support",
      division: null,
    },
    ...Object.values(COMPANY.divisions).map((division) => ({
      email: normalizeEmail(division.supportEmail),
      label: `${division.shortName} support`,
      division: division.key,
    })),
    { email: supportInbox, label: "Inbound routing inbox", division: "care" },
    { email: sendingMailbox, label: "Primary sending mailbox", division: null },
  ].filter((entry): entry is { email: string; label: string; division: string | null } => Boolean(entry.email));

  return declared
    .filter((entry) => {
      if (seen.has(entry.email)) return false;
      seen.add(entry.email);
      return true;
    })
    .map((entry) => {
      const matches = items.filter((item) => item.mailbox === entry.email);
      let mode: OwnerMailboxCoverage["mode"] = "declared_only";
      let note =
        "This address is declared in HenryCo configuration, but no live receiving rail has been confirmed from this runtime yet.";

      if (entry.email === supportInbox && provider.configured && provider.canFetchContent) {
        mode = "receiving_live";
        note =
          "Live inbound receiving is verified for this mailbox. Provider traffic and support-thread history can be reconciled here.";
      } else if (entry.email === supportInbox && provider.configured) {
        mode = "receiving_webhook_only";
        note =
          "Webhook receiving is configured, but mailbox listing is limited from this runtime. Logged support history is still available.";
      } else if (entry.email === sendingMailbox) {
        mode = "outbound_only";
        note =
          "This mailbox is configured for outbound sending from HenryCo surfaces, but live receiving is not confirmed here.";
      }

      return {
        email: entry.email,
        label: entry.label,
        division: entry.division,
        mode,
        note,
        recentCount: matches.length,
        lastReceivedAt: matches[0]?.receivedAt || null,
      } satisfies OwnerMailboxCoverage;
    })
    .sort((left, right) => {
      return (
        new Date(right.lastReceivedAt || 0).getTime() -
        new Date(left.lastReceivedAt || 0).getTime()
      );
    });
}

function buildTruthNote(provider: InboxCapability, coverage: OwnerMailboxCoverage[]) {
  const liveMailboxes = coverage.filter((mailbox) => mailbox.mode === "receiving_live");
  const declaredOnly = coverage.filter((mailbox) => mailbox.mode === "declared_only");

  if (liveMailboxes.length > 0) {
    return {
      title: "Receiving truth is explicit",
      body:
        declaredOnly.length > 0
          ? `${liveMailboxes.map((item) => item.email).join(", ")} currently have verified receiving rails. ${declaredOnly.length} other company addresses are declared in configuration but are not being presented as live inboxes here.`
          : `${liveMailboxes.map((item) => item.email).join(", ")} currently have verified receiving rails, and the owner inbox is only surfacing mailboxes with proven support history or provider visibility.`,
    };
  }

  if (provider.configured) {
    return {
      title: "Receiving exists, listing is partial",
      body:
        "Inbound support routing is configured, but this runtime cannot list mailbox contents directly. The owner inbox is falling back to logged support history so you still see real captured email events without faking provider visibility.",
    };
  }

  return {
    title: "Declared addresses are not treated as live inboxes",
    body:
      "HenryCo has multiple support addresses in configuration, but this page only treats a mailbox as live when receiving is verified. Until then, declared addresses stay clearly labeled as declared-only to avoid pretending they are active inboxes.",
  };
}

export async function getOwnerIncomingEmailData(input?: {
  q?: string;
  state?: string;
  mailbox?: string;
  limit?: number;
}) {
  const q = toText(input?.q).toLowerCase();
  const state = toText(input?.state).toLowerCase() || "all";
  const mailbox = normalizeEmail(input?.mailbox || null) || "all";
  const limit = Math.max(20, Math.min(Number(input?.limit) || 60, 120));
  const provider = await probeIncomingMailbox();
  const supportInbox = provider.supportInbox;
  const sendingMailbox = resolveSendingMailbox();
  const trackedEmails = new Set<string>();

  const declaredTracked = [
    COMPANY.group.supportEmail,
    ...Object.values(COMPANY.divisions).map((division) => division.supportEmail),
    supportInbox,
    sendingMailbox,
  ];

  for (const email of declaredTracked) {
    const normalized = normalizeEmail(email || null);
    if (normalized) trackedEmails.add(normalized);
  }

  const logRows = await fetchCareSupportLogs(900);
  const telemetry = buildSupportTelemetry(logRows, trackedEmails, supportInbox);

  let providerItems: ProviderIncomingEmail[] = [];
  if (provider.canFetchContent) {
    try {
      providerItems = await listReceivedEmails(limit);
    } catch {
      providerItems = [];
    }
  }

  const merged = new Map<string, OwnerInboxItem>();

  for (const providerItem of providerItems) {
    const sender = extractMailbox(providerItem.from);
    const providerKey = toText(providerItem.id);
    const logged = telemetry.inboundLogs.get(providerKey);
    const recipients = providerItem.to ?? [];
    const cc = providerItem.cc ?? [];
    const bcc = providerItem.bcc ?? [];
    const mailboxHit =
      pickTrackedMailbox([...recipients, ...cc, ...bcc], trackedEmails, supportInbox) ||
      logged?.mailbox ||
      supportInbox;
    const thread = logged?.threadId ? telemetry.threadSnapshots.get(logged.threadId) || null : null;
    const attention = deriveAttentionState(thread);

    merged.set(providerKey, {
      id: providerKey,
      source: logged ? "provider+log" : "provider_only",
      subject: logged?.subject || toText(providerItem.subject) || "Inbound email",
      senderEmail: logged?.senderEmail || sender.email,
      senderName: logged?.senderName || sender.name,
      mailbox: mailboxHit,
      recipients,
      cc,
      bcc,
      receivedAt: logged?.receivedAt || toNullableText(providerItem.created_at),
      capturedAt: logged?.capturedAt || null,
      preview: logged?.preview || null,
      attachmentCount:
        logged?.attachmentCount || (Array.isArray(providerItem.attachments) ? providerItem.attachments.length : 0),
      fetchReason: logged?.fetchReason || null,
      inboundEmailId: providerKey,
      providerMessageId: logged?.providerMessageId || toNullableText(providerItem.message_id),
      threadId: logged?.threadId || null,
      threadRef: logged?.threadRef || thread?.threadRef || null,
      threadStatus: thread?.status || null,
      assignedToName: thread?.assignedToName || null,
      assignedToRole: thread?.assignedToRole || null,
      replyCount: thread?.replyCount || 0,
      lastActivityAt: thread?.lastActivityAt || logged?.capturedAt || null,
      lastCustomerActivityAt: thread?.lastCustomerActivityAt || null,
      lastSupportReplyAt: thread?.lastSupportReplyAt || null,
      attentionState: attention.attentionState,
      attentionLabel: attention.attentionLabel,
      actionHref: thread?.threadId
        ? `${getDivisionUrl("care")}/support/inbox?thread=${encodeURIComponent(thread.threadId)}`
        : `${getDivisionUrl("care")}/support/inbox`,
      replyHref: thread?.threadId
        ? `${getDivisionUrl("care")}/support/inbox/reply?thread=${encodeURIComponent(thread.threadId)}`
        : null,
    });
  }

  for (const logged of telemetry.inboundLogs.values()) {
    if (merged.has(logged.inboundEmailId)) continue;
    const thread = logged.threadId ? telemetry.threadSnapshots.get(logged.threadId) || null : null;
    const attention = deriveAttentionState(thread);

    merged.set(logged.inboundEmailId, {
      id: logged.inboundEmailId,
      source: "logged_history",
      subject: logged.subject,
      senderEmail: logged.senderEmail,
      senderName: logged.senderName,
      mailbox: logged.mailbox,
      recipients: logged.recipients,
      cc: logged.cc,
      bcc: logged.bcc,
      receivedAt: logged.receivedAt,
      capturedAt: logged.capturedAt,
      preview: logged.preview,
      attachmentCount: logged.attachmentCount,
      fetchReason: logged.fetchReason,
      inboundEmailId: logged.inboundEmailId,
      providerMessageId: logged.providerMessageId,
      threadId: logged.threadId,
      threadRef: logged.threadRef || thread?.threadRef || null,
      threadStatus: thread?.status || null,
      assignedToName: thread?.assignedToName || null,
      assignedToRole: thread?.assignedToRole || null,
      replyCount: thread?.replyCount || 0,
      lastActivityAt: thread?.lastActivityAt || logged.capturedAt,
      lastCustomerActivityAt: thread?.lastCustomerActivityAt || null,
      lastSupportReplyAt: thread?.lastSupportReplyAt || null,
      attentionState: attention.attentionState,
      attentionLabel: attention.attentionLabel,
      actionHref: thread?.threadId
        ? `${getDivisionUrl("care")}/support/inbox?thread=${encodeURIComponent(thread.threadId)}`
        : `${getDivisionUrl("care")}/support/inbox`,
      replyHref: thread?.threadId
        ? `${getDivisionUrl("care")}/support/inbox/reply?thread=${encodeURIComponent(thread.threadId)}`
        : null,
    });
  }

  let items = [...merged.values()].sort((left, right) => {
    return (
      new Date(right.receivedAt || right.capturedAt || 0).getTime() -
      new Date(left.receivedAt || left.capturedAt || 0).getTime()
    );
  });

  if (mailbox !== "all") {
    items = items.filter((item) => item.mailbox === mailbox);
  }

  if (state !== "all") {
    items = items.filter((item) => item.attentionState === state);
  }

  if (q) {
    items = items.filter((item) => {
      const blob = [
        item.subject,
        item.senderEmail,
        item.senderName,
        item.mailbox,
        item.threadRef,
        item.preview,
        item.assignedToName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }

  const limitedItems = items.slice(0, limit);
  const coverage = buildCompanyMailboxCatalog(supportInbox, sendingMailbox, items, provider);

  return {
    items: limitedItems,
    metrics: {
      total: items.length,
      needsTriage: items.filter((item) => item.attentionState === "needs_triage").length,
      needsReply: items.filter((item) => item.attentionState === "needs_reply").length,
      unassigned: items.filter((item) => item.attentionState === "unassigned").length,
      resolved: items.filter((item) => item.attentionState === "resolved").length,
      trackedMailboxes: coverage.length,
    },
    coverage,
    filters: {
      q: input?.q || "",
      state: state || "all",
      mailbox: mailbox || "all",
      mailboxes: coverage.map((entry) => entry.email),
    },
    provider,
    sync: telemetry.syncSummary,
    truth: buildTruthNote(provider, coverage),
  } satisfies OwnerIncomingEmailData;
}
