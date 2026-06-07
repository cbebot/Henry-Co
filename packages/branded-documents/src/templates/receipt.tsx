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
} from "../payment-document-labels";
import { formatDateTime, formatKobo } from "../format";
import { letterSpacing, palette, typeScale } from "../tokens";

export type ReceiptLineItem = {
  id: string;
  title: string;
  detail?: string | null;
  quantity?: number | null;
  amountKobo: number;
};

export type ReceiptProps = {
  receipt: {
    id: string;
    receiptNo: string;
    division: string;
    paidAt: string;
    paymentMethod: string;
    paymentReference?: string | null;
    subtotalKobo: number;
    feesKobo?: number | null;
    /** VAT/tax in kobo. A line renders ONLY when this is > 0 (V3-18: no VAT in the breakdown → no VAT line). */
    taxKobo: number;
    totalKobo: number;
    currency: string;
    notes?: string | null;
    /** The payment_intent this receipt evidences (money-truth tie). */
    paymentIntentId?: string | null;
    /** The posted ledger journal entry that confirmed the payment (money-truth tie). */
    ledgerEntryId?: string | null;
  };
  /** Legal issuer — sourced from @henryco/config (Henry Onyx Limited + RC + office). */
  issuer: DocumentIssuerDetails;
  customer: {
    name: string;
    email?: string | null;
    deliveryAddress?: string[] | null;
  };
  items: ReceiptLineItem[];
  /** Localized static labels — resolved by the app from @henryco/i18n. */
  labels: PaymentDocumentLabels;
};

const styles = StyleSheet.create({
  banner: {
    marginTop: 16,
    backgroundColor: palette.copper,
    color: palette.ink,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bannerLabel: {
    fontSize: typeScale.hairline,
    fontFamily: "HenryCoSans",
    color: "#3A2D08",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: letterSpacing.kicker * 6,
  },
  bannerValue: {
    fontSize: typeScale.subhead,
    fontFamily: "HenryCoMono",
    color: "#1A1814",
    fontWeight: 700,
  },
  parties: { flexDirection: "row", justifyContent: "space-between", marginTop: 22, gap: 28 },
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
    marginBottom: 2,
  },
  partyLine: {
    fontSize: typeScale.body,
    fontFamily: "HenryCoSans",
    color: palette.inkSoft,
    lineHeight: 1.4,
  },
  audit: {
    marginTop: 14,
    fontSize: typeScale.hairline,
    fontFamily: "HenryCoMono",
    color: palette.inkMuted,
  },
});

export function ReceiptDocument({ receipt, issuer, customer, items, labels }: ReceiptProps) {
  const method = resolvePaymentMethodLabel(receipt.paymentMethod, labels);
  const hasVat = (receipt.taxKobo ?? 0) > 0;
  const hasFees = (receipt.feesKobo ?? 0) > 0;

  const columns: Array<DataTableColumn<ReceiptLineItem>> = [
    { key: "title", header: labels.colItem, flex: 3.2, render: (r) => r.title + (r.detail ? ` — ${r.detail}` : "") },
    { key: "qty", header: labels.colQty, flex: 0.6, align: "right", mono: true, render: (r) => (r.quantity ? String(r.quantity) : "—") },
    { key: "amount", header: labels.colAmount, flex: 1.4, align: "right", mono: true, render: (r) => formatKobo(r.amountKobo, receipt.currency) },
  ];

  // Settlement rows are conditional: fees and VAT only appear when real.
  const settlementRows: Array<{ label: string; value: string; mono?: boolean }> = [
    { label: labels.subtotal, value: formatKobo(receipt.subtotalKobo, receipt.currency), mono: true },
  ];
  if (hasFees) settlementRows.push({ label: labels.fees, value: formatKobo(receipt.feesKobo ?? 0, receipt.currency), mono: true });
  if (hasVat) settlementRows.push({ label: labels.vat, value: formatKobo(receipt.taxKobo, receipt.currency), mono: true });
  settlementRows.push({ label: labels.total, value: formatKobo(receipt.totalKobo, receipt.currency), mono: true });
  settlementRows.push({ label: labels.metaStatus, value: labels.statusPaid });

  // Audit tie: the real payment_intent + posted ledger entry this receipt evidences.
  const auditParts = [
    receipt.paymentIntentId ? `intent ${receipt.paymentIntentId}` : null,
    receipt.ledgerEntryId ? `ledger ${receipt.ledgerEntryId}` : null,
  ].filter(Boolean);

  return (
    <BrandedDocument
      metadata={{
        title: `${labels.receiptType} ${receipt.receiptNo}`,
        author: issuer.name,
        subject: labels.receiptType,
        keywords: [
          "receipt",
          receipt.division,
          receipt.receiptNo,
          receipt.paymentIntentId ? `intent:${receipt.paymentIntentId}` : "",
          receipt.ledgerEntryId ? `ledger:${receipt.ledgerEntryId}` : "",
        ].filter(Boolean),
      }}
      header={{
        documentType: labels.receiptType,
        title: receipt.receiptNo,
        subtitle: `${labels.metaPaid} ${formatDateTime(receipt.paidAt)} · ${method}`,
        meta: [
          { label: labels.metaPaid, value: formatDateTime(receipt.paidAt) },
          { label: labels.metaMethod, value: method },
          { label: labels.metaReference, value: receipt.paymentReference ?? "—" },
        ],
        divisionLabel: issuer.divisionLabel,
      }}
      division={receipt.division}
    >
      <View style={styles.banner}>
        <Text style={styles.bannerLabel}>{labels.totalPaid}</Text>
        <Text style={styles.bannerValue}>{formatKobo(receipt.totalKobo, receipt.currency)}</Text>
      </View>

      <View style={styles.parties}>
        <View style={styles.partyCol}>
          <Text style={styles.partyKicker}>{labels.issuedBy}</Text>
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
          <Text style={styles.partyKicker}>{labels.billedTo}</Text>
          <Text style={styles.partyName}>{customer.name}</Text>
          {customer.email ? <Text style={styles.partyLine}>{customer.email}</Text> : null}
          {customer.deliveryAddress?.map((line) => (
            <Text key={line} style={styles.partyLine}>
              {line}
            </Text>
          ))}
        </View>
      </View>

      <DocumentSection kicker={labels.receiptItemsSection}>
        <DataTable columns={columns} rows={items} striped emptyMessage={labels.receiptItemsEmpty} />
      </DocumentSection>

      <DocumentSection kicker={labels.settlement}>
        <DefinitionList rows={settlementRows} />
      </DocumentSection>

      {receipt.notes ? (
        <DocumentSection kicker={labels.notes} tone="elevated">
          <Text style={{ fontSize: typeScale.body, color: palette.inkSoft, fontFamily: "HenryCoSans" }}>{receipt.notes}</Text>
        </DocumentSection>
      ) : null}

      {auditParts.length ? (
        <Text style={styles.audit}>{`${labels.auditReference} · ${auditParts.join(" · ")}`}</Text>
      ) : null}

      <LegalFooter
        lines={[
          interpolateLegalLine(labels.receiptLegal1, { issuer: issuer.name, email: issuer.contactEmail }),
          interpolateLegalLine(labels.receiptLegal2, { issuer: issuer.name, email: issuer.contactEmail }),
        ]}
      />
    </BrandedDocument>
  );
}
