import { translateSurfaceLabel } from "@henryco/i18n";
import DivisionBadge from "@/components/owner/DivisionBadge";
import StatusBadge from "@/components/owner/StatusBadge";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { getFinanceCenterData } from "@/lib/owner-data";
import { formatCurrencyAmount, formatDateTime } from "@/lib/format";
import { getHubPublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export default async function FinanceInvoicesPage() {
  const [data, locale] = await Promise.all([getFinanceCenterData(), getHubPublicLocale()]);
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow={t("Invoices")}
        title={t("Invoice pressure and payment follow-up")}
        description={t("Shared platform invoices still waiting for resolution appear here with their division context and payment status.")}
      />

      <OwnerPanel title={t("Pending invoices")} description={t("Invoices still marked pending or overdue.")}>
        <table className="owner-table">
          <thead>
            <tr>
              <th>{t("Invoice")}</th>
              <th>{t("Division")}</th>
              <th>{t("Status")}</th>
              <th>{t("Total")}</th>
              <th>{t("Created")}</th>
            </tr>
          </thead>
          <tbody>
            {data.pendingInvoices.map((invoice) => (
              <tr key={String(invoice.id)}>
                <td>{String(invoice.invoice_no || invoice.description || t("Invoice"))}</td>
                <td><DivisionBadge division={String(invoice.division || "learn")} /></td>
                <td><StatusBadge status={String(invoice.status || "pending")} /></td>
                <td>{formatCurrencyAmount(Number(invoice.total_kobo || 0), String(invoice.currency || "NGN"), { unit: "kobo" })}</td>
                <td>{formatDateTime(String(invoice.created_at))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </OwnerPanel>
    </div>
  );
}
