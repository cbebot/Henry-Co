import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { maskContactsForDisplay } from "@henryco/trust/detect";
import { translateSurfaceLabel } from "@henryco/i18n";
import { EmptyState, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerConversations } from "@/lib/messaging/conversations";
import { resolveAnchorLabels, resolveVendorNames } from "@/lib/messaging/marketplace-display";
import { accountWorkspaceNav } from "@/lib/marketplace/navigation";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import { createAdminSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * The Onyx Line (WS-4) — buyer inbox.
 *
 * On-platform, contact-safe buyer<->seller messaging anchored to a listing or
 * an order. The counterpart is shown as the vendor's public store name only;
 * no buyer-side PII ever appears here. Dark behind MARKETPLACE_MESSAGING_ENABLED.
 */

function relativeLabel(iso: string | null, t: (s: string) => string): string {
  if (!iso) return "";
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "";
  const minutes = Math.round((Date.now() - ts) / 60000);
  if (minutes < 1) return t("Just now");
  if (minutes < 60) return t("{count}m ago").replace("{count}", String(minutes));
  const hours = Math.round(minutes / 60);
  if (hours < 24) return t("{count}h ago").replace("{count}", String(hours));
  const days = Math.round(hours / 24);
  if (days < 30) return t("{count}d ago").replace("{count}", String(days));
  const months = Math.round(days / 30);
  if (months < 12) return t("{count}mo ago").replace("{count}", String(months));
  return t("{count}y ago").replace("{count}", String(Math.round(months / 12)));
}

export default async function AccountMessagesPage() {
  if (process.env.MARKETPLACE_MESSAGING_ENABLED !== "1") notFound();

  const locale = await getMarketplacePublicLocale();
  const t = (s: string) => translateSurfaceLabel(locale, s);

  const viewer = await requireMarketplaceUser("/account/messages");
  if (!viewer.user) notFound();

  const convos = await getBuyerConversations(viewer.user.id);

  let vendorNames = new Map<string, string>();
  let anchorLabels = new Map<string, string>();
  if (convos.length > 0) {
    const admin = createAdminSupabase();
    [vendorNames, anchorLabels] = await Promise.all([
      resolveVendorNames(
        admin,
        convos.map((c) => c.vendorId),
      ),
      resolveAnchorLabels(
        admin,
        convos.map((c) => ({ anchorType: c.anchorType, anchorId: c.anchorId })),
      ),
    ]);
  }

  return (
    <WorkspaceShell
      title={t("Messages")}
      description={t(
        "Talk to sellers about a listing or an order. Conversations stay on Henry Onyx and you stay protected — contact details can't be shared.",
      )}
      {...accountWorkspaceNav("/account/messages", locale)}
    >
      {convos.length === 0 ? (
        <EmptyState
          title={t("No messages yet")}
          body={t(
            "You can message a seller from any product page or from one of your orders. Conversations stay on Henry Onyx and are protected — phone numbers, emails, and off-platform links can't be shared.",
          )}
          ctaHref="/search"
          ctaLabel={t("Browse the marketplace")}
        />
      ) : (
        <section className="market-paper rounded-[1.75rem] p-2 sm:p-3">
          <ol className="divide-y divide-[var(--market-line)]">
            {convos.map((c) => {
              const vendorName = vendorNames.get(c.vendorId) || t("Seller");
              const anchorLabel = anchorLabels.get(`${c.anchorType}:${c.anchorId}`) || "";
              const anchorContext =
                c.anchorType === "order"
                  ? `${t("Order")}${anchorLabel ? ` · ${anchorLabel}` : ""}`
                  : `${t("Listing")}${anchorLabel ? ` · ${anchorLabel}` : ""}`;
              const preview =
                c.lastMessagePreview ||
                (c.subject ? maskContactsForDisplay(c.subject) : t("No messages yet"));
              return (
                <li key={c.id}>
                  <Link
                    href={`/account/messages/${c.id}`}
                    className="
                      group flex items-center gap-4 rounded-[1.3rem] px-4 py-4
                      transition hover:bg-white/[0.03]
                      focus-visible:outline-none focus-visible:ring-2
                      focus-visible:ring-[var(--market-brass)]/55
                    "
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                        <p className="truncate text-[15px] font-semibold tracking-[-0.005em] text-[var(--market-ink)]">
                          {vendorName}
                        </p>
                        <span className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[var(--market-muted)]">
                          {anchorContext}
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-2 max-w-2xl text-[13px] leading-6 text-[var(--market-muted)]">
                        {preview}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-[10.5px] uppercase tracking-[0.18em] text-[var(--market-muted)]">
                        {relativeLabel(c.lastMessageAt, t)}
                      </span>
                      <ChevronRight className="h-4 w-4 text-[var(--market-muted)] transition group-hover:text-[var(--market-brass)]" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <p className="flex items-start gap-2 text-[12px] leading-6 text-[var(--market-muted)]">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--market-brass)]" aria-hidden />
        <span>
          {t(
            "Keep the conversation on Henry Onyx. We never share your contact details with sellers — this is how we protect you from scammers.",
          )}
        </span>
      </p>
    </WorkspaceShell>
  );
}
