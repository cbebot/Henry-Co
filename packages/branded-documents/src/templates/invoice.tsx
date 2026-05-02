import * as React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

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

export function InvoiceDocument({ invoice, customer, issuer }: InvoiceProps) {
  const columns: Array<DataTableColumn<InvoiceLineItem>> = [
    { key: "title", header: "Item", flex: 3, render: (r) => r.title + (r.note ? ` — ${r.note}` : "") },
    { key: "qty", header: "Qty", flex: 0.6, align: "right", mono: true, render: (r) => (r.quantity ? String(r.quantity) : "—") },
    { key: "unit", header: "Unit", flex: 1, align: "right", mono: true, render: (r) => (r.unitAmountKobo != null ? formatKobo(r.unitAmountKobo, invoice.currency) : "—") },
    { key: "amount", header: "Amount", flex: 1.3, align: "right", mono: true, render: (r) => formatKobo(r.amountKobo, invoice.currency) },
  ];

  return (
    <BrandedDocument
      metadata={{
        title: `Invoice ${invoice.invoiceNo}`,
        author: issuer.name,
        subject: invoice.description || `Invoice ${invoice.invoiceNo}`,
        keywords: ["invoice", invoice.division ?? "", "henryco", invoice.invoiceNo].filter(Boolean) as string[],
      }}
      header={{
        documentType: "Invoice",
        title: invoice.invoiceNo,
        subtitle: invoice.description,
        meta: [
          { label: "Issued", value: formatDate(invoice.issuedAt) },
          { label: "Due", value: invoice.dueAt ? formatDate(invoice.dueAt) : "On receipt" },
          { label: "Status", value: statusToLabel(invoice.status) },
        ],
        divisionLabel: titleCase(invoice.division ?? "Group"),
      }}
      division={invoice.division ?? undefined}
    >
      <View style={styles.parties}>
        <View style={styles.partyCol}>
          <Text style={styles.partyKicker}>From</Text>
          <Text style={styles.partyName}>{issuer.name}</Text>
          {issuer.addressLines.map((line) => (
            <Text key={line} style={styles.partyLine}>
              {line}
            </Text>
          ))}
          <Text style={styles.partyLine}>{issuer.contactEmail}</Text>
          {issuer.contactPhone ? <Text style={styles.partyLine}>{issuer.contactPhone}</Text> : null}
          {issuer.rcNumber ? <Text style={styles.partyLine}>RC: {issuer.rcNumber}</Text> : null}
          {issuer.vatNumber ? <Text style={styles.partyLine}>VAT: {issuer.vatNumber}</Text> : null}
        </View>
        <View style={styles.partyCol}>
          <Text style={styles.partyKicker}>Bill to</Text>
          <Text style={styles.partyName}>{customer.name}</Text>
          {customer.email ? <Text style={styles.partyLine}>{customer.email}</Text> : null}
          {customer.address?.map((line) => (
            <Text key={line} style={styles.partyLine}>
              {line}
            </Text>
          ))}
        </View>
      </View>

      <DocumentSection kicker="Line items">
        <DataTable columns={columns} rows={invoice.lineItems} emptyMessage="No structured line items recorded." />
      </DocumentSection>

      <View style={styles.totalsBlock}>
        <View style={styles.totalsLeft}>
          <DefinitionList
            rows={[
              { label: "Payment status", value: statusToLabel(invoice.status) },
              { label: "Payment method", value: invoice.paymentMethod ?? "—" },
              { label: "Payment reference", value: invoice.paymentReference ?? "—", mono: true },
              { label: "Paid at", value: invoice.paidAt ? formatDateTime(invoice.paidAt) : "—" },
            ]}
          />
        </View>
        <View style={styles.totalsRight}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatKobo(invoice.subtotalKobo, invoice.currency)}</Text>
          </View>
          {invoice.discountKobo ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={styles.totalValue}>−{formatKobo(invoice.discountKobo, invoice.currency)}</Text>
            </View>
          ) : null}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax</Text>
            <Text style={styles.totalValue}>{formatKobo(invoice.taxKobo, invoice.currency)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.grandLabel}>Total</Text>
            <Text style={styles.grandValue}>{formatKobo(invoice.totalKobo, invoice.currency)}</Text>
          </View>
        </View>
      </View>

      <LegalFooter
        lines={[
          "This invoice is issued under HenryCo unified billing. The originating division remains the source of truth for delivery, dispute, and refund terms.",
          "Payments are recognised once the originating gateway confirms settlement; the status above reflects the most recent reconciliation snapshot.",
        ]}
      />
    </BrandedDocument>
  );
}
