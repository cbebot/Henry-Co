import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { maskContactsForDisplay } from "@henryco/trust/detect";
import { translateSurfaceLabel } from "@henryco/i18n";
import type { ThreadMessage } from "@henryco/messaging-thread";
import { WorkspaceShell } from "@/components/marketplace/shell";
import { MarketplaceMessageThread } from "@/components/messaging/MarketplaceMessageThread";
import { mapMarketplaceRow } from "@/components/messaging/marketplace-thread-adapter";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getConversationForViewer } from "@/lib/messaging/conversations";
import { resolveAnchorLabel, resolveVendorNames } from "@/lib/messaging/marketplace-display";
import { accountWorkspaceNav } from "@/lib/marketplace/navigation";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import { createAdminSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * The Onyx Line (WS-4) — buyer thread.
 *
 * Mounts the shared `MarketplaceMessageThread` with `viewerParty="buyer"`. The
 * route is buyer-only: if the viewer is a vendor member (not the buyer) of this
 * conversation, we 404 so they use the vendor surface instead — the buyer's
 * identity is never surfaced here. Dark behind MARKETPLACE_MESSAGING_ENABLED.
 */
export default async function AccountMessageThreadPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  if (process.env.MARKETPLACE_MESSAGING_ENABLED !== "1") notFound();

  const { conversationId } = await params;
  const locale = await getMarketplacePublicLocale();
  const t = (s: string) => translateSurfaceLabel(locale, s);

  const viewer = await requireMarketplaceUser(`/account/messages/${conversationId}`);
  if (!viewer.user) notFound();

  const thread = await getConversationForViewer(conversationId, viewer);
  if (!thread) notFound();
  // Buyer surface only — a vendor member views the same thread on /vendor/messages.
  if (thread.viewerParty !== "buyer") notFound();

  const admin = createAdminSupabase();
  const [vendorNames, anchorLabel] = await Promise.all([
    resolveVendorNames(admin, [thread.conversation.vendorId]),
    resolveAnchorLabel(admin, thread.conversation.anchorType, thread.conversation.anchorId),
  ]);
  const vendorName = vendorNames.get(thread.conversation.vendorId) || t("Seller");

  const anchorContext =
    thread.conversation.anchorType === "order"
      ? `${t("Order")}${anchorLabel ? ` · ${anchorLabel}` : ""}`
      : `${t("Listing")}${anchorLabel ? ` · ${anchorLabel}` : ""}`;
  const subject = thread.conversation.subject
    ? maskContactsForDisplay(thread.conversation.subject)
    : "";

  const initialMessages: ThreadMessage[] = thread.messages
    .map((m) =>
      mapMarketplaceRow(
        {
          id: m.id,
          conversation_id: m.conversationId,
          sender_kind: m.senderKind,
          sender_user_id: m.senderUserId,
          body: m.body,
          created_at: m.createdAt,
        },
        viewer.user!.id,
        { vendorDisplayName: vendorName, buyerLabel: translateSurfaceLabel(locale, "Buyer") },
      ),
    )
    .filter((msg): msg is ThreadMessage => msg !== null);

  return (
    <WorkspaceShell
      title={vendorName}
      description={subject ? `${anchorContext} · ${subject}` : anchorContext}
      {...accountWorkspaceNav("/account/messages", locale)}
    >
      <section className="market-paper rounded-[1.75rem] p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--market-line)] pb-4">
          <div className="min-w-0">
            <p className="market-kicker">{anchorContext}</p>
            <h2 className="mt-1.5 truncate text-[1.15rem] font-semibold tracking-[-0.01em] text-[var(--market-ink)]">
              {vendorName}
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--market-line)] bg-black/15 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
            <ShieldCheck className="h-3.5 w-3.5 text-[var(--market-brass)]" aria-hidden />
            {t("Protected — contact details can't be shared")}
          </span>
        </div>

        <MarketplaceMessageThread
          conversationId={thread.conversation.id}
          initialMessages={initialMessages}
          viewer={{ userId: viewer.user.id, fullName: viewer.user.fullName || t("You") }}
          viewerParty="buyer"
          vendorDisplayName={vendorName}
        />
      </section>
    </WorkspaceShell>
  );
}
