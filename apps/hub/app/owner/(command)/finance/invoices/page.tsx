import Link from "next/link";
import { ExternalLink } from "lucide-react";
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
        {data.pendingInvoices.length === 0 ? (
          <div className="rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-6 text-sm text-[var(--acct-muted)]">
            {t("No pending invoices.")}
          </div>
        ) : (
          <table className="owner-table">
            <thead>
              <tr>
                <th>{t("Invoice")}</th>
                <th>{t("Division")}</th>
                <th>{t("Status")}</th>
                <th>{t("Total")}</th>
                <th>{t("Created")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.pendingInvoices.map((invoice) => {
                const invoiceId = String(invoice.id || "");
                return (
                  <tr key={invoiceId}>
                    <td>{String(invoice.invoice_no || invoice.description || t("Invoice"))}</td>
                    <td><DivisionBadge division={String(invoice.division || "learn")} /></td>
                    <td><StatusBadge status={String(invoice.status || "pending")} /></td>
                    <td className="tabular-nums">
                      {formatCurrencyAmount(Number(invoice.total_kobo || 0), String(invoice.currency || "NGN"), { unit: "kobo" })}
                    </td>
                    <td>{formatDateTime(String(invoice.created_at))}</td>
                    <td>
                      {invoiceId ? (
                        <Link
                          href={`/owner/finance/invoices/${invoiceId}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--owner-accent)]"
                        >
                          {t("Detail")}
                          <ExternalLink className="h-3 w-3" aria-hidden />
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </OwnerPanel>
    </div>
  );
}
