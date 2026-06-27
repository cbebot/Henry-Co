import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import type { ThreadMessage } from "@henryco/messaging-thread";
import { WorkspaceShell } from "@/components/marketplace/shell";
import { MarketplaceMessageThread } from "@/components/messaging/MarketplaceMessageThread";
import { mapMarketplaceRow } from "@/components/messaging/marketplace-thread-adapter";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { vendorNav } from "@/lib/marketplace/navigation";
import { getConversationForViewer } from "@/lib/messaging/conversations";
import { createAdminSupabase } from "@/lib/supabase";
import { getMarketplacePublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

/**
 * Vendor thread for The Onyx Line (WS-4). The vendor sees the conversation
 * anchored to an order/listing and replies in-thread — but NEVER the buyer's
 * name, email, phone, or address. The buyer renders only as the generic
 * "Buyer" (via `mapMarketplaceRow`); the only counterpart-ish label the page
 * resolves is the vendor's OWN store name, used for the viewer's own bubbles.
 */
export default async function VendorMessageThreadPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  if (process.env.MARKETPLACE_MESSAGING_ENABLED !== "1") notFound();

  const { conversationId } = await params;
  const locale = await getMarketplacePublicLocale();
  const t = (label: string) => translateSurfaceLabel(locale, label);

  // Auth parity with the buyer thread page: redirect an unauthenticated visitor
  // to login (rather than returning a bare 404). The per-conversation authz is
  // still enforced below via getConversationForViewer + the viewerParty check.
  const viewer = await requireMarketplaceRoles(
    ["vendor", "marketplace_owner", "marketplace_admin"],
    `/vendor/messages/${conversationId}`,
  );
  const thread = await getConversationForViewer(conversationId, viewer);
  if (!thread || thread.viewerParty !== "vendor" || !viewer.user) notFound();

  const admin = createAdminSupabase();

  // The vendor's OWN public store name — used to label the viewer's identity in
  // the thread. This is never the buyer's identity.
  const { data: vendorRow } = await admin
    .from("marketplace_vendors")
    .select("name")
    .eq("id", thread.conversation.vendorId)
    .maybeSingle();
  const vendorName = vendorRow?.name ? String(vendorRow.name) : t("Your store");

  // Anchor label. The order lookup selects ONLY `order_no` — no buyer PII.
  let anchorLabel: string;
  if (thread.conversation.anchorType === "order") {
    const { data } = await admin
      .from("marketplace_orders")
      .select("order_no")
      .eq("id", thread.conversation.anchorId)
      .maybeSingle();
    const orderNo = data?.order_no ? String(data.order_no) : "";
    anchorLabel = orderNo ? `${t("Order")} ${orderNo}` : t("Order");
  } else {
    const { data } = await admin
      .from("marketplace_products")
      .select("title")
      .eq("id", thread.conversation.anchorId)
      .maybeSingle();
    anchorLabel = data?.title ? String(data.title) : t("Listing");
  }

  const initialMessages: ThreadMessage[] = thread.messages
    .map((message) =>
      mapMarketplaceRow(
        {
          id: message.id,
          conversation_id: message.conversationId,
          sender_kind: message.senderKind,
          sender_user_id: message.senderUserId,
          body: message.body,
          created_at: message.createdAt,
        },
        viewer.user!.id,
        { vendorDisplayName: vendorName, buyerLabel: translateSurfaceLabel(locale, "Buyer") },
      ),
    )
    .filter((message): message is ThreadMessage => message !== null);

  return (
    <WorkspaceShell
      title={anchorLabel}
      description={t(
        "Messages stay on Henry Onyx and the buyer's contact details are never shared. You're protected, and so is the buyer.",
      )}
      nav={vendorNav("/vendor/messages", locale)}
    >
      <section className="market-paper rounded-[1.75rem] p-5 sm:p-6">
        <div className="flex items-center gap-2 text-[var(--market-brass)]">
          <ShieldCheck className="h-4 w-4" aria-hidden />
          <p className="market-kicker">
            {thread.conversation.anchorType === "order" ? t("Order") : t("Listing")}
          </p>
        </div>
        <h2 className="mt-3 text-xl font-semibold tracking-tight text-[var(--market-ink)]">
          {anchorLabel}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--market-muted)]">
          {t("Protected — the buyer's contact details are never shared.")}
        </p>
      </section>

      <section className="market-paper rounded-[1.75rem] p-3 sm:p-4">
        <MarketplaceMessageThread
          conversationId={thread.conversation.id}
          initialMessages={initialMessages}
          viewer={{ userId: viewer.user.id, fullName: vendorName }}
          viewerParty="vendor"
          vendorDisplayName={vendorName}
        />
      </section>
    </WorkspaceShell>
  );
}
