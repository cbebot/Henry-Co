import "server-only";

import { getAccountUrl } from "@henryco/config";
import { sendTransactionalEmail } from "@henryco/config/email";
import { createStaffAdminSupabase } from "@/lib/supabase/admin";
import { createStaffSupabaseServer } from "@/lib/supabase/server";
import type { WorkspaceDivision } from "@/lib/types";

type JsonRecord = Record<string, unknown>;
type PostgrestLikeError = {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
};

type SupportThreadRow = {
  id: string;
  user_id: string;
  subject: string | null;
  division: string | null;
  category: string | null;
  status: string | null;
  priority: string | null;
  assigned_to: string | null;
  created_at: string | null;
  updated_at: string | null;
  customer_last_read_at: string | null;
  staff_last_read_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
};

type SupportMessageRow = {
  id: string;
  thread_id: string;
  sender_id: string | null;
  sender_type: string | null;
  body: string | null;
  attachments: unknown;
  is_read: boolean | null;
  created_at: string | null;
  read_at: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string | null;
};

type UserContact = {
  id: string;
  fullName: string | null;
  phone: string | null;
  role: string | null;
  email: string | null;
};

export type StaffSupportMailbox =
  | "active"
  | "unread"
  | "mine"
  | "unassigned"
  | "stale"
  | "archive";

export type StaffSupportFilters = {
  q: string;
  status: string;
  mailbox: StaffSupportMailbox;
  division: string;
};

export type StaffSupportMessage = {
  id: string;
  senderType: "customer" | "agent" | "system";
  body: string;
  createdAt: string | null;
  isRead: boolean;
  readAt: string | null;
  senderLabel: string;
  attachments: Array<{
    name: string;
    url: string | null;
  }>;
};

export type StaffSupportThread = {
  id: string;
  userId: string;
  subject: string;
  division: string | null;
  divisionLabel: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string | null;
  updatedAt: string | null;
  customerLastReadAt: string | null;
  staffLastReadAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  assignedToId: string | null;
  assignedToName: string | null;
  assignedToRole: string | null;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  unreadCount: number;
  isUnread: boolean;
  isStale: boolean;
  needsReply: boolean;
  lastMessagePreview: string;
  lastCustomerActivityAt: string | null;
  lastAgentActivityAt: string | null;
  lastInboundActivityAt: string | null;
  messages: StaffSupportMessage[];
};

export const STAFF_SUPPORT_STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "awaiting_reply", label: "Awaiting reply" },
  { value: "pending_customer", label: "Pending customer" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
] as const;

