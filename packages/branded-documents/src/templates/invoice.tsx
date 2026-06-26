import * as React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { getBrandedDocumentsCopy, type AppLocale } from "@henryco/i18n";

import { BrandedDocument } from "../components/BrandedDocument";
import { DataTable, type DataTableColumn } from "../components/DataTable";
import { DocumentSection, DefinitionList } from "../components/DocumentSection";
import { LegalFooter } from "../components/SignatureBlock";
import { formatDate, formatDateTime, formatKobo, statusToLabel, titleCase } from "../format";
import { letterSpacing, palette, typeScale } from "../tokens";

export type InvoiceLineItem = {
  id: string;
  title: string;
  note?: string | null;
  quantity?: number | null;
  unitAmountKobo?: number | null;
  amountKobo: number;
};

export type InvoiceProps = {
  invoice: {
    id: string;
    invoiceNo: string;
    description: string;
    division: string | null;
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
    lineItems: InvoiceLineItem[];
  };
  customer: {
    name: string;
    email?: string | null;
    address?: string[] | null;
  };
  issuer: {
    name: string;
    addressLines: string[];
    rcNumber?: string | null;
    vatNumber?: string | null;
    contactEmail: string;
    contactPhone?: string | null;
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
  totalsRight: { width: 200 },
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
});

export function InvoiceDocument({ invoice, customer, issuer, locale = "en" }: InvoiceProps) {
  const copy = getBrandedDocumentsCopy(locale);
  const t = copy.invoice;
  const columns: Array<DataTableColumn<InvoiceLineItem>> = [
    { key: "title", header: t.columnItem, flex: 3, render: (r) => r.title + (r.note ? ` — ${r.note}` : "") },
    { key: "qty", header: t.columnQty, flex: 0.6, align: "right", mono: true, render: (r) => (r.quantity ? String(r.quantity) : "—") },
    { key: "unit", header: t.columnUnit, flex: 1, align: "right", mono: true, render: (r) => (r.unitAmountKobo != null ? formatKobo(r.unitAmountKobo, invoice.currency) : "—") },
    { key: "amount", header: t.columnAmount, flex: 1.3, align: "right", mono: true, render: (r) => formatKobo(r.amountKobo, invoice.currency) },
  ];

  return (
    <BrandedDocument
      locale={locale}
      metadata={{
        title: `Invoice ${invoice.invoiceNo}`,
        author: issuer.name,
        subject: invoice.description || `Invoice ${invoice.invoiceNo}`,
        keywords: ["invoice", invoice.division ?? "", "henryco", invoice.invoiceNo].filter(Boolean) as string[],
      }}
      header={{
        documentType: t.documentType,
        title: invoice.invoiceNo,
        subtitle: invoice.description,
        meta: [
          { label: t.metaIssued, value: formatDate(invoice.issuedAt) },
          { label: t.metaDue, value: invoice.dueAt ? formatDate(invoice.dueAt) : t.metaDueOnReceipt },
          { label: t.metaStatus, value: statusToLabel(invoice.status) },
        ],
        divisionLabel: invoice.division ? titleCase(invoice.division) : t.divisionGroup,
      }}
      division={invoice.division ?? undefined}
    >
      <View style={styles.parties}>
        <View style={styles.partyCol}>
          <Text style={styles.partyKicker}>{t.partyFrom}</Text>
          <Text style={styles.partyName}>{issuer.name}</Text>
          {issuer.addressLines.map((line) => (
            <Text key={line} style={styles.partyLine}>
              {line}
            </Text>
          ))}
          <Text style={styles.partyLine}>{issuer.contactEmail}</Text>
          {issuer.contactPhone ? <Text style={styles.partyLine}>{issuer.contactPhone}</Text> : null}
          {issuer.rcNumber ? <Text style={styles.partyLine}>{t.rcPrefix} {issuer.rcNumber}</Text> : null}
          {issuer.vatNumber ? <Text style={styles.partyLine}>{t.vatPrefix} {issuer.vatNumber}</Text> : null}
        </View>
        <View style={styles.partyCol}>
          <Text style={styles.partyKicker}>{t.partyBillTo}</Text>
          <Text style={styles.partyName}>{customer.name}</Text>
          {customer.email ? <Text style={styles.partyLine}>{customer.email}</Text> : null}
          {customer.address?.map((line) => (
            <Text key={line} style={styles.partyLine}>
              {line}
            </Text>
          ))}
        </View>
      </View>

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
        </View>
      </View>

      <LegalFooter lines={[t.legalLine1, t.legalLine2]} />
    </BrandedDocument>
  );
}
