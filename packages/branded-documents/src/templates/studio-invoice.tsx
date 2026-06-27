import * as React from "react";
import { Text, View, StyleSheet } from "@react-pdf/renderer";
import { getBrandedDocumentsCopy, type AppLocale } from "@henryco/i18n";

import { BrandedDocument } from "../components/BrandedDocument";
import { DataTable, type DataTableColumn } from "../components/DataTable";
import { DocumentSection, DefinitionList } from "../components/DocumentSection";
import { LegalFooter } from "../components/SignatureBlock";
import {
  formatDate,
  formatDateTime,
  formatKobo,
  statusToLabel,
} from "../format";
import { letterSpacing, palette, typeScale } from "../tokens";

/**
 * V3 PASS 21 — StudioInvoiceDocument PDF template.
 *
 * Differs from the generic InvoiceDocument:
 *   - Studio is service-business shaped: line items are milestones,
 *     phases, or fixed bills (no qty/unit pricing).
 *   - Adds the linked project + payment-plan context so the client can
 *     map the invoice back to a deliverable.
 *   - Supports multi-currency settlement: invoice currency may be USD
 *     while paid currency is NGN; both rendered when paidCurrency
 *     differs from invoice.currency.
 */

export type StudioInvoiceLineItem = {
  id: string;
  title: string;
  note?: string | null;
  milestoneLabel?: string | null;
  amountKobo: number;
};

export type StudioInvoiceProps = {
  invoice: {
    id: string;
    invoiceNumber: string;
    description: string;
    status: string;
    issuedAt: string;
    dueAt?: string | null;
    paidAt?: string | null;
    paymentMethod?: string | null;
    paymentReference?: string | null;
    subtotalKobo: number;
    taxKobo: number;
    discountKobo?: number | null;
    totalKobo: number;
    currency: string;
    paidKobo?: number | null;
    paidCurrency?: string | null;
    fxRate?: number | null;
    lineItems: StudioInvoiceLineItem[];
  };
  project: {
    id: string;
    title: string;
    paymentPlanName?: string | null;
    nextMilestone?: string | null;
  };
  client: {
    name: string;
    email?: string | null;
    organisation?: string | null;
    addressLines?: string[] | null;
  };
  studio: {
    name: string;
    addressLines: string[];
    contactEmail: string;
    contactPhone?: string | null;
    rcNumber?: string | null;
    vatNumber?: string | null;
  };
  locale?: AppLocale;
};

