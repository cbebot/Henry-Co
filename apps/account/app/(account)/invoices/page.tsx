import { translateSurfaceLabel, getAccountCopy } from "@henryco/i18n/server";

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
  const accountCopy = getAccountCopy(locale);
  const copy = accountCopy.invoices;
  const stats = invoiceStats(invoices);
  const headline =
    invoices.length === 0 ? copy.hero.headlineEmpty : copy.hero.headlineWithReceipts;
  const sectionMeta =
    invoices.length === 1
      ? `${invoices.length} ${copy.section.receiptsOnFileSingular}`
      : `${invoices.length} ${copy.section.receiptsOnFilePlural}`;

  return (
    <div className="acct-inv acct-fade-in">
      <InvoicesHero
        stats={stats}
        eyebrow={copy.hero.eyebrow}
        headline={headline}
        blurb={copy.hero.blurb}
        labels={{
          ariaOverview: copy.hero.ariaOverview,
          ariaTotals: copy.hero.ariaTotals,
          ariaByDivision: copy.hero.ariaByDivision,
          totalPaid: copy.hero.totalPaidLabel,
          thisMonth: copy.hero.thisMonthLabel,
          thisMonthFoot: copy.hero.thisMonthFoot,
          outstanding: copy.hero.outstandingLabel,
          paidCount: copy.hero.paidCountUnit,
          pendingCount: copy.hero.pendingCountUnit,
          overdueCount: copy.hero.overdueCountUnit,
          byDivision: copy.hero.byDivision,
          nothing: copy.hero.byDivisionEmpty,
        }}
        divisionLabels={copy.divisions}
      />
      <section aria-labelledby="acct-inv-list">
        <div className="acct-inv__section-head">
          <h2 id="acct-inv-list" className="acct-inv__section-title">
            {copy.section.title}
          </h2>
          <span className="acct-inv__section-meta">{sectionMeta}</span>
        </div>
        {invoices.length === 0 ? (
          <div className="acct-inv__empty">
            <strong>{copy.empty.title}</strong>
            {copy.empty.description}
          </div>
        ) : (
          <InvoicesList
            invoices={invoices}
            statusLabel={(status) => {
              const statuses = copy.statuses as Record<string, string>;
              return statuses[status] || copy.statuses.fallback;
            }}
            fallbackTitle={(invoiceNo) =>
              copy.list.fallbackTitle.replace("{number}", invoiceNo ?? "")
            }
            formatDate={(iso) => formatDate(iso, { locale })}
            ariaListLabel={copy.list.ariaLabel}
            rowAriaTemplate={copy.list.rowAriaLabel}
            divisionLabels={copy.divisions}
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
        {translateSurfaceLabel(locale, copy.footerNote)}
      </p>
    </div>
  );
}
