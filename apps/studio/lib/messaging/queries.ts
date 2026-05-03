/**
 * Studio messaging — server-side data fetching.
 *
 * Every function in this module runs on the server (createSupabaseServer)
 * and returns the spec's typed shapes ready for the UI to render. We
 * never expose raw Supabase row types past the module boundary.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase/server";
import {
  REACTION_EMOJIS,
  THREAD_INITIAL_PAGE_SIZE,
  THREAD_HISTORY_PAGE_SIZE,
} from "./constants";
import type {
  MessageAttachment,
  MessageType,
  ProjectThreadContext,
  ProjectThreadSummary,
  ReadReceipt,
  ReplyPreview,
  SenderRole,
  StudioMessage,
  ThreadInitialState,
} from "./types";
import { classifyAttachment, summariseReactions } from "./utils";

type Sb = SupabaseClient;

type RawMessageRow = {
  id: string;
  project_id: string;
  sender: string | null;
  sender_id: string | null;
  sender_role: string | null;
  body: string | null;
  is_internal: boolean | null;
  message_type: string | null;
  metadata: Record<string, unknown> | null;
  attachments: unknown;
  reply_to_id: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
};

type RawReactionRow = {
  message_id: string;
  user_id: string;
  emoji: string;
};

type RawReceiptRow = {
  message_id: string;
  user_id: string;
  read_at: string;
};

type ViewerContext = {
  userId: string | null;
  displayName: string | null;
  email: string | null;
  role: SenderRole;
};

/**
 * Resolve the current viewer's identity + role. Returns role='client'
 * by default for any authenticated user that is not a studio staff
 * member. Anonymous viewers return userId=null and role='client'.
 */
export async function resolveViewerContext(
  supabase: Sb,
): Promise<ViewerContext> {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user || null;
  if (!user) {
    return { userId: null, displayName: null, email: null, role: "client" };
  }

  const userId = user.id;
  const email = (user.email || "").trim().toLowerCase() || null;
  const displayName =
    extractDisplayName(user.user_metadata, email) || email || "You";

  const { data: staffRow } = await supabase
    .from("studio_role_memberships")
    .select("id")
    .eq("is_active", true)
    .or(
      `user_id.eq.${userId}${email ? `,normalized_email.eq.${email}` : ""}`,
    )
    .limit(1)
    .maybeSingle();

  return {
    userId,
    displayName,
    email,
    role: staffRow ? "team" : "client",
  };
}

