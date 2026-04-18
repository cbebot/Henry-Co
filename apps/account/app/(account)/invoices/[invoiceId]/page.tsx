import Link from "next/link";
import { ArrowLeft, ExternalLink, Receipt } from "lucide-react";
import { formatSurfaceTemplate, translateSurfaceLabel } from "@henryco/i18n/server";
import { requireAccountUser } from "@/lib/auth";
import { getInvoiceById } from "@/lib/account-data";
import { getInvoiceWorkspaceHref } from "@/lib/account-links";
import { divisionLabel, formatDate, formatDateTime, formatNaira } from "@/lib/format";
import { getAccountAppLocale } from "@/lib/locale-server";
import PageHeader from "@/components/layout/PageHeader";

export const dynamic = "force-dynamic";
const statusChip: Record<string, string> = { paid: "acct-chip-green", pending: "acct-chip-orange", overdue: "acct-chip-red", draft: "acct-chip-blue", cancelled: "acct-chip-red", refunded: "acct-chip-purple" };

function parseLineItems(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      return {
        id: String(row.id || row.name || row.description || Math.random()),
        title: String(row.name || row.title || row.description || "Line item"),
        quantity: Number(row.quantity || row.qty || 0) || null,
        amountKobo: Number(row.amount_kobo || row.total_kobo || 0) || null,
        note: typeof row.note === "string" ? row.note : typeof row.description === "string" ? row.description : null,
      };
    }).filter(Boolean) as Array<{ id: string; title: string; quantity: number | null; amountKobo: number | null; note: string | null }>;
  }
  if (value && typeof value === "object" && Array.isArray((value as Record<string, unknown>).items)) {
    return parseLineItems((value as Record<string, unknown>).items);
  }
  return [] as Array<{ id: string; title: string; quantity: number | null; amountKobo: number | null; note: string | null }>;
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const locale = await getAccountAppLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const tf = (template: string, values: Record<string, string | number>) =>
    formatSurfaceTemplate(template, values);
  const { invoiceId } = await params;
  const user = await requireAccountUser();
  const invoice = (await getInvoiceById(user.id, invoiceId)) as Record<string, unknown> | null;
  if (!invoice) {
    return <div className="space-y-4 acct-fade-in"><Link href="/invoices" className="acct-button-ghost w-fit rounded-xl"><ArrowLeft size={16} /> {t("Back to invoices")}</Link><div className="acct-empty py-20"><p className="text-sm text-[var(--acct-muted)]">{t("Invoice not found.")}</p></div></div>;
  }
  const workspaceHref = getInvoiceWorkspaceHref(typeof invoice.division === "string" ? invoice.division : null);
  const lineItems = parseLineItems(invoice.line_items);
  return (
    <div className="space-y-6 acct-fade-in">
      <Link href="/invoices" className="acct-button-ghost w-fit rounded-xl"><ArrowLeft size={16} /> {t("Back to invoices")}</Link>
      <PageHeader title={String(invoice.description || invoice.invoice_no || t("Invoice"))} description={t("Shared invoice record with status, payment references, and whatever structured receipt data is currently available.")} icon={Receipt} actions={workspaceHref ? <a href={workspaceHref} target="_blank" rel="noopener noreferrer" className="acct-button-primary rounded-xl">{t("Open division workspace")} <ExternalLink size={14} /></a> : undefined} />
      <div className="acct-card p-6">
        <div className="flex flex-wrap items-center gap-3"><span className={`acct-chip ${statusChip[String(invoice.status || "")] || "acct-chip-gold"}`}>{String(invoice.status || "Unknown")}</span><span className="text-sm text-[var(--acct-muted)]">{divisionLabel(String(invoice.division || "service"))}</span><span className="text-sm text-[var(--acct-muted)]">{String(invoice.invoice_no || "No invoice number")}</span></div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-[var(--acct-surface)] p-4"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">{t("Total")}</p><p className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{formatNaira(Number(invoice.total_kobo || 0))}</p></div>
          <div className="rounded-2xl bg-[var(--acct-surface)] p-4"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">{t("Subtotal")}</p><p className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{formatNaira(Number(invoice.subtotal_kobo || 0))}</p></div>
          <div className="rounded-2xl bg-[var(--acct-surface)] p-4"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">{t("Tax")}</p><p className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{formatNaira(Number(invoice.tax_kobo || 0))}</p></div>
          <div className="rounded-2xl bg-[var(--acct-surface)] p-4"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">{t("Due date")}</p><p className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{invoice.due_date ? formatDate(String(invoice.due_date)) : "—"}</p></div>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="acct-card p-5"><p className="acct-kicker">{t("Payment truth")}</p><div className="mt-4 space-y-3 text-sm text-[var(--acct-ink)]"><div><span className="font-semibold">{t("Created")}:</span> {invoice.created_at ? formatDateTime(String(invoice.created_at)) : "—"}</div><div><span className="font-semibold">{t("Paid at")}:</span> {invoice.paid_at ? formatDateTime(String(invoice.paid_at)) : "—"}</div><div><span className="font-semibold">{t("Payment method")}:</span> {String(invoice.payment_method || "—")}</div><div><span className="font-semibold">{t("Payment reference")}:</span> {String(invoice.payment_reference || "—")}</div></div></div>
        <div className="acct-card p-5"><p className="acct-kicker">{t("Reference linkage")}</p><div className="mt-4 space-y-3 text-sm text-[var(--acct-ink)]"><div><span className="font-semibold">{t("Reference type")}:</span> {String(invoice.reference_type || "—")}</div><div><span className="font-semibold">{t("Reference ID")}:</span> {String(invoice.reference_id || "—")}</div><p className="pt-2 text-sm leading-7 text-[var(--acct-muted)]">{t("Downloadable receipt files are not attached in the shared ledger yet unless a division publishes them explicitly. When none is attached here, the remaining work is division-side receipt publishing rather than account rendering.")}</p></div></div>
      </div>
      <div className="acct-card p-5">
        <p className="acct-kicker">{t("Line items")}</p>
        {lineItems.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--acct-muted)]">{t("No structured line items were published into the shared ledger for this invoice.")}</p>
        ) : (
          <div className="mt-4 space-y-3">
            {lineItems.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4 rounded-2xl bg-[var(--acct-surface)] p-4"><div><p className="text-sm font-semibold text-[var(--acct-ink)]">{item.title}</p>{item.note ? <p className="mt-1 text-xs text-[var(--acct-muted)]">{item.note}</p> : null}{item.quantity ? <p className="mt-1 text-[0.7rem] uppercase tracking-[0.14em] text-[var(--acct-muted)]">{tf("Qty {count}", { count: item.quantity })}</p> : null}</div><p className="text-sm font-semibold text-[var(--acct-ink)]">{item.amountKobo ? formatNaira(item.amountKobo) : "—"}</p></div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
