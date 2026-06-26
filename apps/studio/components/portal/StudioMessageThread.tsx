"use client";

import { useCallback, useMemo } from "react";
import { buildMessagingChromeLabels, translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import {
  MessageThread,
  type MessageThreadAdapter,
  type ThreadMessage,
} from "@henryco/messaging-thread";
import {
  attachMessageFileAction,
  markProjectMessagesReadAction,
  sendProjectMessageAction,
} from "@/lib/portal/actions";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { maskContactsForDisplay } from "@henryco/trust/detect";
import type {
  ClientMessage,
  ClientMessageAttachment,
} from "@/types/portal";
import { RefineWithAiButton } from "./RefineWithAiButton";

/**
 * Studio's adapter for the shared @henryco/messaging-thread engine.
 * Maps studio_project_messages rows + studio server actions onto the
 * engine's audience-agnostic contract.
 *
 * The engine owns the UI; this file owns the studio-specific
 * subscription identifiers + action signatures.
 */
function studioAdapter(): MessageThreadAdapter {
  return {
    channelName: (projectId) => `studio-thread-${projectId}`,
    subscriptionFilter: (projectId) => `project_id=eq.${projectId}`,
    table: "studio_project_messages",
    schema: "public",
    rowToMessage: (row, viewerId) => {
      const isInternal = Boolean(row.is_internal);
      if (isInternal) return null;
      const senderId = (row.sender_id as string | null) || null;
      const senderRole = String(row.sender_role || "team");
      const isOwn = senderId === viewerId;
      const role = senderRole === "client" ? "viewer" : senderRole === "system" ? "system" : "team";
      const attachments = Array.isArray(row.attachments)
        ? (row.attachments as ClientMessageAttachment[]).map((a) => ({
            url: String(a.url || ""),
            name: String(a.name || a.url || ""),
            type: String(a.type || ""),
            size: typeof a.size === "number" ? a.size : null,
          }))
        : [];
      return {
        id: String(row.id || ""),
        threadId: String(row.project_id || ""),
        senderId,
        senderName: String(row.sender || (isOwn ? "You" : "Henry Onyx Studio")),
        senderRole: role,
        // Defense-in-depth: mask contact details in already-stored bodies at render
        // (legacy rows pre-date the send/edit screens). New rows are screened at write.
        body: maskContactsForDisplay(String(row.body || "")),
        attachments,
        createdAt: String(row.created_at || new Date().toISOString()),
        editedAt: (row.edited_at as string | null) || null,
        isOwnMessage: isOwn,
      };
    },
    sendAction: async (formData) => {
      const threadId = formData.get("threadId");
      if (typeof threadId === "string") formData.set("projectId", threadId);
      const result = await sendProjectMessageAction(formData);
      if (!result.ok) return { ok: false, reason: result.reason };
      return { ok: true, messageId: result.messageId };
    },
    markReadAction: async (formData) => {
      const threadId = formData.get("threadId");
      if (typeof threadId === "string") formData.set("projectId", threadId);
      await markProjectMessagesReadAction(formData);
    },
    attachAction: async (formData) => {
      const result = await attachMessageFileAction(formData);
      if (!result.ok) return { ok: false };
      return {
        ok: true,
        url: result.url,
        name: result.name,
        type: result.type,
        size: result.size ?? null,
      };
    },
  };
}

function mapClientMessageToThread(message: ClientMessage): ThreadMessage {
  return {
    id: message.id,
    threadId: message.projectId,
    senderId: message.senderId,
    senderName: message.senderName,
    senderRole:
      message.senderRole === "client"
        ? "viewer"
        : message.senderRole === "system"
          ? "system"
          : "team",
    body: message.body,
    attachments: (message.attachments || []).map((a) => ({
      url: a.url,
      name: a.name || a.url,
      type: a.type || "",
      size: typeof a.size === "number" ? a.size : null,
    })),
    createdAt: message.createdAt,
    editedAt: message.editedAt,
    isOwnMessage: message.isOwnMessage,
  };
}

export type StudioMessageThreadProps = {
  projectId: string;
  initialMessages: ClientMessage[];
  viewerId: string;
  viewerName: string;
  /** Project title forwarded to the AI refine action so model output
   * stays grounded in the right context. */
  projectTitle?: string | null;
  /** Project summary forwarded to the AI refine action. */
  projectSummary?: string | null;
};

/**
 * Drop-in replacement for the legacy MessageThread used by
 * /client/projects/[projectId] messages tab. Adds the AI ✨ Refine
 * button via the engine's composerExtras slot.
 */
export function StudioMessageThread({
  projectId,
  initialMessages,
  viewerId,
  viewerName,
  projectTitle,
  projectSummary,
}: StudioMessageThreadProps) {
  const locale = useHenryCoLocale();
  const t = useCallback(
    (label: string) => translateSurfaceLabel(locale, label),
    [locale],
  );
  // Localized composer + thread chrome (Send button, aria, Live, failed-send),
  // shared across all divisions via the single i18n source of truth.
  const { composerLabels, threadLabels } = useMemo(
    () => buildMessagingChromeLabels(t),
    [t],
  );
  const adapter = useMemo(() => studioAdapter(), []);
  const initial = useMemo(
    () => initialMessages.map(mapClientMessageToThread),
    [initialMessages],
  );
  const getSupabase = useCallback(() => {
    try {
      return getBrowserSupabase();
    } catch {
      return null;
    }
  }, []);
  return (
    <MessageThread
      threadId={projectId}
      initialMessages={initial}
      viewer={{ userId: viewerId, fullName: viewerName }}
      adapter={adapter}
      getSupabase={getSupabase}
      composerLabels={composerLabels}
      {...threadLabels}
      composerExtras={({ draft, setDraft }) => (
        <RefineWithAiButton
          draft={draft}
          setDraft={setDraft}
          projectTitle={projectTitle}
          projectSummary={projectSummary}
        />
      )}
    />
  );
}
