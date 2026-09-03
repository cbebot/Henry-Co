import { translateSurfaceLabel } from "@henryco/i18n";
import { EmptyState, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getVendorWorkspaceData } from "@/lib/marketplace/data";
import { vendorWorkspaceNav } from "@/lib/marketplace/navigation";
import {
  disputeResolutionLabel,
  disputeStatusLabel,
} from "@/lib/marketplace/vendor/labels";
import { formatVendorMoney } from "@/lib/marketplace/vendor/money";
import { formatDate } from "@/lib/utils";
import { getMarketplacePublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export default async function VendorDisputesPage() {
  const locale = await getMarketplacePublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  await requireMarketplaceRoles(["vendor", "marketplace_owner", "marketplace_admin"], "/vendor/disputes");
  const data = await getVendorWorkspaceData();
  // Settlement rows carry whole naira; the display seam takes kobo.
  const money = (naira: number) => formatVendorMoney(Math.round(naira * 100), locale);

  return (
    <WorkspaceShell
      title={t("Disputes")}
      description={t("Issue context stays connected to the order and its payout, so nothing is resolved blind.")}
      {...vendorWorkspaceNav("/vendor/disputes", locale)}
    >
      {data.disputes.length === 0 ? (
        <EmptyState
          title={t("No disputes")}
          body={t("When a buyer raises an issue with one of your orders, it appears here with its payout impact.")}
        />
      ) : (
        <div className="space-y-4">
          {data.disputes.map((dispute) => (
            <article key={dispute.id} className="market-paper rounded-[1.75rem] p-5">
              <p className="market-kicker">{dispute.disputeNo}</p>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--market-ink)]">
                {disputeStatusLabel(dispute.status, t)}
              </h2>
              {dispute.orderNo ? (
                <p className="mt-1 text-sm font-medium text-[var(--market-muted)]">
                  {t("Order {orderNo}").replace("{orderNo}", dispute.orderNo)}
                </p>
              ) : null}
              {dispute.reason ? (
                <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">{dispute.reason}</p>
              ) : null}
              {dispute.resolutionType ? (
                <p className="mt-2 text-sm leading-7 text-[var(--market-ink)]">
                  {t("Resolution: {resolution}").replace(
                    "{resolution}",
                    disputeResolutionLabel(dispute.resolutionType, t),
                  )}
                  {dispute.refundAmount != null
                    ? ` · ${t("Refund: {amount}").replace("{amount}", money(dispute.refundAmount))}`
                    : null}
                </p>
              ) : null}
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[var(--market-muted)]">
                {formatDate(dispute.updatedAt)}
              </p>
            </article>
          ))}
        </div>
      )}
    </WorkspaceShell>
  );
}
