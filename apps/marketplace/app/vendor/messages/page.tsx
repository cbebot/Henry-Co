import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import type { AppLocale } from "@henryco/i18n/server";
import { EmptyState, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { vendorWorkspaceNav } from "@/lib/marketplace/navigation";
import {
  getVendorConversations,
  viewerVendorScopeIds,
  type MarketplaceConversationSummary,
} from "@/lib/messaging/conversations";
import { createAdminSupabase } from "@/lib/supabase";
import { getMarketplacePublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

/**
 * Vendor inbox for The Onyx Line (WS-4). Identity-minimized by construction:
 * every row is keyed on the ANCHOR (order # / listing title) and the screened
 * last-message preview — never on the buyer. `buyerUserId` (and every other
 * buyer identity field) is deliberately NOT read or rendered here.
 */
export default async function VendorMessagesPage() {
  if (process.env.MARKETPLACE_MESSAGING_ENABLED !== "1") notFound();

  const locale = await getMarketplacePublicLocale();
  const t = (label: string) => translateSurfaceLabel(locale, label);

  const viewer = await requireMarketplaceRoles(
    ["vendor", "marketplace_owner", "marketplace_admin"],
    "/vendor/messages",
  );

  const scopeIds = [...viewerVendorScopeIds(viewer)];
  if (scopeIds.length === 0) notFound();

  // A viewer can act for more than one vendor — surface conversations across
  // ALL of their vendor scopes, not just the first. A conversation belongs to a
  // single vendor so scopes don't overlap, but de-dupe by id defensively, then
  // sort by recency (nulls last) across the merged set.
  const convoLists = await Promise.all(scopeIds.map((id) => getVendorConversations(id)));
  const byId = new Map<string, MarketplaceConversationSummary>();
  for (const convo of convoLists.flat()) byId.set(convo.id, convo);
  const convos = [...byId.values()].sort((a, b) => {
    const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return bt - at;
  });
  const anchorLabels = await resolveAnchorLabels(convos, locale);

  return (
    <WorkspaceShell
      title={t("Messages")}
      description={t(
        "Buyer conversations anchored to an order or a listing. The buyer's contact details are never shared with you — everything you need to fulfil stays on the order.",
      )}
      {...vendorWorkspaceNav("/vendor/messages", locale)}
    >
      <section className="market-paper rounded-[1.75rem] p-5 sm:p-6">
        <div className="flex items-center gap-2 text-[var(--market-brass)]">
          <ShieldCheck className="h-4 w-4" aria-hidden />
          <p className="market-kicker">{t("Protected conversations")}</p>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--market-muted)]">
          {t(
            "Reply on Henry Onyx to stay protected. Phone numbers, emails, and off-platform links can't be sent — this is how we keep both sides safe from scams.",
          )}
        </p>
      </section>

      {convos.length === 0 ? (
        <EmptyState
          title={t("No conversations yet")}
          body={t(
            "When a buyer messages you about an order or a listing, the conversation will appear here.",
          )}
        />
      ) : (
        <ul className="space-y-3">
          {convos.map((convo) => {
            const anchor = anchorLabels.get(convo.id) ?? t("Conversation");
            const preview = convo.lastMessagePreview?.trim()
              ? convo.lastMessagePreview
              : t("No messages yet");
            return (
              <li key={convo.id}>
                <Link
                  href={`/vendor/messages/${convo.id}`}
                  className="group flex items-center justify-between gap-4 rounded-[1.5rem] border border-[var(--market-line)] bg-[var(--market-bg-soft)] px-5 py-4 transition hover:border-[var(--market-brass)]/55"
                >
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--market-brass)]">
                      {convo.anchorType === "order" ? t("Order") : t("Listing")}
                    </p>
                    <p className="mt-1.5 truncate text-base font-semibold tracking-tight text-[var(--market-ink)]">
                      {anchor}
                    </p>
                    <p className="mt-1 truncate text-sm leading-6 text-[var(--market-muted)]">
                      {preview}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="hidden text-xs text-[var(--market-muted)] sm:inline">
                      {formatRelativeTime(convo.lastMessageAt, locale, t)}
                    </span>
                    <ChevronRight className="h-4 w-4 text-[var(--market-muted)] transition group-hover:text-[var(--market-ink)]" aria-hidden />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </WorkspaceShell>
  );
}

/**
 * Batch-resolve the human anchor label for each conversation. Orders resolve to
 * `Order {order_no}`; listings to the product title. Identity-minimized: the
 * order lookup selects ONLY `order_no` — never buyer name/email/phone/shipping.
 */
async function resolveAnchorLabels(
  convos: MarketplaceConversationSummary[],
  locale: AppLocale,
): Promise<Map<string, string>> {
  const t = (label: string) => translateSurfaceLabel(locale, label);
  const labels = new Map<string, string>();
  if (convos.length === 0) return labels;

  const admin = createAdminSupabase();
  const orderIds = convos
    .filter((c) => c.anchorType === "order")
    .map((c) => c.anchorId)
    .filter(Boolean);
  const listingIds = convos
    .filter((c) => c.anchorType === "listing")
    .map((c) => c.anchorId)
    .filter(Boolean);

  const orderNoById = new Map<string, string>();
  if (orderIds.length > 0) {
    const { data } = await admin
      .from("marketplace_orders")
      .select("id, order_no")
      .in("id", orderIds);
    for (const row of (data ?? []) as Array<Record<string, unknown>>) {
      orderNoById.set(String(row.id), row.order_no ? String(row.order_no) : "");
    }
  }

  const titleById = new Map<string, string>();
  if (listingIds.length > 0) {
    const { data } = await admin
      .from("marketplace_products")
      .select("id, title")
      .in("id", listingIds);
    for (const row of (data ?? []) as Array<Record<string, unknown>>) {
      titleById.set(String(row.id), row.title ? String(row.title) : "");
    }
  }

  for (const convo of convos) {
    if (convo.anchorType === "order") {
      const orderNo = orderNoById.get(convo.anchorId) || "";
      labels.set(convo.id, orderNo ? `${t("Order")} ${orderNo}` : t("Order"));
    } else {
      const title = titleById.get(convo.anchorId) || "";
      labels.set(convo.id, title || t("Listing"));
    }
  }

  return labels;
}

/** Locale-aware relative time via `Intl.RelativeTimeFormat` (no copy GAPs). */
function formatRelativeTime(
  value: string | null,
  localeTag: string,
  t: (label: string) => string,
): string {
  if (!value) return t("No messages yet");
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t("No messages yet");

  const diffMs = date.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  if (abs < 60_000) return t("Just now");

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000_000],
    ["month", 2_592_000_000],
    ["week", 604_800_000],
    ["day", 86_400_000],
    ["hour", 3_600_000],
    ["minute", 60_000],
  ];

  try {
    const rtf = new Intl.RelativeTimeFormat(localeTag, { numeric: "auto" });
    for (const [unit, ms] of units) {
      if (abs >= ms) return rtf.format(Math.round(diffMs / ms), unit);
    }
    return t("Just now");
  } catch {
    try {
      return new Intl.DateTimeFormat(localeTag, { dateStyle: "medium" }).format(date);
    } catch {
      return t("No messages yet");
    }
  }
}
