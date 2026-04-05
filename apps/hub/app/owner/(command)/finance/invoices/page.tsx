import DivisionBadge from "@/components/owner/DivisionBadge";
import StatusBadge from "@/components/owner/StatusBadge";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { getFinanceCenterData } from "@/lib/owner-data";
import { formatCurrencyAmount, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FinanceInvoicesPage() {
  const data = await getFinanceCenterData();

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow="Invoices"
        title="Invoice pressure and payment follow-up"
        description="Shared platform invoices still waiting for resolution appear here with their division context and payment status."
      />

      <OwnerPanel title="Pending invoices" description="Invoices still marked pending or overdue.">
        <table className="owner-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Division</th>
              <th>Status</th>
              <th>Total</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {data.pendingInvoices.map((invoice) => (
              <tr key={String(invoice.id)}>
                <td>{String(invoice.invoice_no || invoice.description || "Invoice")}</td>
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
