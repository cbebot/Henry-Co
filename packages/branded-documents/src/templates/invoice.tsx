import * as React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

import { BrandedDocument } from "../components/BrandedDocument";
import { DataTable, type DataTableColumn } from "../components/DataTable";
import { DocumentSection, DefinitionList } from "../components/DocumentSection";
import { LegalFooter } from "../components/SignatureBlock";
import {
  type DocumentIssuerDetails,
  type PaymentDocumentLabels,
  interpolateLegalLine,
  resolvePaymentMethodLabel,
  resolveStatusLabel,
} from "../payment-document-labels";
import { formatDate, formatDateTime, formatKobo } from "../format";
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
    /** VAT/tax in kobo. A line renders ONLY when this is > 0 (V3-18: no VAT in the breakdown → no VAT line). */
    taxKobo: number;
    discountKobo?: number | null;
    totalKobo: number;
    currency: string;
    lineItems: InvoiceLineItem[];
    /** The payment_intent this invoice is settled by (money-truth tie). */
    paymentIntentId?: string | null;
    /** The posted ledger journal entry that confirmed settlement (money-truth tie). */
    ledgerEntryId?: string | null;
  };
  customer: {
    name: string;
    email?: string | null;
    address?: string[] | null;
  };
  /** Legal issuer — sourced from @henryco/config (Henry Onyx Limited + RC + office). */
  issuer: DocumentIssuerDetails;
  /** Localized static labels — resolved by the app from @henryco/i18n. */
  labels: PaymentDocumentLabels;
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
  partySub: {
    fontSize: typeScale.caption,
    fontFamily: "HenryCoSans",
    color: palette.copperDeep,
    marginTop: 1,
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
  audit: {
    marginTop: 14,
    fontSize: typeScale.hairline,
    fontFamily: "HenryCoMono",
    color: palette.inkMuted,
  },
});

