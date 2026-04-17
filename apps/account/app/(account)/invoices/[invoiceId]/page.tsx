import Link from "next/link";
import { ArrowLeft, ExternalLink, Receipt } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getInvoiceById, getProfile } from "@/lib/account-data";
import { getInvoiceWorkspaceHref } from "@/lib/account-links";
import {
  buildCurrencyTruthFacts,
  buildCurrencyTruthMessage,
  formatPricingAmount,
  resolveAccountCurrencyTruth,
} from "@/lib/currency-truth";
import { divisionLabel, formatDate, formatDateTime } from "@/lib/format";
import { resolveAccountRegionalContext } from "@/lib/regional-context";
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
  const { invoiceId } = await params;
  const user = await requireAccountUser();
  const [invoice, profile] = await Promise.all([
    getInvoiceById(user.id, invoiceId),
    getProfile(user.id),
  ]);
  if (!invoice) {
    return <div className="space-y-4 acct-fade-in"><Link href="/invoices" className="acct-button-ghost w-fit rounded-xl"><ArrowLeft size={16} /> Back to invoices</Link><div className="acct-empty py-20"><p className="text-sm text-[var(--acct-muted)]">Invoice not found.</p></div></div>;
  }
  const region = resolveAccountRegionalContext({
    country: profile?.country as string | null | undefined,
    currency: profile?.currency as string | null | undefined,
    timezone: profile?.timezone as string | null | undefined,
    language: profile?.language as string | null | undefined,
  });
  const truth = resolveAccountCurrencyTruth(region, {
    pricingCurrency: String(invoice.pricing_currency || invoice.currency || "NGN"),
    settlementCurrency: String(invoice.settlement_currency || "NGN"),
    baseCurrency: String(invoice.base_currency || "NGN"),
    exchangeRateSource:
      typeof invoice.exchange_rate_source === "string" ? invoice.exchange_rate_source : null,
    exchangeRateTimestamp:
      typeof invoice.exchange_rate_timestamp === "string"
        ? invoice.exchange_rate_timestamp
        : null,
  });
  const workspaceHref = getInvoiceWorkspaceHref(typeof invoice.division === "string" ? invoice.division : null);
  const lineItems = parseLineItems(invoice.line_items);
  const currencyFacts = buildCurrencyTruthFacts(truth);
  return (
    <div className="space-y-6 acct-fade-in">
      <Link href="/invoices" className="acct-button-ghost w-fit rounded-xl"><ArrowLeft size={16} /> Back to invoices</Link>
      <PageHeader title={String(invoice.description || invoice.invoice_no || "Invoice")} description="Shared invoice record with status, payment references, and whatever structured receipt data is currently available." icon={Receipt} actions={workspaceHref ? <a href={workspaceHref} target="_blank" rel="noopener noreferrer" className="acct-button-primary rounded-xl">Open division workspace <ExternalLink size={14} /></a> : undefined} />
      <div className="acct-card p-6">
        <div className="flex flex-wrap items-center gap-3"><span className={`acct-chip ${statusChip[String(invoice.status || "")] || "acct-chip-gold"}`}>{String(invoice.status || "Unknown")}</span><span className="text-sm text-[var(--acct-muted)]">{divisionLabel(String(invoice.division || "service"))}</span><span className="text-sm text-[var(--acct-muted)]">{String(invoice.invoice_no || "No invoice number")}</span></div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-[var(--acct-surface)] p-4"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">Total</p><p className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{formatPricingAmount(Number(invoice.total_kobo || 0), truth)}</p></div>
          <div className="rounded-2xl bg-[var(--acct-surface)] p-4"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">Subtotal</p><p className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{formatPricingAmount(Number(invoice.subtotal_kobo || 0), truth)}</p></div>
          <div className="rounded-2xl bg-[var(--acct-surface)] p-4"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">Tax</p><p className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{formatPricingAmount(Number(invoice.tax_kobo || 0), truth)}</p></div>
          <div className="rounded-2xl bg-[var(--acct-surface)] p-4"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">Due date</p><p className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{invoice.due_date ? formatDate(String(invoice.due_date)) : "—"}</p></div>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="acct-card p-5"><p className="acct-kicker">Payment truth</p><div className="mt-4 space-y-3 text-sm text-[var(--acct-ink)]"><div><span className="font-semibold">Created:</span> {invoice.created_at ? formatDateTime(String(invoice.created_at)) : "—"}</div><div><span className="font-semibold">Paid at:</span> {invoice.paid_at ? formatDateTime(String(invoice.paid_at)) : "—"}</div><div><span className="font-semibold">Payment method:</span> {String(invoice.payment_method || "—")}</div><div><span className="font-semibold">Payment reference:</span> {String(invoice.payment_reference || "—")}</div><p className="pt-2 text-sm leading-7 text-[var(--acct-muted)]">{buildCurrencyTruthMessage(truth, { subject: "This invoice" })}</p></div></div>
        <div className="acct-card p-5"><p className="acct-kicker">Currency context</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{currencyFacts.map((fact) => <div key={fact.label} className="rounded-2xl bg-[var(--acct-surface)] p-4"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">{fact.label}</p><p className="mt-2 text-sm font-semibold text-[var(--acct-ink)]">{fact.value}</p></div>)}</div><p className="pt-4 text-sm leading-7 text-[var(--acct-muted)]">Downloadable receipt files are not attached in the shared ledger yet unless a division publishes them explicitly. When none is attached here, the remaining work is division-side receipt publishing rather than account rendering.</p></div>
      </div>
      <div className="acct-card p-5">
        <p className="acct-kicker">Line items</p>
        {lineItems.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--acct-muted)]">No structured line items were published into the shared ledger for this invoice.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {lineItems.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4 rounded-2xl bg-[var(--acct-surface)] p-4"><div><p className="text-sm font-semibold text-[var(--acct-ink)]">{item.title}</p>{item.note ? <p className="mt-1 text-xs text-[var(--acct-muted)]">{item.note}</p> : null}{item.quantity ? <p className="mt-1 text-[0.7rem] uppercase tracking-[0.14em] text-[var(--acct-muted)]">Qty {item.quantity}</p> : null}</div><p className="text-sm font-semibold text-[var(--acct-ink)]">{item.amountKobo ? formatPricingAmount(item.amountKobo, truth) : "—"}</p></div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