const styles = StyleSheet.create({
  parties: { flexDirection: "row", justifyContent: "space-between", marginTop: 16, gap: 28 },
  partyCol: { flex: 1 },
  partyKicker: {
    fontSize: typeScale.hairline,
    fontFamily: "HenryCoSans",
    color: palette.copperDeep,
    textTransform: "uppercase",
    letterSpacing: letterSpacing.kicker * 6,
    fontWeight: 700,
  },
  partyName: {
    fontSize: typeScale.bodyLarge,
    fontFamily: "HenryCoSerif",
    fontWeight: 600,
    color: palette.ink,
    marginTop: 4,
  },
  partyLine: {
    fontSize: typeScale.body,
    fontFamily: "HenryCoSans",
    color: palette.inkSoft,
    lineHeight: 1.5,
  },
  totalsBlock: {
    marginTop: 18,
    backgroundColor: palette.paperElev,
    borderRadius: 8,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalsLeft: { flex: 1 },
  totalsRight: { width: 220 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  totalLabel: {
    fontSize: typeScale.body,
    fontFamily: "HenryCoSans",
    color: palette.inkSoft,
  },
  totalValue: { fontSize: typeScale.body, fontFamily: "HenryCoMono", color: palette.ink },
  grandLabel: {
    fontSize: typeScale.bodyLarge,
    fontFamily: "HenryCoSerif",
    color: palette.ink,
    fontWeight: 700,
    marginTop: 6,
  },
  grandValue: {
    fontSize: typeScale.subhead,
    fontFamily: "HenryCoMono",
    color: palette.ink,
    fontWeight: 700,
    marginTop: 6,
  },
  fxNote: {
    fontSize: typeScale.hairline,
    fontFamily: "HenryCoSans",
    color: palette.inkSoft,
    marginTop: 6,
    lineHeight: 1.4,
  },
});

export function StudioInvoiceDocument({ invoice, project, client, studio, locale = "en" }: StudioInvoiceProps) {
  const t = getBrandedDocumentsCopy(locale).studioInvoice;
  const columns: Array<DataTableColumn<StudioInvoiceLineItem>> = [
    {
      key: "title",
      header: t.columnDescription,
      flex: 3,
      render: (r) => r.title + (r.note ? ` — ${r.note}` : ""),
    },
    {
      key: "milestone",
      header: t.columnMilestone,
      flex: 1.4,
      render: (r) => r.milestoneLabel ?? "—",
    },
    {
      key: "amount",
      header: t.columnAmount,
      flex: 1.3,
      align: "right",
      mono: true,
      render: (r) => formatKobo(r.amountKobo, invoice.currency),
    },
  ];

  const paidInForeign =
    invoice.paidKobo != null &&
    invoice.paidCurrency != null &&
    invoice.paidCurrency.toLowerCase() !== invoice.currency.toLowerCase();

  return (
    <BrandedDocument
      locale={locale}
      metadata={{
        title: `Invoice ${invoice.invoiceNumber}`,
        author: studio.name,
        subject: invoice.description || t.subject(invoice.invoiceNumber),
        keywords: ["invoice", "studio", "henryco", invoice.invoiceNumber],
      }}
      header={{
        documentType: t.documentType,
        title: invoice.invoiceNumber,
        subtitle: invoice.description || project.title,
        meta: [
          { label: t.metaIssued, value: formatDate(invoice.issuedAt) },
          { label: t.metaDue, value: invoice.dueAt ? formatDate(invoice.dueAt) : t.metaDueOnReceipt },
          { label: t.metaStatus, value: statusToLabel(invoice.status) },
        ],
        divisionLabel: t.divisionLabel,
      }}
      division="studio"
    >
      <View style={styles.parties}>
        <View style={styles.partyCol}>
          <Text style={styles.partyKicker}>{t.partyFrom}</Text>
          <Text style={styles.partyName}>{studio.name}</Text>
          {studio.addressLines.map((line) => (
            <Text key={line} style={styles.partyLine}>
              {line}
            </Text>
          ))}
          <Text style={styles.partyLine}>{studio.contactEmail}</Text>
          {studio.contactPhone ? <Text style={styles.partyLine}>{studio.contactPhone}</Text> : null}
          {studio.rcNumber ? <Text style={styles.partyLine}>{t.rcPrefix} {studio.rcNumber}</Text> : null}
          {studio.vatNumber ? <Text style={styles.partyLine}>{t.vatPrefix} {studio.vatNumber}</Text> : null}
        </View>
        <View style={styles.partyCol}>
          <Text style={styles.partyKicker}>{t.partyBillTo}</Text>
          <Text style={styles.partyName}>{client.name}</Text>
          {client.organisation ? <Text style={styles.partyLine}>{client.organisation}</Text> : null}
          {client.email ? <Text style={styles.partyLine}>{client.email}</Text> : null}
          {client.addressLines?.map((line) => (
            <Text key={line} style={styles.partyLine}>
              {line}
            </Text>
          ))}
        </View>
      </View>

      <DocumentSection kicker={t.sectionProject}>
        <DefinitionList
          rows={[
            { label: t.rowProject, value: project.title },
            { label: t.rowPaymentPlan, value: project.paymentPlanName ?? "—" },
            { label: t.rowNextMilestone, value: project.nextMilestone ?? "—" },
          ]}
        />
      </DocumentSection>

      <DocumentSection kicker={t.sectionLineItems}>
        <DataTable columns={columns} rows={invoice.lineItems} emptyMessage={t.emptyLineItems} />
      </DocumentSection>

      <View style={styles.totalsBlock}>
        <View style={styles.totalsLeft}>
          <DefinitionList
            rows={[
              { label: t.paymentStatus, value: statusToLabel(invoice.status) },
              { label: t.paymentMethod, value: invoice.paymentMethod ?? "—" },
              { label: t.paymentReference, value: invoice.paymentReference ?? "—", mono: true },
              { label: t.paidAt, value: invoice.paidAt ? formatDateTime(invoice.paidAt) : "—" },
            ]}
          />
        </View>
        <View style={styles.totalsRight}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t.subtotal}</Text>
            <Text style={styles.totalValue}>{formatKobo(invoice.subtotalKobo, invoice.currency)}</Text>
          </View>
          {invoice.discountKobo ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t.discount}</Text>
              <Text style={styles.totalValue}>−{formatKobo(invoice.discountKobo, invoice.currency)}</Text>
            </View>
          ) : null}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t.tax}</Text>
            <Text style={styles.totalValue}>{formatKobo(invoice.taxKobo, invoice.currency)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.grandLabel}>{t.total}</Text>
            <Text style={styles.grandValue}>{formatKobo(invoice.totalKobo, invoice.currency)}</Text>
          </View>
          {paidInForeign ? (
            <Text style={styles.fxNote}>
              {t.settledAs(formatKobo(invoice.paidKobo ?? 0, invoice.paidCurrency ?? invoice.currency))}
              {invoice.fxRate
                ? t.fxAt(invoice.fxRate.toFixed(4), invoice.paidCurrency ?? invoice.currency, invoice.currency)
                : ""}
            </Text>
          ) : null}
        </View>
      </View>

      <LegalFooter lines={[t.legalLine1, t.legalLine2]} />
    </BrandedDocument>
  );
}
