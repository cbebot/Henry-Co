import { translateSurfaceLabel } from "@henryco/i18n/server";

import { requireAccountUser } from "@/lib/auth";
import { getInvoices } from "@/lib/account-data";
import { formatDate } from "@/lib/format";
import { getAccountAppLocale } from "@/lib/locale-server";

import "@/components/invoices/styles.css";
import { InvoicesHero } from "@/components/invoices/InvoicesHero";
import { InvoicesList } from "@/components/invoices/InvoicesList";
import {
  invoiceStats,
  type InvoiceRow,
} from "@/components/invoices/helpers";

export const dynamic = "force-dynamic";

type CopyShape = {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  fallbackInvoice: string;
  statuses: Record<string, string>;
  statusPending: string;
  eyebrow: string;
  headlineWithReceipts: string;
  headlineEmpty: string;
  blurbDefault: string;
  totalPaid: string;
  thisMonth: string;
  outstanding: string;
  paidLabel: string;
  pendingLabel: string;
  overdueLabel: string;
  byDivision: string;
  nothing: string;
  sectionTitle: string;
};

function getCopy(locale: string): CopyShape {
  if (locale === "fr") {
    return {
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
      eyebrow: "Factures · reçus",
      headlineWithReceipts: "Votre historique de paiements.",
      headlineEmpty: "Vos reçus apparaîtront ici.",
      blurbDefault:
        "Tous les paiements à travers HenryCo finissent ici en PDFs téléchargeables et de marque.",
      totalPaid: "Payé · à vie",
      thisMonth: "Payé · ce mois",
      outstanding: "En attente",
      paidLabel: "reçus",
      pendingLabel: "en attente",
      overdueLabel: "en retard",
      byDivision: "Par division",
      nothing: "Aucune facture pour le moment.",
      sectionTitle: "Toutes les factures",
    };
  }
  return {
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
    eyebrow: "Invoices · receipts",
    headlineWithReceipts: "Every receipt, one place.",
    headlineEmpty: "Receipts will land here.",
    blurbDefault:
      "Every payment across HenryCo arrives here as a branded, downloadable PDF — care bookings, marketplace orders, studio invoices, logistics shipments, learn certificates.",
    totalPaid: "Total paid · lifetime",
    thisMonth: "Paid · this month",
    outstanding: "Outstanding",
    paidLabel: "receipts",
    pendingLabel: "pending",
    overdueLabel: "overdue",
    byDivision: "By division",
    nothing: "No invoices yet.",
    sectionTitle: "All invoices",
  };
}

export default async function InvoicesPage() {
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const rawInvoices = await getInvoices(user.id, 50);
  const invoices: InvoiceRow[] = (rawInvoices as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id ?? ""),
    invoice_no: typeof row.invoice_no === "string" ? row.invoice_no : null,
    description: typeof row.description === "string" ? row.description : null,
    division: typeof row.division === "string" ? row.division : null,
    status: String(row.status ?? "").toLowerCase(),
    total_kobo: Number(row.total_kobo) || 0,
    created_at: String(row.created_at ?? ""),
  }));
  const copy = getCopy(locale);
  const stats = invoiceStats(invoices);
  const headline =
    invoices.length === 0 ? copy.headlineEmpty : copy.headlineWithReceipts;

  return (
    <div className="acct-inv acct-fade-in">
      <InvoicesHero
        stats={stats}
        eyebrow={copy.eyebrow}
        headline={headline}
        blurb={copy.blurbDefault}
        labels={{
          totalPaid: copy.totalPaid,
          thisMonth: copy.thisMonth,
          outstanding: copy.outstanding,
          paidCount: copy.paidLabel,
          pendingCount: copy.pendingLabel,
          overdueCount: copy.overdueLabel,
          byDivision: copy.byDivision,
          nothing: copy.nothing,
        }}
      />
      <section aria-labelledby="acct-inv-list">
        <div className="acct-inv__section-head">
          <h2 id="acct-inv-list" className="acct-inv__section-title">
            {copy.sectionTitle}
          </h2>
          <span className="acct-inv__section-meta">
            {invoices.length} {invoices.length === 1 ? "receipt" : "receipts"} on file
          </span>
        </div>
        {invoices.length === 0 ? (
          <div className="acct-inv__empty">
            <strong>{copy.emptyTitle}</strong>
            {copy.emptyDescription}
          </div>
        ) : (
          <InvoicesList
            invoices={invoices}
            statusLabel={(status) =>
              copy.statuses[status as keyof typeof copy.statuses] || copy.statusPending
            }
            fallbackTitle={(invoiceNo) =>
              copy.fallbackInvoice.replace("{number}", invoiceNo ?? "")
            }
            formatDate={(iso) => formatDate(iso, { locale })}
          />
        )}
      </section>
      <p
        style={{
          fontSize: 11,
          color: "var(--acct-muted)",
          textAlign: "center",
          margin: "8px 0 0",
        }}
      >
        {translateSurfaceLabel(locale, "Receipts download as branded PDFs.")}
      </p>
    </div>
  );
}
