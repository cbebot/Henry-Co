import { translateSurfaceLabel, getAccountCopy } from "@henryco/i18n/server";
import {
  HeroCard,
  EmptyStateCard,
  NextStepRow,
  DivisionLanding,
  type HeroCardTile,
  type HeroCardBreakdownRow,
} from "@henryco/dashboard-shell/surfaces";

import { requireAccountUser } from "@/lib/auth";
import { getInvoices } from "@/lib/account-data";
import { formatDate } from "@/lib/format";
import { getAccountAppLocale } from "@/lib/locale-server";

import "@/components/invoices/styles.css";
import { InvoicesList } from "@/components/invoices/InvoicesList";
import {
  formatKoboCompact,
  invoiceStats,
  type InvoiceRow,
} from "@/components/invoices/helpers";

export const dynamic = "force-dynamic";

/**
 * Invoices landing.
 *
 * ACCOUNT-PREMIUM-01 (session 2, Phase 2C). Lifts InvoicesHero into the
 * shared <HeroCard /> primitive and surfaces a NextStepRow when there's an
 * overdue invoice.
 */
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

  // ── State picker ─────────────────────────────────────────────────
  const heroTone: "calm" | "active" | "attention" | "empty" =
    invoices.length === 0
      ? "empty"
      : stats.overdueCount > 0
        ? "attention"
        : stats.pendingCount > 0
          ? "active"
          : "calm";

  const headline =
    invoices.length === 0 ? copy.hero.headlineEmpty : copy.hero.headlineWithReceipts;

  // ── Tiles ────────────────────────────────────────────────────────
  const tiles: ReadonlyArray<HeroCardTile> = [
    {
      label: copy.hero.totalPaidLabel,
      value: `₦${formatKoboCompact(stats.totalPaidKobo)}`,
      foot: `${stats.paidCount} ${copy.hero.paidCountUnit}`,
    },
    {
      label: copy.hero.thisMonthLabel,
      value: `₦${formatKoboCompact(stats.thisMonthPaidKobo)}`,
      foot: copy.hero.thisMonthFoot,
    },
    {
      label: copy.hero.outstandingLabel,
      value: `₦${formatKoboCompact(stats.outstandingKobo)}`,
      foot: `${stats.pendingCount} ${copy.hero.pendingCountUnit}${
        stats.overdueCount > 0 ? ` · ${stats.overdueCount} ${copy.hero.overdueCountUnit}` : ""
      }`,
      tone: stats.overdueCount > 0 ? "warning" : stats.pendingCount > 0 ? "active" : "default",
    },
  ];

  // ── Breakdown (by division) ──────────────────────────────────────
  const divisionLabels = copy.divisions as Record<string, string>;
  const breakdown: ReadonlyArray<HeroCardBreakdownRow> = stats.divisions.map((d) => ({
    label: divisionLabels[d.key] ?? d.label,
    count: d.count,
    color: d.color,
  }));

  // ── NextStepRow: pick first overdue invoice ──────────────────────
  let nextStep: React.ReactNode = null;
  const overdue = invoices.find((inv) => inv.status === "overdue");
  if (overdue) {
    nextStep = (
      <NextStepRow
        tone="attention"
        kicker={copy.hero.overdueCountUnit}
        title={
          overdue.invoice_no
            ? copy.list.fallbackTitle.replace("{number}", overdue.invoice_no)
            : (overdue.description ?? copy.hero.outstandingLabel)
        }
        detail={`₦${formatKoboCompact(overdue.total_kobo)}`}
        cta={{
          label: translateSurfaceLabel(locale, "Settle now"),
          href: `/invoices/${overdue.id}`,
        }}
      />
    );
  }

  const sectionMeta =
    invoices.length === 1
      ? `${invoices.length} ${copy.section.receiptsOnFileSingular}`
      : `${invoices.length} ${copy.section.receiptsOnFilePlural}`;

  return (
    <DivisionLanding
      className="acct-inv acct-fade-in"
      hero={
        <HeroCard
          variant="paired"
          tone={heroTone}
          eyebrow={copy.hero.eyebrow}
          headline={headline}
          blurb={copy.hero.blurb}
          ariaLabel={copy.hero.ariaOverview}
          ariaTilesLabel={copy.hero.ariaTotals}
          tiles={tiles}
          side={{
            kicker: copy.hero.byDivision,
            title: copy.hero.byDivision,
            body:
              stats.totalCount > 0
                ? `${stats.totalCount} ${stats.totalCount === 1 ? copy.section.receiptsOnFileSingular : copy.section.receiptsOnFilePlural}`
                : copy.hero.byDivisionEmpty,
            breakdown:
              breakdown.length > 0
                ? {
                    label: copy.hero.byDivision,
                    rows: breakdown,
                    ariaLabel: copy.hero.ariaByDivision,
                  }
                : undefined,
          }}
        />
      }
      nextStep={nextStep}
      sections={[
        {
          id: "acct-inv-list",
          title: copy.section.title,
          meta: sectionMeta,
          content:
            invoices.length === 0 ? (
              <EmptyStateCard
                kicker={copy.hero.eyebrow}
                title={copy.empty.title}
                body={copy.empty.description}
              />
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
            ),
        },
      ]}
      footer={
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
      }
    />
  );
}
