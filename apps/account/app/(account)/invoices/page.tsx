import Link from "next/link";
import { Receipt } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getInvoices } from "@/lib/account-data";
import { formatNaira, formatDate, divisionLabel, divisionColor } from "@/lib/format";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/layout/EmptyState";

export const dynamic = "force-dynamic";
const statusChip: Record<string, string> = { paid: "acct-chip-green", pending: "acct-chip-orange", overdue: "acct-chip-red", draft: "acct-chip-blue", cancelled: "acct-chip-red", refunded: "acct-chip-purple" };

export default async function InvoicesPage() {
  const user = await requireAccountUser();
  const invoices = await getInvoices(user.id, 50);
  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader title="Invoices & Receipts" description="Shared payment ledger across HenryCo services. Open any item for amounts, dates, references, and next-step context." icon={Receipt} />
      {invoices.length === 0 ? (
        <EmptyState icon={Receipt} title="No invoices yet" description="Your invoices and receipts will appear here after making payments across HenryCo services." />
      ) : (
        <div className="acct-card divide-y divide-[var(--acct-line)]">
          {invoices.map((invoice: Record<string, string | number>) => (
            <Link key={invoice.id as string} href={`/invoices/${invoice.id}`} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--acct-surface)]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white" style={{ backgroundColor: divisionColor(invoice.division as string) }}>{divisionLabel(invoice.division as string).charAt(0)}</div>
              <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[var(--acct-ink)]">{invoice.description || `Invoice ${invoice.invoice_no}`}</p><p className="text-xs text-[var(--acct-muted)]">{invoice.invoice_no} · {divisionLabel(invoice.division as string)} · {formatDate(invoice.created_at as string)}</p></div>
              <div className="flex items-center gap-3"><span className={`acct-chip ${statusChip[invoice.status as string] || "acct-chip-gold"}`}>{invoice.status}</span><p className="text-sm font-semibold text-[var(--acct-ink)]">{formatNaira(invoice.total_kobo as number)}</p></div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
