"use client";

import { useCallback, useMemo } from "react";
import {
  MessageThread,
  type ThreadMessage,
  type ThreadSupabaseLike,
} from "@henryco/messaging-thread";

import { getBrowserSupabase } from "@/lib/supabase/browser";
import {
  studioSupportThreadAdapter,
  mapRowToMessage,
} from "./StudioSupportThreadAdapter";

type SupportMessageRow = Record<string, unknown>;

/**
 * Workspace-grade support thread surface for the studio dashboard's
 * /support/[threadId] route.
 *
 * Delegates the conversation surface — bubble list with rich
 * attachments, optimistic send, draft persistence, mobile-stable
 * composer, full-screen mobile, drag-and-drop, paste-to-attach,
 * Supabase Realtime subscription with auto-reconnect, polite SR
 * announcer, message-arrival fade-in — to @henryco/messaging-thread.
 *
 * Host-specific concerns kept here:
 *   - viewer identity injection (studio staff)
 *   - row → ThreadMessage mapping for the server-rendered initial set
 *   - closed/resolved hint copy
 *   - browser Supabase factory (engine never imports the SDK directly)
 */
export default function StudioSupportThreadRoom({
  threadId,
  messages,
  threadStatus,
  viewer,
}: {
  threadId: string;
  messages: SupportMessageRow[];
  threadStatus: string;
  viewer: { userId: string; fullName: string; email?: string | null };
}) {
  const adapter = useMemo(() => studioSupportThreadAdapter(), []);

  const initial = useMemo<ThreadMessage[]>(() => {
    const out: ThreadMessage[] = [];
    for (const row of messages) {
      const mapped = mapRowToMessage(row, viewer.userId);
      if (mapped) out.push(mapped);
    }
    return out;
  }, [messages, viewer.userId]);

  const getSupabase = useCallback((): ThreadSupabaseLike | null => {
    if (typeof window === "undefined") return null;
    try {
      // Cast through unknown — the engine declares a structural minimum
      // (channel + removeChannel) which the @supabase/ssr browser client
      // satisfies but doesn't typedef as compatibly.
      return getBrowserSupabase() as unknown as ThreadSupabaseLike;
    } catch {
      return null;
    }
  }, []);

  const isClosed = threadStatus === "closed";
  const isResolved = threadStatus === "resolved";

  return (
    <div
      className="studio-support-room"
      data-status={threadStatus}
      data-closed={isClosed || undefined}
    >
      <MessageThread
        threadId={threadId}
        initialMessages={initial}
        viewer={{ userId: viewer.userId, fullName: viewer.fullName }}
        adapter={adapter}
        getSupabase={getSupabase}
        renderMarkdown
        disableComposer={isClosed}
        placeholder="Reply with the next action, clarification, or resolution. Drafts stay here while you type."
        emptyTitle="No replies yet"
        emptyBody="The customer's message will appear here. Reply to start the conversation."
      />
      {isClosed ? (
        <p className="studio-support-room__closed-note" role="status">
          This thread is closed. The customer will need to open a new
          request to continue.
        </p>
      ) : isResolved ? (
        <p className="studio-support-room__resolved-note" role="status">
          This thread is marked resolved. A reply here will re-open it
          for the customer.
        </p>
      ) : null}
    </div>
  );
}
