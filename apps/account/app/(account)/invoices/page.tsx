import { Receipt } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import { requireAccountUser } from "@/lib/auth";
import { getInvoices } from "@/lib/account-data";
import { formatNaira, formatDate, divisionLabel, divisionColor } from "@/lib/format";
import { getAccountAppLocale } from "@/lib/locale-server";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/layout/EmptyState";

export const dynamic = "force-dynamic";

const statusChip: Record<string, string> = {
  paid: "acct-chip-green",
  pending: "acct-chip-orange",
  overdue: "acct-chip-red",
  draft: "acct-chip-blue",
  cancelled: "acct-chip-red",
  refunded: "acct-chip-purple",
};

export default async function InvoicesPage() {
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const invoices = await getInvoices(user.id, 50);
  const copy =
    locale === "fr"
      ? {
          title: "Factures et reçus",
          description: "Votre historique de paiements et vos reçus téléchargeables.",
          emptyTitle: "Aucune facture pour le moment",
          emptyDescription:
            "Vos factures et reçus apparaîtront ici après vos paiements dans les services HenryCo.",
          fallbackInvoice: "Facture {number}",
          statuses: {
            paid: "Payée",
            pending: "En attente",
            overdue: "En retard",
            draft: "Brouillon",
            cancelled: "Annulée",
            refunded: "Remboursée",
          },
          statusPending: "Statut en attente",
        }
      : {
          title: "Invoices & Receipts",
          description: "Your payment history and downloadable receipts.",
          emptyTitle: "No invoices yet",
          emptyDescription:
            "Your invoices and receipts will appear here after making payments across HenryCo services.",
          fallbackInvoice: "Invoice {number}",
          statuses: {
            paid: "Paid",
            pending: "Pending",
            overdue: "Overdue",
            draft: "Draft",
            cancelled: "Cancelled",
            refunded: "Refunded",
          },
          statusPending: "Status pending",
        };

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title={copy.title}
        description={copy.description}
        icon={Receipt}
      />

      {invoices.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={copy.emptyTitle}
          description={copy.emptyDescription}
        />
      ) : (
        <div className="acct-card divide-y divide-[var(--acct-line)]">
          {invoices.map((inv: Record<string, string | number>) => (
            <div key={inv.id as string} className="flex items-center gap-4 px-5 py-4">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                style={{ backgroundColor: divisionColor(inv.division as string) }}
              >
                {divisionLabel(inv.division as string).charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--acct-ink)]">
                  {inv.description || copy.fallbackInvoice.replace("{number}", String(inv.invoice_no || ""))}
                </p>
                <p className="text-xs text-[var(--acct-muted)]">
                  {inv.invoice_no} &middot; {translateSurfaceLabel(locale, divisionLabel(inv.division as string))} &middot;{" "}
                  {formatDate(inv.created_at as string, { locale })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`acct-chip ${statusChip[inv.status as string] || "acct-chip-gold"}`}>
                  {copy.statuses[inv.status as keyof typeof copy.statuses] || copy.statusPending}
                </span>
                <p className="text-sm font-semibold text-[var(--acct-ink)]">
                  {formatNaira(inv.total_kobo as number, { locale })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
