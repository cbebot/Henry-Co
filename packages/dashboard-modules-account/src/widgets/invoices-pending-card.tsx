import { MetricCard } from "@henryco/dashboard-shell/components";
import { Receipt } from "lucide-react";
import type { CustomerOverviewSnapshot } from "../data";

/**
 * InvoicesPendingCard — surfaces the recent-invoices count and
 * pending-invoice context. Deep-links to `/invoices`. The
 * `/invoices/[invoiceId]` detail surface consumes
 * `@henryco/branded-documents` `DownloadDocumentButton` (V2-DOCS-01)
 * — that integration lives at the destination, not the widget.
 */
export function InvoicesPendingCard({
  snapshot,
}: {
  snapshot: CustomerOverviewSnapshot;
}) {
  const recent = snapshot.summary.recentInvoices.length;
  const pending = snapshot.summary.pendingInvoiceCount;
  return (
    <MetricCard
      label="Invoices"
      value={recent.toString()}
      href="/invoices"
      icon={<Receipt size={18} aria-hidden />}
      context={
        pending > 0
          ? {
              kind: "trend",
              direction: "up",
              magnitude: `${pending} pending download`,
            }
          : recent > 0
            ? {
                kind: "trend",
                direction: "flat",
                magnitude: "All settled · download anytime",
              }
            : {
                kind: "trend",
                direction: "flat",
                magnitude: "No invoices yet",
              }
      }
    />
  );
}
