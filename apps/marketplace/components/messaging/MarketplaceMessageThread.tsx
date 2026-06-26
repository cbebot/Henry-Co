"use client";

import { useCallback, useMemo } from "react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import {
  MessageThread,
  type ThreadMessage,
  type ThreadSupabaseLike,
} from "@henryco/messaging-thread";
import { getBrowserSupabaseOptional } from "@/lib/supabase/browser";
import { ContactSafetyHint } from "./ContactSafetyHint";
import { createMarketplaceThreadAdapter } from "./marketplace-thread-adapter";

/**
 * The shared buyer<->seller conversation surface for The Onyx Line (WS-4).
 *
 * Both the buyer (`/account/messages/[id]`) and vendor
 * (`/vendor/messages/[id]`) thread pages mount this exact component;
 * `viewerParty` flips the identity-minimized labelling inside the adapter
 * (the vendor only ever sees "Buyer", never the buyer's real identity).
 *
 * The whole conversation surface — bubble list, optimistic + offline-
 * tolerant send, draft persistence, mobile-stable composer, Supabase
 * Realtime subscription, polite SR announcer — is delegated to
 * `@henryco/messaging-thread`. Host-specific concerns kept here: viewer
 * identity, the marketplace adapter, the browser Supabase factory, the
 * localized composer copy, and the contact-safety hint.
 *
 * The `marketplace-` threadId prefix only tints the composer brass via the
 * engine's tone heuristic; the adapter keys every channel/filter/intent on
 * the real `conversationId`.
 */
export function MarketplaceMessageThread({
  conversationId,
  initialMessages,
  viewer,
  viewerParty,
  vendorDisplayName,
  disabled,
}: {
  conversationId: string;
  initialMessages: ThreadMessage[];
  viewer: { userId: string; fullName: string };
  viewerParty: "buyer" | "vendor";
  vendorDisplayName: string;
  disabled?: boolean;
}) {
  const locale = useHenryCoLocale();
  const t = useCallback(
    (label: string) => translateSurfaceLabel(locale, label),
    [locale],
  );

  const buyerLabel = t("Buyer");

  const adapter = useMemo(
    () =>
      createMarketplaceThreadAdapter({
        conversationId,
        viewerParty,
        vendorDisplayName,
        buyerLabel,
      }),
    [conversationId, viewerParty, vendorDisplayName, buyerLabel],
  );

  const getSupabase = useCallback((): ThreadSupabaseLike | null => {
    if (typeof window === "undefined") return null;
    try {
      // Cast through unknown — the engine declares a structural minimum
      // (channel + removeChannel) that the @supabase/ssr browser client
      // satisfies but doesn't typedef as compatibly. Returns null when the
      // public env is missing, so the engine degrades to "no live updates".
      return getBrowserSupabaseOptional() as unknown as ThreadSupabaseLike;
    } catch {
      return null;
    }
  }, []);

  return (
    <MessageThread
      threadId={`marketplace-${conversationId}`}
      initialMessages={initialMessages}
      viewer={{ userId: viewer.userId, fullName: viewer.fullName }}
      adapter={adapter}
      getSupabase={getSupabase}
      renderMarkdown
      // Identity-minimization (non-negotiable): the engine's typing presence
      // broadcasts viewer.fullName over the shared channel, which would
      // transmit the BUYER's real name to the vendor ("<name> is typing").
      // Both parties mount this component, so disabling it symmetrically is
      // the only leak-proof choice — the component must not rely on every
      // caller passing a minimized name. Buyer anonymity > typing dots.
      enableTypingPresence={false}
      disableComposer={disabled}
      composerExtras={(ctx) => <ContactSafetyHint text={ctx.draft} />}
      placeholder={t(
        "Write your message. Drafts stay here while you type.",
      )}
      emptyTitle={t("Start the conversation")}
      emptyBody={t(
        "Ask about the item, delivery, or your order. Keep it on Henry Onyx — contact details can't be shared, so you stay protected.",
      )}
    />
  );
}
