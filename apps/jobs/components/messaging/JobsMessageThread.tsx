"use client";

import { useCallback, useMemo } from "react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import {
  MessageThread,
  type ThreadMessage,
  type ThreadSupabaseLike,
} from "@henryco/messaging-thread";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { JobsContactSafetyHint } from "./JobsContactSafetyHint";
import { createJobsThreadAdapter } from "./jobs-thread-adapter";

/**
 * The shared candidate<->employer hiring conversation surface for The Onyx
 * Line (WS-5).
 *
 * Both the candidate (`/candidate/conversations/[id]`) and employer thread
 * pages mount this exact component. The whole conversation surface — bubble
 * list, optimistic + offline-tolerant send, draft persistence, mobile-stable
 * composer, Supabase Realtime subscription, polite SR announcer — is delegated
 * to `@henryco/messaging-thread`. Host-specific concerns kept here: viewer
 * identity, the jobs adapter, the browser Supabase factory, the localized
 * composer copy, and the contact-safety hint.
 *
 * KEY DIFFERENCE FROM MARKETPLACE: jobs is NOT identity-minimized — the
 * candidate and employer legitimately see each other's real names — so typing
 * presence is left ON and the counterpart label is a real display name.
 * Contact details are still never shared (screened on send, masked on render).
 *
 * The `jobs-` threadId prefix only tints the composer via the engine's tone
 * heuristic; the adapter keys every channel/filter/intent on the real
 * `conversationId`.
 */
export function JobsMessageThread({
  conversationId,
  initialMessages,
  viewer,
  candidateLabel,
  employerLabel,
  disabled,
}: {
  conversationId: string;
  initialMessages: ThreadMessage[];
  viewer: { userId: string; fullName: string };
  candidateLabel: string;
  employerLabel: string;
  disabled?: boolean;
}) {
  const locale = useHenryCoLocale();
  const t = useCallback(
    (label: string) => translateSurfaceLabel(locale, label),
    [locale],
  );

  const adapter = useMemo(
    () =>
      createJobsThreadAdapter({
        conversationId,
        candidateLabel,
        employerLabel,
      }),
    [conversationId, candidateLabel, employerLabel],
  );

  const getSupabase = useCallback((): ThreadSupabaseLike | null => {
    if (typeof window === "undefined") return null;
    try {
      // `createSupabaseBrowser` THROWS when the public env is missing (SSR /
      // misconfig). Cast through unknown — the engine declares a structural
      // minimum (channel + removeChannel) that the @supabase/ssr browser
      // client satisfies but doesn't typedef as compatibly. Returns null on
      // throw, so the engine degrades to "no live updates".
      return createSupabaseBrowser() as unknown as ThreadSupabaseLike;
    } catch {
      return null;
    }
  }, []);

  return (
    <MessageThread
      threadId={`jobs-${conversationId}`}
      initialMessages={initialMessages}
      viewer={{ userId: viewer.userId, fullName: viewer.fullName }}
      adapter={adapter}
      getSupabase={getSupabase}
      renderMarkdown
      // LEAVE ON — jobs is NOT identity-minimized; the candidate and employer
      // already see each other's names, so broadcasting "<name> is typing"
      // leaks nothing. (Contrast marketplace, where it must be OFF.)
      enableTypingPresence
      disableComposer={disabled}
      composerExtras={(ctx) => <JobsContactSafetyHint text={ctx.draft} />}
      placeholder={t("Write your message. Drafts stay here while you type.")}
      emptyTitle={t("Start the conversation")}
      emptyBody={t(
        "Send the first message. Keep it on Henry Onyx — contact details can't be shared, so everyone in the hiring process stays protected.",
      )}
    />
  );
}
