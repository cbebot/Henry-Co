import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { WorkspaceShell } from "@/components/marketplace/shell";
import { StartConversationForm } from "@/components/messaging/StartConversationForm";
import { getMarketplaceViewer, requireMarketplaceUser } from "@/lib/marketplace/auth";
import { resolveAnchorLabel, resolveVendorNames } from "@/lib/messaging/marketplace-display";
import { resolveCounterpart } from "@/lib/messaging/conversations";
import { accountWorkspaceNav } from "@/lib/marketplace/navigation";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import { createAdminSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * The Onyx Line (WS-4) — start a new buyer<->seller conversation.
 *
 * Linked from the "Message seller" CTA on a product page (anchor=listing) or an
 * order detail page (anchor=order). Shows the anchor context, then a contact-
 * safe composer. Dark behind MARKETPLACE_MESSAGING_ENABLED.
 */
export default async function StartMessagePage({
  searchParams,
}: {
  searchParams: Promise<{
    anchor_type?: string;
    anchor_id?: string;
    vendor_id?: string;
    subject?: string;
  }>;
}) {
  if (process.env.MARKETPLACE_MESSAGING_ENABLED !== "1") notFound();

  const params = await searchParams;
  const locale = await getMarketplacePublicLocale();
  const t = (s: string) => translateSurfaceLabel(locale, s);

  await requireMarketplaceUser("/account/messages/new");
  const viewer = await getMarketplaceViewer();

  const anchorType =
    params.anchor_type === "order" ? "order" : params.anchor_type === "listing" ? "listing" : null;
  const anchorId = typeof params.anchor_id === "string" ? params.anchor_id.trim() : "";
  if (!anchorType || !anchorId) notFound();

  const requestedVendorId =
    typeof params.vendor_id === "string" ? params.vendor_id.trim() : "";
  const subjectDefault = typeof params.subject === "string" ? params.subject.slice(0, 140) : "";

  const admin = createAdminSupabase();
  const [anchorLabel, counterpart] = await Promise.all([
    resolveAnchorLabel(admin, anchorType, anchorId),
    resolveCounterpart(admin, anchorType, anchorId),
  ]);
  if (!counterpart) notFound();

  // Defense-in-depth: an order-anchored compose is buyer-initiated by the
  // order's owner. A non-owner must not even see the order's number in the
  // context label (the send path is already 403-gated, this guards the read).
  if (counterpart.kind === "order" && counterpart.buyerUserId !== viewer.user?.id) {
    notFound();
  }

  // Resolve the single vendor we can name for context: the listing's vendor, or
  // the requested vendor on the order.
  let vendorIdForName = "";
  if (counterpart.kind === "listing") {
    vendorIdForName = counterpart.vendorId;
  } else if (requestedVendorId && counterpart.vendorIds.includes(requestedVendorId)) {
    vendorIdForName = requestedVendorId;
  } else if (counterpart.vendorIds.length === 1) {
    vendorIdForName = counterpart.vendorIds[0];
  }

  const vendorName = vendorIdForName
    ? (await resolveVendorNames(admin, [vendorIdForName])).get(vendorIdForName) || ""
    : "";

  const anchorContext =
    anchorType === "order"
      ? `${t("Order")}${anchorLabel ? ` · ${anchorLabel}` : ""}`
      : `${t("Listing")}${anchorLabel ? ` · ${anchorLabel}` : ""}`;

  return (
    <WorkspaceShell
      title={t("Message seller")}
      description={t(
        "Send a contact-safe message to the seller. It stays on Henry Onyx, so your contact details are never shared.",
      )}
      {...accountWorkspaceNav("/account/messages", locale)}
    >
      <section className="market-paper rounded-[1.75rem] p-5 sm:p-7">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="market-kicker">{anchorContext}</p>
          {vendorName ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--market-line)] bg-black/15 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--market-paper-white)]">
              <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--market-brass)]" />
              {t("Store")} · {vendorName}
            </span>
          ) : null}
        </div>
        <h2 className="mt-3 text-balance text-[1.4rem] font-semibold leading-[1.18] tracking-[-0.014em] text-[var(--market-ink)] sm:text-[1.6rem]">
          {vendorName
            ? t("Start a conversation with {store}").replace("{store}", vendorName)
            : t("Start a conversation with the seller")}
        </h2>
        <p className="mt-3 max-w-xl text-[13.5px] leading-7 text-[var(--market-muted)]">
          {t(
            "Ask about the item, delivery, or your order. To keep you protected, phone numbers, emails, and off-platform links can't be sent.",
          )}
        </p>

        <StartConversationForm
          anchorType={anchorType}
          anchorId={anchorId}
          vendorId={requestedVendorId || undefined}
          subjectDefault={subjectDefault}
        />
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-[12px] leading-6 text-[var(--market-muted)]">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--market-brass)]" aria-hidden />
          <span>
            {t(
              "We never share your contact details with sellers — they reach you through Henry Onyx. This is how we protect you from scammers.",
            )}
          </span>
        </p>
        <Link
          href="/account/messages"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--market-muted)] underline-offset-4 transition hover:text-[var(--market-ink)] hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("Back to messages")}
        </Link>
      </div>
    </WorkspaceShell>
  );
}
