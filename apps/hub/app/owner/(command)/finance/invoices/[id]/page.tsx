import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Receipt } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import DivisionBadge from "@/components/owner/DivisionBadge";
import StatusBadge from "@/components/owner/StatusBadge";
import { getInvoiceDetail } from "@/lib/owner-data";
import { formatCurrencyAmount, formatDateTime } from "@/lib/format";
import { getHubPublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const locale = await getHubPublicLocale();
  const t = (s: string) => translateSurfaceLabel(locale, s);
  return {
    title: `${t("Invoice")} · ${id.slice(0, 8)}`,
    description: t("Full invoice record with payment status and line detail."),
  };
}

const SKIP_DISPLAY = new Set(["id", "division"]);

function formatFieldName(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function isMoneyKey(key: string): boolean {
  return (
    key.endsWith("_kobo") ||
    key.endsWith("_amount") ||
    key === "total_kobo" ||
    key === "subtotal_kobo" ||
    key === "tax_kobo"
  );
}

function isTimestampKey(key: string): boolean {
  return key.endsWith("_at") || key.endsWith("_date");
}

function formatValue(key: string, value: unknown, currency: string): string {
  if (value === null || value === undefined) return "—";
  if (isMoneyKey(key) && typeof value === "number") {
    return formatCurrencyAmount(value, currency, { unit: "kobo" });
  }
  if (isTimestampKey(key) && typeof value === "string") {
    return formatDateTime(value);
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [invoice, locale] = await Promise.all([getInvoiceDetail(id), getHubPublicLocale()]);
  const t = (s: string) => translateSurfaceLabel(locale, s);

  if (!invoice) notFound();

  const currency = String(invoice.currency || "NGN");
  const division = String(invoice.division || "");
  const status = String(invoice.status || "pending");
  const invoiceNo = String(invoice.invoice_no || invoice.description || `INV-${id.slice(0, 8)}`);
  const totalKobo = Number(invoice.total_kobo || 0);
  const createdAt = String(invoice.created_at || "");

  const fields = Object.entries(invoice).filter(
    ([k]) => !SKIP_DISPLAY.has(k) && k !== "currency"
  );

  return (
    <div className="space-y-6 acct-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href="/owner/finance/invoices"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--acct-muted)] hover:text-[var(--owner-accent)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {t("All invoices")}
        </Link>
      </div>

      <OwnerPageHeader
        eyebrow={t("Invoice detail")}
        title={invoiceNo}
        description={t("Full invoice record — amounts, status, and all recorded fields.")}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-[1.2rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--acct-muted)]">
            {t("Total")}
          </p>
          <p className="mt-1.5 text-xl font-semibold tabular-nums text-[var(--acct-ink)]">
            {formatCurrencyAmount(totalKobo, currency, { unit: "kobo" })}
          </p>
        </div>
        <div className="rounded-[1.2rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--acct-muted)]">
            {t("Status")}
          </p>
          <div className="mt-1.5">
            <StatusBadge status={status} />
          </div>
        </div>
        <div className="rounded-[1.2rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--acct-muted)]">
            {t("Division")}
          </p>
          <div className="mt-1.5">
            {division ? <DivisionBadge division={division} /> : <span className="text-sm text-[var(--acct-muted)]">—</span>}
          </div>
        </div>
        <div className="rounded-[1.2rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--acct-muted)]">
            {t("Created")}
          </p>
          <p className="mt-1.5 text-sm text-[var(--acct-ink)]">
            {createdAt ? formatDateTime(createdAt) : "—"}
          </p>
        </div>
      </div>

      <OwnerPanel title={t("Full invoice record")} description={t("All fields stored for this invoice.")}>
        <div className="overflow-x-auto">
          <table className="owner-table">
            <thead>
              <tr>
                <th>{t("Field")}</th>
                <th>{t("Value")}</th>
              </tr>
            </thead>
            <tbody>
              {fields.map(([key, value]) => (
                <tr key={key}>
                  <td className="whitespace-nowrap font-mono text-xs text-[var(--acct-muted)]">
                    {formatFieldName(key)}
                  </td>
                  <td>
                    {typeof value === "object" && value !== null ? (
                      <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-[var(--acct-bg)] p-2 font-mono text-xs text-[var(--acct-ink)]">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    ) : (
                      <span className={isMoneyKey(key) ? "tabular-nums font-semibold" : "text-sm"}>
                        {formatValue(key, value, currency)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </OwnerPanel>

      <div className="flex items-center gap-3">
        <Link
          href="/owner/finance/invoices"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--acct-line)] px-4 py-2 text-sm font-semibold text-[var(--acct-muted)] hover:border-[var(--owner-accent)] hover:text-[var(--owner-accent)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("Back to invoices")}
        </Link>
        <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--acct-line)] px-4 py-2 text-xs text-[var(--acct-muted)]">
          <Receipt className="h-3.5 w-3.5" aria-hidden />
          ID: <span className="font-mono">{id}</span>
        </div>
      </div>
    </div>
  );
}
