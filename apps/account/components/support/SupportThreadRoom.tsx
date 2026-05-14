"use client";

import { useCallback, useMemo } from "react";
import { translateSurfaceLabel, useHenryCoLocale } from "@henryco/i18n";
import {
  MessageThread,
  type ThreadMessage,
  type ThreadSupabaseLike,
} from "@henryco/messaging-thread";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import {
  accountSupportThreadAdapter,
  mapRowToMessage,
} from "./AccountSupportThreadAdapter";

type SupportMessageRow = Record<string, unknown>;

/**
 * Workspace-grade support thread surface for /support/[threadId].
 *
 * Delegates the entire conversation surface — bubble list with rich
 * attachments, optimistic send, draft persistence, mobile-stable
 * composer, full-screen mobile, drag-and-drop, paste-to-attach,
 * Supabase Realtime subscription with auto-reconnect, polite SR
 * announcer, message-arrival fade-in — to @henryco/messaging-thread.
 *
 * Host-specific concerns kept here:
 *   - viewer identity injection (account user)
 *   - row → ThreadMessage mapping for the server-rendered initial set
 *   - composer locale + closed-thread copy
 *   - browser Supabase factory (engine never imports the SDK directly)
 */
export default function SupportThreadRoom({
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
  const locale = useHenryCoLocale();
  const t = useCallback(
    (text: string) => translateSurfaceLabel(locale, text),
    [locale],
  );

  const adapter = useMemo(() => accountSupportThreadAdapter(), []);

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
      return createSupabaseBrowser() as unknown as ThreadSupabaseLike;
    } catch {
      return null;
    }
  }, []);

  // Closed = staff signed the thread off; replying funnels into a new
  // ticket. Resolved = staff marked done but the thread is still re-
  // openable, so we keep the composer live (matches legacy behavior).
  const isClosed = threadStatus === "closed";
  const isResolved = threadStatus === "resolved";

  return (
    <div
      className="acct-support-room"
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
        placeholder={t(
          "Reply with context, screenshots, or next steps. Drafts stay here while you type.",
        )}
        emptyTitle={t("Start the conversation")}
        emptyBody={t(
          "Ask a question, share feedback, or attach a reference. Replies arrive here in real time.",
        )}
      />
      {isClosed ? (
        <p className="acct-support-room__closed-note" role="status">
          {t(
            "This thread is closed. To continue this conversation, open a new support request — staff triage will route it cleanly.",
          )}
        </p>
      ) : isResolved ? (
        <p className="acct-support-room__resolved-note" role="status">
          {t(
            "This thread is marked resolved. Reply here to re-open it, or start a fresh request for unrelated issues.",
          )}
        </p>
      ) : null}
    </div>
  );
}