export const STAFF_SUPPORT_MAILBOX_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "unread", label: "Unread" },
  { value: "mine", label: "Assigned to me" },
  { value: "unassigned", label: "Unassigned" },
  { value: "stale", label: "Stale" },
  { value: "archive", label: "Archive" },
] as const;

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function cleanNullableText(value: unknown) {
  const text = cleanText(value);
  return text || null;
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getErrorText(error: PostgrestLikeError | null | undefined) {
  return [
    typeof error?.message === "string" ? error.message : "",
    typeof error?.details === "string" ? error.details : "",
    typeof error?.hint === "string" ? error.hint : "",
  ]
    .join(" ")
    .trim()
    .toLowerCase();
}

function isMissingPostgrestResourceError(error: PostgrestLikeError | null | undefined) {
  const code = String(error?.code || "").trim().toUpperCase();
  const text = getErrorText(error);

  if (code === "PGRST202" || code === "PGRST205" || code === "42703") {
    return true;
  }

  return (
    text.includes("schema cache") ||
    text.includes("could not find the table") ||
    text.includes("could not find the function") ||
    (text.includes("column") && text.includes("does not exist")) ||
    (text.includes("relation") && text.includes("does not exist"))
  );
}

function firstRpcRow<T>(data: T | T[] | null | undefined) {
  if (Array.isArray(data)) {
    return (data[0] ?? null) as T | null;
  }

  return (data ?? null) as T | null;
}

async function runStaffSupportRpc<T>(
  functionName: string,
  args: Record<string, unknown>,
  fallbackMessage: string
) {
  const supabase = await createStaffSupabaseServer();
  const { data, error } = await supabase.rpc(functionName, args);

  if (error) {
    if (isMissingPostgrestResourceError(error)) {
      return {
        missing: true,
        data: null as T | null,
      };
    }

    throw new Error(error.message || fallbackMessage);
  }

  return {
    missing: false,
    data: firstRpcRow<T>(data as T | T[] | null | undefined),
  };
}

function normalizeDivision(value: unknown) {
  const division = cleanText(value).toLowerCase();
  return division || null;
}

function formatDivisionLabel(value: string | null) {
  if (!value || value === "account") return "Account";
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatStatusLabel(value: string) {
  const normalized = cleanText(value).replaceAll("_", " ");
  if (!normalized) return "Open";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatPriorityLabel(value: string) {
  const normalized = cleanText(value).replaceAll("_", " ");
  if (!normalized) return "Normal";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function isArchiveStatus(status: string) {
  return status === "resolved" || status === "closed";
}

function normalizeSupportedThreadStatus(
  value: unknown,
  fallback: "open" | "awaiting_reply" | "pending_customer" | "in_progress" = "open"
) {
  const normalized = cleanText(value).toLowerCase();
  if (!normalized) return fallback;

  if (
    normalized === "open" ||
    normalized === "awaiting_reply" ||
    normalized === "pending_customer" ||
    normalized === "in_progress" ||
    normalized === "resolved" ||
    normalized === "closed"
  ) {
    return normalized;
  }

  throw new Error(`Unsupported support status "${normalized}".`);
}

function isVisibleToViewer(division: string | null, viewerDivisions: WorkspaceDivision[]) {
  if (!division || division === "account") return true;
  return viewerDivisions.includes(division as WorkspaceDivision);
}

function isStale(value: string | null, thresholdHours = 12) {
  if (!value) return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return true;
  return (Date.now() - date.getTime()) / 36e5 >= thresholdHours;
}

function summarizeBody(value: string | null) {
  const normalized = cleanText(value).replace(/\s+/g, " ");
  if (!normalized) return "No message body yet.";
  return normalized.length > 140 ? `${normalized.slice(0, 137)}...` : normalized;
}

function compareDates(a: string | null, b: string | null) {
  const left = a ? new Date(a).getTime() : 0;
  const right = b ? new Date(b).getTime() : 0;
  return left - right;
}

function mapAttachments(value: unknown) {
  if (!Array.isArray(value)) return [] as StaffSupportMessage["attachments"];
  return value
    .map((entry) => {
      if (!isRecord(entry)) return null;
      const name = cleanText(entry.name) || "Attachment";
      const url = cleanNullableText(entry.url);
      return { name, url };
    })
    .filter(Boolean) as StaffSupportMessage["attachments"];
}

function mapSupportMessage(row: SupportMessageRow, contacts: Map<string, UserContact>): StaffSupportMessage {
  const senderType = cleanText(row.sender_type).toLowerCase();
  const sender =
    row.sender_id && contacts.has(row.sender_id)
      ? contacts.get(row.sender_id) ?? null
      : null;

  return {
    id: row.id,
    senderType:
      senderType === "agent" || senderType === "system" ? (senderType as "agent" | "system") : "customer",
    body: cleanText(row.body) || "No message body.",
    createdAt: cleanNullableText(row.created_at),
    isRead: Boolean(row.is_read),
    readAt: cleanNullableText(row.read_at),
    senderLabel:
      senderType === "agent"
        ? sender?.fullName || sender?.email || "Support"
        : senderType === "system"
          ? "System"
          : sender?.fullName || sender?.email || "Customer",
    attachments: mapAttachments(row.attachments),
  };
}

async function loadUserContacts(userIds: string[]) {
  const ids = [...new Set(userIds.filter(Boolean))];
  const admin = createStaffAdminSupabase();
  const contacts = new Map<string, UserContact>();

  if (ids.length === 0) {
    return contacts;
  }

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, phone, role")
    .in("id", ids);

  for (const row of (profiles ?? []) as ProfileRow[]) {
    contacts.set(row.id, {
      id: row.id,
      fullName: cleanNullableText(row.full_name),
      phone: cleanNullableText(row.phone),
      role: cleanNullableText(row.role),
      email: null,
    });
  }

  await Promise.all(
    ids.map(async (id) => {
      try {
        const { data, error } = await admin.auth.admin.getUserById(id);
        if (error || !data.user) return;
        const existing = contacts.get(id);
        contacts.set(id, {
          id,
          fullName:
            existing?.fullName ||
            cleanNullableText(data.user.user_metadata?.full_name) ||
            cleanNullableText(data.user.user_metadata?.name),
          phone:
            existing?.phone ||
            cleanNullableText(data.user.phone) ||
            cleanNullableText(data.user.user_metadata?.phone),
          role:
            existing?.role ||
            cleanNullableText(data.user.app_metadata?.role) ||
            cleanNullableText(data.user.user_metadata?.role),
          email: cleanNullableText(data.user.email),
        });
      } catch {
        // Missing auth lookup should not block support rendering.
      }
    })
  );

  return contacts;
}

async function loadThreadRows(viewerDivisions: WorkspaceDivision[], limit = 160) {
  const admin = createStaffAdminSupabase();
  let query = admin
    .from("support_threads")
    .select(
      "id, user_id, subject, division, category, status, priority, assigned_to, created_at, updated_at, customer_last_read_at, staff_last_read_at, resolved_at, closed_at"
    )
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (viewerDivisions.length > 0) {
    query = query.or(`division.in.(${viewerDivisions.join(",")}),division.eq.account,division.is.null`);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || "Support threads could not be loaded.");
  }

  return (data ?? []) as SupportThreadRow[];
}

async function loadMessageRows(threadIds: string[]) {
  if (threadIds.length === 0) return [] as SupportMessageRow[];

  const admin = createStaffAdminSupabase();
  const { data, error } = await admin
    .from("support_messages")
    .select("id, thread_id, sender_id, sender_type, body, attachments, is_read, created_at, read_at")
    .in("thread_id", threadIds)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message || "Support messages could not be loaded.");
  }

  return (data ?? []) as SupportMessageRow[];
}

function buildThreadView(
  row: SupportThreadRow,
  messages: SupportMessageRow[],
  contacts: Map<string, UserContact>
) {
  const customer = contacts.get(row.user_id) ?? null;
  const assignee = row.assigned_to ? contacts.get(row.assigned_to) ?? null : null;
  const mappedMessages = messages.map((message) => mapSupportMessage(message, contacts));
  const lastMessage = mappedMessages[mappedMessages.length - 1] ?? null;
  const lastInbound = [...mappedMessages]
    .reverse()
    .find((message) => message.senderType !== "agent") ?? null;
  const lastCustomer = [...mappedMessages]
    .reverse()
    .find((message) => message.senderType === "customer") ?? null;
  const lastAgent = [...mappedMessages]
    .reverse()
    .find((message) => message.senderType === "agent") ?? null;
  const staffLastReadAt = cleanNullableText(row.staff_last_read_at);

  const unreadCount = mappedMessages.filter((message) => {
    if (message.senderType === "agent") return false;
    if (!message.createdAt) return !staffLastReadAt;
    if (!staffLastReadAt) return true;
    return compareDates(message.createdAt, staffLastReadAt) > 0;
  }).length;

  return {
    id: row.id,
    userId: row.user_id,
    subject: cleanText(row.subject) || "Support conversation",
    division: normalizeDivision(row.division),
    divisionLabel: formatDivisionLabel(normalizeDivision(row.division)),
    category: cleanText(row.category) || "general",
    status: cleanText(row.status) || "open",
    priority: cleanText(row.priority) || "normal",
    createdAt: cleanNullableText(row.created_at),
    updatedAt: cleanNullableText(row.updated_at),
    customerLastReadAt: cleanNullableText(row.customer_last_read_at),
    staffLastReadAt,
    resolvedAt: cleanNullableText(row.resolved_at),
    closedAt: cleanNullableText(row.closed_at),
    assignedToId: cleanNullableText(row.assigned_to),
    assignedToName: assignee?.fullName || assignee?.email || null,
    assignedToRole: assignee?.role || null,
    customerName: customer?.fullName || customer?.email || "Customer",
    customerPhone: customer?.phone || null,
    customerEmail: customer?.email || null,
    unreadCount,
    isUnread: unreadCount > 0,
    isStale: isStale(cleanNullableText(row.updated_at)),
    needsReply: lastMessage ? lastMessage.senderType !== "agent" : true,
    lastMessagePreview: summarizeBody(lastMessage?.body || null),
    lastCustomerActivityAt: lastCustomer?.createdAt || null,
    lastAgentActivityAt: lastAgent?.createdAt || null,
    lastInboundActivityAt: lastInbound?.createdAt || null,
    messages: mappedMessages,
  } satisfies StaffSupportThread;
}

function matchesStatus(thread: StaffSupportThread, status: string) {
  if (!status || status === "all") return true;
  return thread.status === status;
}

function matchesMailbox(thread: StaffSupportThread, mailbox: StaffSupportMailbox, viewerId: string) {
  if (mailbox === "active") return !isArchiveStatus(thread.status);
  if (mailbox === "archive") return isArchiveStatus(thread.status);
  if (mailbox === "unread") return thread.isUnread && !isArchiveStatus(thread.status);
  if (mailbox === "mine") return thread.assignedToId === viewerId && !isArchiveStatus(thread.status);
  if (mailbox === "unassigned") return !thread.assignedToId && !isArchiveStatus(thread.status);
  if (mailbox === "stale") return thread.isStale && !isArchiveStatus(thread.status);
  return true;
}

function matchesQuery(thread: StaffSupportThread, q: string) {
  if (!q) return true;
  const query = q.toLowerCase();
  return [
    thread.subject,
    thread.customerName,
    thread.customerEmail,
    thread.customerPhone,
    thread.divisionLabel,
    thread.category,
    thread.status,
    thread.priority,
    thread.assignedToName,
    thread.lastMessagePreview,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function matchesDivision(thread: StaffSupportThread, division: string) {
  if (!division || division === "all") return true;
  if (division === "account") {
    return !thread.division || thread.division === "account";
  }
  return thread.division === division;
}

function buildEmailHtml(thread: SupportThreadRow, reply: string) {
  const accountThreadUrl = getAccountUrl(`/support/${thread.id}`);
  const subject = cleanText(thread.subject) || "Support conversation";
  const escapedReply = reply
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br />");

  return {
    subject: `Update on your HenryCo support request: ${subject}`,
    html: `
      <div style="font-family:Inter,Segoe UI,Arial,sans-serif;line-height:1.7;color:#0f172a">
        <p>Hello,</p>
        <p>Our support team has replied to your HenryCo request.</p>
        <div style="margin:20px 0;padding:16px;border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0">
          ${escapedReply}
        </div>
        <p>You can continue the conversation in your account support room:</p>
        <p><a href="${accountThreadUrl}" style="color:#b8860b;font-weight:700;text-decoration:none">Open support thread</a></p>
        <p style="color:#475569">If the link does not open directly, sign in to your HenryCo account and open Support.</p>
      </div>
    `,
  };
}

async function appendSystemMessage(threadId: string, body: string) {
  const admin = createStaffAdminSupabase();
  const { error } = await admin.from("support_messages").insert({
    thread_id: threadId,
    sender_type: "system",
    body,
    attachments: [],
    is_read: false,
    read_at: null,
  } as never);

  if (error) {
    throw new Error(error.message || "System support event could not be written.");
  }
}

async function getThreadRowForViewer(threadId: string, viewerDivisions: WorkspaceDivision[]) {
  const admin = createStaffAdminSupabase();
  const { data, error } = await admin
    .from("support_threads")
    .select(
      "id, user_id, subject, division, category, status, priority, assigned_to, created_at, updated_at, customer_last_read_at, staff_last_read_at, resolved_at, closed_at"
    )
    .eq("id", threadId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Support thread could not be loaded.");
  }

  const row = data as SupportThreadRow | null;
  if (!row || !isVisibleToViewer(normalizeDivision(row.division), viewerDivisions)) {
    throw new Error("Support thread is not available in your workspace.");
  }

  return row;
}

export async function getStaffSupportDeskSnapshot(input: {
  viewerId: string;
  viewerDivisions: WorkspaceDivision[];
  q?: string;
  status?: string;
  mailbox?: string;
  division?: string;
}) {
  const rows = await loadThreadRows(input.viewerDivisions);
  const threadIds = rows.map((row) => row.id);
  const relatedUserIds = rows.flatMap((row) => [row.user_id, row.assigned_to || ""]);
  const [messages, contacts] = await Promise.all([
    loadMessageRows(threadIds),
    loadUserContacts(relatedUserIds),
  ]);

  const messagesByThread = new Map<string, SupportMessageRow[]>();
  for (const message of messages) {
    const threadMessages = messagesByThread.get(message.thread_id) ?? [];
    threadMessages.push(message);
    messagesByThread.set(message.thread_id, threadMessages);
  }

  const threads = rows
    .map((row) => buildThreadView(row, messagesByThread.get(row.id) ?? [], contacts))
    .sort((left, right) => compareDates(right.updatedAt, left.updatedAt));

  const q = cleanText(input.q);
  const status = cleanText(input.status) || "all";
  const mailbox = (cleanText(input.mailbox) || "active") as StaffSupportMailbox;
  const division = cleanText(input.division) || "all";

  const filtered = threads.filter(
    (thread) =>
      matchesStatus(thread, status) &&
      matchesMailbox(thread, mailbox, input.viewerId) &&
      matchesDivision(thread, division) &&
      matchesQuery(thread, q)
  );

  const divisions = [
    { value: "all", label: "All divisions" },
    { value: "account", label: "Account & General" },
    ...[
      ...new Set(
        threads
          .map((thread) => thread.division)
          .filter(Boolean)
          .map((entry) => String(entry))
      ),
    ].map((entry) => ({
      value: entry,
      label: formatDivisionLabel(entry),
    })),
  ];

  return {
    threads: filtered,
    allThreads: threads,
    filters: {
      q,
      status,
      mailbox,
      division,
    } satisfies StaffSupportFilters,
    metrics: {
      active: threads.filter((thread) => !isArchiveStatus(thread.status)).length,
      unread: threads.filter((thread) => thread.isUnread && !isArchiveStatus(thread.status)).length,
      unassigned: threads.filter((thread) => !thread.assignedToId && !isArchiveStatus(thread.status)).length,
      stale: threads.filter((thread) => thread.isStale && !isArchiveStatus(thread.status)).length,
      archived: threads.filter((thread) => isArchiveStatus(thread.status)).length,
    },
    divisions,
  };
}

export async function markSupportThreadViewedForStaff(input: {
  threadId: string;
  viewerId: string;
  viewerDivisions: WorkspaceDivision[];
}) {
  const row = await getThreadRowForViewer(input.threadId, input.viewerDivisions);
  const rpc = await runStaffSupportRpc(
    "staff_mark_support_thread_read",
    { p_thread_id: row.id },
    "Support read state could not be updated."
  );
  if (!rpc.missing) {
    return;
  }

  const admin = createStaffAdminSupabase();
  const now = new Date().toISOString();

  const { error: threadError } = await admin
    .from("support_threads")
    .update({
      staff_last_read_at: now,
      updated_at: cleanNullableText(row.updated_at) || now,
    })
    .eq("id", row.id);

  if (threadError) {
    throw new Error(threadError.message || "Support read state could not be updated.");
  }

  const { error: messageError } = await admin
    .from("support_messages")
    .update({ is_read: true, read_at: now })
    .eq("thread_id", row.id)
    .neq("sender_type", "agent")
    .eq("is_read", false);

  if (messageError) {
    throw new Error(messageError.message || "Support messages could not be marked read.");
  }
}

export async function assignSupportThreadForStaff(input: {
  threadId: string;
  viewerDivisions: WorkspaceDivision[];
  assigneeId: string | null;
}) {
  const row = await getThreadRowForViewer(input.threadId, input.viewerDivisions);
  const rpc = await runStaffSupportRpc(
    "staff_assign_support_thread",
    {
      p_thread_id: row.id,
      p_assignee_user_id: input.assigneeId,
    },
    "Support assignment could not be updated."
  );
  if (!rpc.missing) {
    return;
  }

  const admin = createStaffAdminSupabase();
  const { error } = await admin
    .from("support_threads")
    .update({
      assigned_to: input.assigneeId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  if (error) {
    throw new Error(error.message || "Support assignment could not be updated.");
  }
}

export async function updateSupportThreadPriorityForStaff(input: {
  threadId: string;
  viewerDivisions: WorkspaceDivision[];
  priority: string;
}) {
  const row = await getThreadRowForViewer(input.threadId, input.viewerDivisions);
  const nextPriority = cleanText(input.priority) || "normal";
  const rpc = await runStaffSupportRpc(
    "staff_update_support_thread_priority",
    {
      p_thread_id: row.id,
      p_priority: nextPriority,
    },
    "Support priority could not be updated."
  );
  if (!rpc.missing) {
    return;
  }

  const admin = createStaffAdminSupabase();
  const { error } = await admin
    .from("support_threads")
    .update({
      priority: nextPriority,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  if (error) {
    throw new Error(error.message || "Support priority could not be updated.");
  }

  if (nextPriority === "high" || nextPriority === "urgent") {
    await appendSystemMessage(row.id, "Support escalated this request for faster handling.");
  } else {
    await appendSystemMessage(row.id, "Support returned this request to the standard queue.");
  }
}

export async function updateSupportThreadStatusForStaff(input: {
  threadId: string;
  viewerDivisions: WorkspaceDivision[];
  status: string;
}) {
  const row = await getThreadRowForViewer(input.threadId, input.viewerDivisions);
  const nextStatus = normalizeSupportedThreadStatus(input.status, "open");
  const rpc = await runStaffSupportRpc(
    "staff_update_support_thread_status",
    {
      p_thread_id: row.id,
      p_status: nextStatus,
    },
    "Support status could not be updated."
  );
  if (!rpc.missing) {
    return;
  }

  const now = new Date().toISOString();
  const admin = createStaffAdminSupabase();
  const { error } = await admin
    .from("support_threads")
    .update({
      status: nextStatus,
      updated_at: now,
      resolved_at: nextStatus === "resolved" ? now : null,
      closed_at: nextStatus === "closed" ? now : null,
      staff_last_read_at: now,
    })
    .eq("id", row.id);

  if (error) {
    throw new Error(error.message || "Support status could not be updated.");
  }

  if (nextStatus === "resolved") {
    await appendSystemMessage(row.id, "Support marked this thread resolved.");
  } else if (nextStatus === "closed") {
    await appendSystemMessage(row.id, "Support closed this thread.");
  } else if (isArchiveStatus(cleanText(row.status)) && !isArchiveStatus(nextStatus)) {
    await appendSystemMessage(row.id, "Support reopened this thread.");
  } else if (nextStatus === "open" && cleanText(row.status) !== "open") {
    await appendSystemMessage(row.id, "Support returned this thread to active handling.");
  }
}

export async function replyToSupportThreadForStaff(input: {
  threadId: string;
  viewerId: string;
  viewerName: string;
  viewerDivisions: WorkspaceDivision[];
  message: string;
  nextStatus: string;
}) {
  const row = await getThreadRowForViewer(input.threadId, input.viewerDivisions);
  const replyBody = cleanText(input.message);
  if (!replyBody) {
    throw new Error("Write a reply before sending.");
  }
  const nextStatus = normalizeSupportedThreadStatus(input.nextStatus, "pending_customer");
  const rpc = await runStaffSupportRpc<{
    id: string;
    user_id: string;
    division: string | null;
    category: string | null;
    priority: string | null;
    status: string | null;
    subject: string | null;
  }>(
    "staff_reply_support_thread",
    {
      p_thread_id: row.id,
      p_body: replyBody,
      p_next_status: nextStatus,
      p_attachments: [],
    },
    "Support reply could not be sent."
  );

  if (!rpc.missing) {
    const updatedThread = rpc.data ?? {
      id: row.id,
      user_id: row.user_id,
      division: row.division,
      category: row.category,
      priority: row.priority,
      status: nextStatus,
      subject: row.subject,
    };
    const customerContacts = await loadUserContacts([updatedThread.user_id]);
    const customer = customerContacts.get(updatedThread.user_id) ?? null;
    const customerEmail = customer?.email || null;

    let emailStatus: "sent" | "queued" | "skipped" | "failed" = "skipped";
    let emailReason: string | null = "Customer email is not available on this thread.";

    if (customerEmail) {
      const emailTemplate = buildEmailHtml(
        {
          ...row,
          subject: updatedThread.subject,
          division: updatedThread.division,
          category: updatedThread.category,
          priority: updatedThread.priority,
          status: updatedThread.status,
        },
        replyBody
      );
      const email = await sendTransactionalEmail({
        to: customerEmail,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        fromName: "HenryCo Support",
        missingConfigStatus: "queued",
        tags: ["support", normalizeDivision(updatedThread.division) || "account"],
      });
      emailStatus = email.status;
      emailReason = email.reason;
    }

    return {
      emailStatus,
      emailReason,
      statusLabel: formatStatusLabel(cleanText(updatedThread.status) || nextStatus),
      priorityLabel: formatPriorityLabel(cleanText(updatedThread.priority) || "normal"),
    };
  }

  const now = new Date().toISOString();
  const admin = createStaffAdminSupabase();
  const { error: messageError } = await admin.from("support_messages").insert({
    thread_id: row.id,
    sender_id: input.viewerId,
    sender_type: "agent",
    body: replyBody,
    attachments: [],
    is_read: false,
    read_at: null,
  } as never);

  if (messageError) {
    throw new Error(messageError.message || "Support reply could not be written.");
  }

  const { error: threadError } = await admin
    .from("support_threads")
    .update({
      status: nextStatus,
      assigned_to: input.viewerId,
      updated_at: now,
      staff_last_read_at: now,
      resolved_at: nextStatus === "resolved" ? now : null,
      closed_at: nextStatus === "closed" ? now : null,
    })
    .eq("id", row.id);

  if (threadError) {
    throw new Error(threadError.message || "Support thread state could not be updated.");
  }

  await admin.from("customer_notifications").insert({
    user_id: row.user_id,
    division: normalizeDivision(row.division) || "account",
    title: "Support replied",
    body: summarizeBody(replyBody),
    category: "support",
    priority: nextStatus === "resolved" || nextStatus === "closed" ? "normal" : "high",
    action_url: `/support/${row.id}`,
    reference_type: "support_thread",
    reference_id: row.id,
    is_read: false,
    read_at: null,
  } as never);

  await admin.from("customer_activity").insert({
    user_id: row.user_id,
    division: normalizeDivision(row.division) || "account",
    activity_type: "support_replied",
    title: `Support replied: ${cleanText(row.subject) || "Support conversation"}`,
    description: summarizeBody(replyBody),
    status: nextStatus,
    reference_type: "support_thread",
    reference_id: row.id,
    action_url: `/support/${row.id}`,
    metadata: {
      actor_name: input.viewerName,
    },
  } as never);

  const customerContacts = await loadUserContacts([row.user_id]);
  const customer = customerContacts.get(row.user_id) ?? null;
  const customerEmail = customer?.email || null;

  let emailStatus: "sent" | "queued" | "skipped" | "failed" = "skipped";
  let emailReason: string | null = "Customer email is not available on this thread.";

  if (customerEmail) {
    const emailTemplate = buildEmailHtml(row, replyBody);
    const email = await sendTransactionalEmail({
      to: customerEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      fromName: "HenryCo Support",
      missingConfigStatus: "queued",
      tags: ["support", normalizeDivision(row.division) || "account"],
    });
    emailStatus = email.status;
    emailReason = email.reason;
  }

  return {
    emailStatus,
    emailReason,
    statusLabel: formatStatusLabel(nextStatus),
    priorityLabel: formatPriorityLabel(cleanText(row.priority) || "normal"),
  };
}