function extractDisplayName(
  metadata: Record<string, unknown> | null | undefined,
  fallbackEmail: string | null,
): string | null {
  if (metadata) {
    for (const key of [
      "display_name",
      "name",
      "full_name",
      "given_name",
      "first_name",
    ]) {
      const value = metadata[key];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
  }
  if (!fallbackEmail) return null;
  const local = fallbackEmail.split("@")[0] || "";
  if (!local) return null;
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function normaliseMessageType(value: string | null | undefined): MessageType {
  switch (value) {
    case "text":
    case "file":
    case "milestone_update":
    case "file_share":
    case "payment_update":
    case "approval_request":
    case "system":
      return value;
    default:
      return "text";
  }
}

function normaliseSenderRole(value: string | null | undefined): SenderRole {
  if (value === "team" || value === "system" || value === "client") {
    return value;
  }
  // Legacy rows may have used 'staff'/'studio'.
  if (value === "staff" || value === "studio") return "team";
  return "client";
}

function normaliseAttachments(value: unknown): MessageAttachment[] {
  if (!Array.isArray(value)) return [];
  const out: MessageAttachment[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const obj = raw as Record<string, unknown>;
    const url = typeof obj.url === "string" ? obj.url : null;
    if (!url) continue;
    const label =
      typeof obj.label === "string"
        ? obj.label
        : typeof obj.name === "string"
          ? obj.name
          : "Attachment";
    const id =
      typeof obj.id === "string"
        ? obj.id
        : typeof obj.publicId === "string"
          ? obj.publicId
          : url;
    const mimeType =
      typeof obj.mimeType === "string" ? obj.mimeType : undefined;
    const size = typeof obj.size === "number" ? obj.size : undefined;
    const publicId =
      typeof obj.publicId === "string" ? obj.publicId : undefined;
    const kindCandidate =
      typeof obj.kind === "string" ? obj.kind : undefined;
    const kind: MessageAttachment["kind"] =
      kindCandidate === "image" ||
      kindCandidate === "video" ||
      kindCandidate === "pdf" ||
      kindCandidate === "doc" ||
      kindCandidate === "other"
        ? (kindCandidate as MessageAttachment["kind"])
        : classifyAttachment(mimeType, label);
    out.push({ id, url, label, mimeType, size, publicId, kind });
  }
  return out;
}

function buildReplyPreview(
  parent: RawMessageRow | undefined,
): ReplyPreview | undefined {
  if (!parent) return undefined;
  const senderName = parent.sender || "Studio";
  const role = normaliseSenderRole(parent.sender_role);
  const body = (parent.body || "").trim();
  return {
    id: parent.id,
    senderName,
    senderRole: role,
    bodyExcerpt: body.length <= 60 ? body : `${body.slice(0, 59).trimEnd()}…`,
  };
}

async function loadReactionsAndReceipts(
  supabase: Sb,
  messageIds: string[],
): Promise<{
  reactions: Map<string, RawReactionRow[]>;
  receipts: Map<string, RawReceiptRow[]>;
}> {
  if (messageIds.length === 0) {
    return { reactions: new Map(), receipts: new Map() };
  }

  const [reactionsResult, receiptsResult] = await Promise.all([
    supabase
      .from("studio_message_reactions")
      .select("message_id, user_id, emoji")
      .in("message_id", messageIds),
    supabase
      .from("studio_message_read_receipts")
      .select("message_id, user_id, read_at")
      .in("message_id", messageIds),
  ]);

  const reactions = new Map<string, RawReactionRow[]>();
  if (Array.isArray(reactionsResult.data)) {
    for (const row of reactionsResult.data as RawReactionRow[]) {
      const list = reactions.get(row.message_id) || [];
      list.push(row);
      reactions.set(row.message_id, list);
    }
  }

  const receipts = new Map<string, RawReceiptRow[]>();
  if (Array.isArray(receiptsResult.data)) {
    for (const row of receiptsResult.data as RawReceiptRow[]) {
      const list = receipts.get(row.message_id) || [];
      list.push(row);
      receipts.set(row.message_id, list);
    }
  }

  return { reactions, receipts };
}

async function loadDisplayNames(
  supabase: Sb,
  userIds: string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (userIds.length === 0) return out;
  // We can't always read auth.users from the anon key. Fall back to
  // populating display names from the embedded sender column on the
  // message row (which is what the legacy data layer wrote).
  const { data: leadRows } = await supabase
    .from("studio_leads")
    .select("user_id, customer_name")
    .in("user_id", userIds);
  if (Array.isArray(leadRows)) {
    for (const row of leadRows as Array<{
      user_id: string | null;
      customer_name: string | null;
    }>) {
      if (row.user_id && row.customer_name) {
        out.set(row.user_id, row.customer_name);
      }
    }
  }
  return out;
}

function shapeMessage(
  raw: RawMessageRow,
  options: {
    viewer: ViewerContext;
    rawReactions: RawReactionRow[];
    rawReceipts: RawReceiptRow[];
    parentByReplyId: Map<string, RawMessageRow>;
    displayNames: Map<string, string>;
  },
): StudioMessage {
  const {
    viewer,
    rawReactions,
    rawReceipts,
    parentByReplyId,
    displayNames,
  } = options;

  const messageType = normaliseMessageType(raw.message_type);
  const senderRole = normaliseSenderRole(raw.sender_role);
  const attachments = normaliseAttachments(raw.attachments);
  const reactions = summariseReactions(
    rawReactions.map((r) => ({ emoji: r.emoji, userId: r.user_id })),
    viewer.userId,
    REACTION_EMOJIS,
  );
  const readReceipts: ReadReceipt[] = rawReceipts.map((r) => ({
    userId: r.user_id,
    readAt: r.read_at,
    displayName: displayNames.get(r.user_id) || null,
  }));
  const isOwnMessage = Boolean(
    viewer.userId && raw.sender_id && viewer.userId === raw.sender_id,
  );
  const readByViewer = Boolean(
    viewer.userId && readReceipts.some((r) => r.userId === viewer.userId),
  );

  const senderName =
    (raw.sender_id && displayNames.get(raw.sender_id)) ||
    raw.sender ||
    (senderRole === "team" ? "HenryCo Studio" : "Client");

  return {
    id: raw.id,
    projectId: raw.project_id,
    senderName,
    senderId: raw.sender_id,
    senderRole,
    body: raw.body || "",
    messageType,
    metadata: (raw.metadata && typeof raw.metadata === "object"
      ? raw.metadata
      : {}) as Record<string, unknown>,
    attachments,
    reactions,
    readReceipts,
    reply: raw.reply_to_id
      ? buildReplyPreview(parentByReplyId.get(raw.reply_to_id))
      : undefined,
    createdAt: raw.created_at,
    editedAt: raw.edited_at,
    deletedAt: raw.deleted_at,
    isOwnMessage,
    readByViewer,
  };
}

export async function fetchThreadContext(
  supabase: Sb,
  projectId: string,
): Promise<ProjectThreadContext | null> {
  const projectResult = await supabase
    .from("studio_projects")
    .select("id, title")
    .eq("id", projectId)
    .maybeSingle();
  const project = projectResult.data as
    | { id: string; title: string }
    | null;
  if (!project) return null;

  const [milestonesResult, deliverablesResult, assignmentsResult] =
    await Promise.all([
      supabase
        .from("studio_project_milestones")
        .select("id, name, description, due_label, due_date, status, sort_order")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("studio_deliverables")
        .select(
          "id, label, file_url, file_type, thumbnail_url, shared_at, created_at",
        )
        .eq("project_id", projectId)
        .order("shared_at", { ascending: false, nullsFirst: false })
        .limit(3),
      supabase
        .from("studio_project_assignments")
        .select("id, role, label, team_id, studio_team_profiles(name)")
        .eq("project_id", projectId),
    ]);

  const milestones = Array.isArray(milestonesResult.data)
    ? (milestonesResult.data as Array<{
        id: string;
        name: string;
        description: string | null;
        due_label: string | null;
        due_date: string | null;
        status: string | null;
        sort_order: number | null;
      }>)
    : [];

  const currentMilestone = milestones.find((m) => m.status === "in_progress")
    || milestones.find((m) => m.status === "approved")
    || milestones[0];

  const recentFiles = Array.isArray(deliverablesResult.data)
    ? (deliverablesResult.data as Array<{
        id: string;
        label: string | null;
        file_url: string | null;
        file_type: string | null;
        thumbnail_url: string | null;
        shared_at: string | null;
        created_at: string;
      }>).map((row) => ({
        id: row.id,
        label: row.label || "Untitled file",
        url: row.file_url,
        fileType: row.file_type,
        sharedAt: row.shared_at || row.created_at,
        thumbnailUrl: row.thumbnail_url,
      }))
    : [];

  const team = Array.isArray(assignmentsResult.data)
    ? (
        assignmentsResult.data as Array<{
          id: string;
          role: string;
          label: string | null;
          team_id: string | null;
          studio_team_profiles:
            | { name: string | null }
            | Array<{ name: string | null }>
            | null;
        }>
      ).map((row) => {
        const profile = Array.isArray(row.studio_team_profiles)
          ? row.studio_team_profiles[0] || null
          : row.studio_team_profiles;
        return {
          id: row.id,
          name: profile?.name || row.label || row.role || "Team",
          label: row.role,
          isOnline: false,
        };
      })
    : [];

  return {
    projectId: project.id,
    projectTitle: project.title,
    currentMilestone: currentMilestone
      ? {
          id: currentMilestone.id,
          name: currentMilestone.name,
          status: currentMilestone.status || "planned",
          dueLabel: currentMilestone.due_label || "",
          dueDate: currentMilestone.due_date,
          description: currentMilestone.description || "",
        }
      : undefined,
    recentFiles,
    timeline: milestones.map((m) => ({
      id: m.id,
      name: m.name,
      status: m.status || "planned",
      dueLabel: m.due_label || "",
      dueDate: m.due_date,
      sortOrder: m.sort_order || 0,
    })),
    team,
  };
}

export async function fetchThreadInitialState(
  projectId: string,
  pageSize = THREAD_INITIAL_PAGE_SIZE,
): Promise<ThreadInitialState | null> {
  const supabase = await createSupabaseServer();
  const viewer = await resolveViewerContext(supabase);
  const context = await fetchThreadContext(supabase, projectId);
  if (!context) return null;

  const result = await supabase
    .from("studio_project_messages")
    .select(
      "id, project_id, sender, sender_id, sender_role, body, is_internal, message_type, metadata, attachments, reply_to_id, edited_at, deleted_at, created_at",
    )
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(pageSize + 1);

  const rows = Array.isArray(result.data) ? (result.data as RawMessageRow[]) : [];
  const hasMoreHistory = rows.length > pageSize;
  const pageRows = hasMoreHistory ? rows.slice(0, pageSize) : rows;
  const messageRows = [...pageRows].reverse();

  const messageIds = messageRows.map((m) => m.id);
  const replyTargetIds = Array.from(
    new Set(messageRows.map((m) => m.reply_to_id).filter(Boolean) as string[]),
  );

  const [{ reactions, receipts }, parentResult, displayNames] =
    await Promise.all([
      loadReactionsAndReceipts(supabase, messageIds),
      replyTargetIds.length === 0
        ? Promise.resolve({ data: [] as RawMessageRow[] })
        : supabase
            .from("studio_project_messages")
            .select(
              "id, project_id, sender, sender_id, sender_role, body, is_internal, message_type, metadata, attachments, reply_to_id, edited_at, deleted_at, created_at",
            )
            .in("id", replyTargetIds),
      loadDisplayNames(
        supabase,
        Array.from(
          new Set(
            messageRows
              .map((m) => m.sender_id)
              .filter((v): v is string => Boolean(v)),
          ),
        ),
      ),
    ]);

  const parentByReplyId = new Map<string, RawMessageRow>();
  if (Array.isArray(parentResult.data)) {
    for (const parent of parentResult.data as RawMessageRow[]) {
      parentByReplyId.set(parent.id, parent);
    }
  }

  const messages = messageRows.map((row) =>
    shapeMessage(row, {
      viewer,
      rawReactions: reactions.get(row.id) || [],
      rawReceipts: receipts.get(row.id) || [],
      parentByReplyId,
      displayNames,
    }),
  );

  return {
    context,
    messages,
    hasMoreHistory,
    viewerId: viewer.userId,
    viewerName: viewer.displayName,
    viewerRole: viewer.role,
  };
}

export async function fetchPriorMessages(
  projectId: string,
  beforeIso: string,
  pageSize = THREAD_HISTORY_PAGE_SIZE,
): Promise<{ messages: StudioMessage[]; hasMoreHistory: boolean } | null> {
  const supabase = await createSupabaseServer();
  const viewer = await resolveViewerContext(supabase);

  const result = await supabase
    .from("studio_project_messages")
    .select(
      "id, project_id, sender, sender_id, sender_role, body, is_internal, message_type, metadata, attachments, reply_to_id, edited_at, deleted_at, created_at",
    )
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .lt("created_at", beforeIso)
    .order("created_at", { ascending: false })
    .limit(pageSize + 1);

  const rows = Array.isArray(result.data)
    ? (result.data as RawMessageRow[])
    : [];
  const hasMoreHistory = rows.length > pageSize;
  const pageRows = hasMoreHistory ? rows.slice(0, pageSize) : rows;
  const messageRows = [...pageRows].reverse();

  const messageIds = messageRows.map((m) => m.id);
  const replyTargetIds = Array.from(
    new Set(messageRows.map((m) => m.reply_to_id).filter(Boolean) as string[]),
  );

  const [{ reactions, receipts }, parentResult, displayNames] =
    await Promise.all([
      loadReactionsAndReceipts(supabase, messageIds),
      replyTargetIds.length === 0
        ? Promise.resolve({ data: [] as RawMessageRow[] })
        : supabase
            .from("studio_project_messages")
            .select(
              "id, project_id, sender, sender_id, sender_role, body, is_internal, message_type, metadata, attachments, reply_to_id, edited_at, deleted_at, created_at",
            )
            .in("id", replyTargetIds),
      loadDisplayNames(
        supabase,
        Array.from(
          new Set(
            messageRows
              .map((m) => m.sender_id)
              .filter((v): v is string => Boolean(v)),
          ),
        ),
      ),
    ]);

  const parentByReplyId = new Map<string, RawMessageRow>();
  if (Array.isArray(parentResult.data)) {
    for (const parent of parentResult.data as RawMessageRow[]) {
      parentByReplyId.set(parent.id, parent);
    }
  }

  const messages = messageRows.map((row) =>
    shapeMessage(row, {
      viewer,
      rawReactions: reactions.get(row.id) || [],
      rawReceipts: receipts.get(row.id) || [],
      parentByReplyId,
      displayNames,
    }),
  );

  return { messages, hasMoreHistory };
}

/**
 * Surface 2 — list of project threads for the current viewer with
 * unread counts and last-message preview. We keep the per-project
 * query light: project metadata + last message + unread count.
 */
export async function fetchProjectThreadSummaries(): Promise<
  ProjectThreadSummary[]
> {
  const supabase = await createSupabaseServer();
  const viewer = await resolveViewerContext(supabase);
  if (!viewer.userId) return [];

  const projectsResult = await supabase
    .from("studio_projects")
    .select("id, title, status, normalized_email, client_user_id")
    .order("updated_at", { ascending: false });

  const projects = Array.isArray(projectsResult.data)
    ? (projectsResult.data as Array<{
        id: string;
        title: string;
        status: string;
        normalized_email: string | null;
        client_user_id: string | null;
      }>)
    : [];

  if (projects.length === 0) return [];

  const projectIds = projects.map((p) => p.id);

  const [latestMessagesResult, unreadResult] = await Promise.all([
    supabase
      .from("studio_project_messages")
      .select(
        "project_id, sender, sender_id, sender_role, body, message_type, created_at",
      )
      .in("project_id", projectIds)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("studio_project_messages")
      .select(
        "id, project_id, sender_id, created_at",
      )
      .in("project_id", projectIds)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const lastMessageByProject = new Map<
    string,
    {
      sender: string | null;
      senderRole: string | null;
      body: string | null;
      createdAt: string;
    }
  >();
  if (Array.isArray(latestMessagesResult.data)) {
    for (const row of latestMessagesResult.data as Array<{
      project_id: string;
      sender: string | null;
      sender_role: string | null;
      body: string | null;
      message_type: string | null;
      created_at: string;
    }>) {
      if (lastMessageByProject.has(row.project_id)) continue;
      lastMessageByProject.set(row.project_id, {
        sender: row.sender,
        senderRole: row.sender_role,
        body: row.body,
        createdAt: row.created_at,
      });
    }
  }

  const messageIdsForUnread: string[] = [];
  const messagesByProject = new Map<
    string,
    Array<{ id: string; senderId: string | null; createdAt: string }>
  >();
  if (Array.isArray(unreadResult.data)) {
    for (const row of unreadResult.data as Array<{
      id: string;
      project_id: string;
      sender_id: string | null;
      created_at: string;
    }>) {
      const list = messagesByProject.get(row.project_id) || [];
      list.push({
        id: row.id,
        senderId: row.sender_id,
        createdAt: row.created_at,
      });
      messagesByProject.set(row.project_id, list);
      messageIdsForUnread.push(row.id);
    }
  }

  const readSet = new Set<string>();
  if (messageIdsForUnread.length > 0) {
    const readResult = await supabase
      .from("studio_message_read_receipts")
      .select("message_id")
      .eq("user_id", viewer.userId)
      .in("message_id", messageIdsForUnread);
    if (Array.isArray(readResult.data)) {
      for (const r of readResult.data as Array<{ message_id: string }>) {
        readSet.add(r.message_id);
      }
    }
  }

  return projects.map((project) => {
    const last = lastMessageByProject.get(project.id) || null;
    const messages = messagesByProject.get(project.id) || [];
    const unreadCount = messages.filter(
      (m) => m.senderId !== viewer.userId && !readSet.has(m.id),
    ).length;
    return {
      projectId: project.id,
      projectTitle: project.title,
      projectStatus: project.status,
      lastMessage: last
        ? {
            senderName: last.sender || "Studio",
            senderRole: normaliseSenderRole(last.senderRole),
            bodyExcerpt:
              (last.body || "").length <= 80
                ? last.body || ""
                : `${(last.body || "").slice(0, 79).trimEnd()}…`,
            createdAt: last.createdAt,
          }
        : null,
      unreadCount,
      teamActive: false,
    };
  });
}