export function InvoiceDocument({ invoice, customer, issuer, labels }: InvoiceProps) {
  const hasVat = (invoice.taxKobo ?? 0) > 0;
  const hasDiscount = (invoice.discountKobo ?? 0) > 0;
  const statusLabel = resolveStatusLabel(invoice.status, labels);
  const methodLabel = invoice.paymentMethod ? resolvePaymentMethodLabel(invoice.paymentMethod, labels) : "—";

  const columns: Array<DataTableColumn<InvoiceLineItem>> = [
    { key: "title", header: labels.colItem, flex: 3, render: (r) => r.title + (r.note ? ` — ${r.note}` : "") },
    { key: "qty", header: labels.colQty, flex: 0.6, align: "right", mono: true, render: (r) => (r.quantity ? String(r.quantity) : "—") },
    { key: "unit", header: labels.colUnit, flex: 1, align: "right", mono: true, render: (r) => (r.unitAmountKobo != null ? formatKobo(r.unitAmountKobo, invoice.currency) : "—") },
    { key: "amount", header: labels.colAmount, flex: 1.3, align: "right", mono: true, render: (r) => formatKobo(r.amountKobo, invoice.currency) },
  ];

  const auditParts = [
    invoice.paymentIntentId ? `intent ${invoice.paymentIntentId}` : null,
    invoice.ledgerEntryId ? `ledger ${invoice.ledgerEntryId}` : null,
  ].filter(Boolean);

  return (
    <BrandedDocument
      metadata={{
        title: `${labels.invoiceType} ${invoice.invoiceNo}`,
        author: issuer.name,
        subject: invoice.description || `${labels.invoiceType} ${invoice.invoiceNo}`,
        keywords: [
          "invoice",
          invoice.division ?? "",
          invoice.invoiceNo,
          invoice.paymentIntentId ? `intent:${invoice.paymentIntentId}` : "",
          invoice.ledgerEntryId ? `ledger:${invoice.ledgerEntryId}` : "",
        ].filter(Boolean),
      }}
      header={{
        documentType: labels.invoiceType,
        title: invoice.invoiceNo,
        subtitle: invoice.description,
        meta: [
          { label: labels.metaIssued, value: formatDate(invoice.issuedAt) },
          { label: labels.metaDue, value: invoice.dueAt ? formatDate(invoice.dueAt) : labels.metaOnReceipt },
          { label: labels.metaStatus, value: statusLabel },
        ],
        divisionLabel: issuer.divisionLabel,
      }}
      division={invoice.division ?? undefined}
    >
      <View style={styles.parties}>
        <View style={styles.partyCol}>
          <Text style={styles.partyKicker}>{labels.from}</Text>
          <Text style={styles.partyName}>{issuer.name}</Text>
          {issuer.divisionLabel ? <Text style={styles.partySub}>{issuer.divisionLabel}</Text> : null}
          {issuer.addressLines.map((line) => (
            <Text key={line} style={styles.partyLine}>
              {line}
            </Text>
          ))}
          <Text style={styles.partyLine}>{issuer.contactEmail}</Text>
          {issuer.contactPhone ? <Text style={styles.partyLine}>{issuer.contactPhone}</Text> : null}
          {issuer.rcNumber ? <Text style={styles.partyLine}>{`${labels.rc} ${issuer.rcNumber}`}</Text> : null}
          {issuer.vatNumber ? <Text style={styles.partyLine}>{`${labels.vatId} ${issuer.vatNumber}`}</Text> : null}
        </View>
        <View style={styles.partyCol}>
          <Text style={styles.partyKicker}>{labels.billTo}</Text>
          <Text style={styles.partyName}>{customer.name}</Text>
          {customer.email ? <Text style={styles.partyLine}>{customer.email}</Text> : null}
          {customer.address?.map((line) => (
            <Text key={line} style={styles.partyLine}>
              {line}
            </Text>
          ))}
        </View>
      </View>

      <DocumentSection kicker={labels.invoiceItemsSection}>
        <DataTable columns={columns} rows={invoice.lineItems} emptyMessage={labels.invoiceItemsEmpty} />
      </DocumentSection>

      <View style={styles.totalsBlock}>
        <View style={styles.totalsLeft}>
          <DefinitionList
            rows={[
              { label: labels.paymentStatus, value: statusLabel },
              { label: labels.paymentMethod, value: methodLabel },
              { label: labels.paymentReference, value: invoice.paymentReference ?? "—", mono: true },
              { label: labels.paidAt, value: invoice.paidAt ? formatDateTime(invoice.paidAt) : "—" },
            ]}
          />
        </View>
        <View style={styles.totalsRight}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{labels.subtotal}</Text>
            <Text style={styles.totalValue}>{formatKobo(invoice.subtotalKobo, invoice.currency)}</Text>
          </View>
          {hasDiscount ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{labels.discount}</Text>
              <Text style={styles.totalValue}>−{formatKobo(invoice.discountKobo ?? 0, invoice.currency)}</Text>
            </View>
          ) : null}
          {hasVat ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{labels.vat}</Text>
              <Text style={styles.totalValue}>{formatKobo(invoice.taxKobo, invoice.currency)}</Text>
            </View>
          ) : null}
          <View style={styles.totalRow}>
            <Text style={styles.grandLabel}>{labels.total}</Text>
            <Text style={styles.grandValue}>{formatKobo(invoice.totalKobo, invoice.currency)}</Text>
          </View>
        </View>
      </View>

      {auditParts.length ? (
        <Text style={styles.audit}>{`${labels.auditReference} · ${auditParts.join(" · ")}`}</Text>
      ) : null}

      <LegalFooter
        lines={[
          interpolateLegalLine(labels.invoiceLegal1, { issuer: issuer.name, email: issuer.contactEmail }),
          interpolateLegalLine(labels.invoiceLegal2, { issuer: issuer.name, email: issuer.contactEmail }),
        ]}
      />
    </BrandedDocument>
  );
}
