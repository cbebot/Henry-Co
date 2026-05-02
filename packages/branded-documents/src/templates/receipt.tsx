import * as React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

import { BrandedDocument } from "../components/BrandedDocument";
import { DataTable, type DataTableColumn } from "../components/DataTable";
import { DocumentSection, DefinitionList } from "../components/DocumentSection";
import { LegalFooter } from "../components/SignatureBlock";
import { formatDateTime, formatKobo, statusToLabel, titleCase } from "../format";
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
    taxKobo: number;
    totalKobo: number;
    currency: string;
    notes?: string | null;
  };
  customer: {
    name: string;
    email?: string | null;
    deliveryAddress?: string[] | null;
  };
  items: ReceiptLineItem[];
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
});

export function ReceiptDocument({ receipt, customer, items }: ReceiptProps) {
  const columns: Array<DataTableColumn<ReceiptLineItem>> = [
    { key: "title", header: "Item", flex: 3.2, render: (r) => r.title + (r.detail ? ` — ${r.detail}` : "") },
    { key: "qty", header: "Qty", flex: 0.6, align: "right", mono: true, render: (r) => (r.quantity ? String(r.quantity) : "—") },
    { key: "amount", header: "Amount", flex: 1.4, align: "right", mono: true, render: (r) => formatKobo(r.amountKobo, receipt.currency) },
  ];

  return (
    <BrandedDocument
      metadata={{
        title: `Receipt ${receipt.receiptNo}`,
        subject: "Payment receipt",
        keywords: ["receipt", "henryco", receipt.division, receipt.receiptNo],
      }}
      header={{
        documentType: "Receipt",
        title: receipt.receiptNo,
        subtitle: `Paid ${formatDateTime(receipt.paidAt)} · ${titleCase(receipt.paymentMethod)}`,
        meta: [
          { label: "Paid", value: formatDateTime(receipt.paidAt) },
          { label: "Method", value: titleCase(receipt.paymentMethod) },
          { label: "Reference", value: receipt.paymentReference ?? "—" },
        ],
        divisionLabel: titleCase(receipt.division),
      }}
      division={receipt.division}
    >
      <View style={styles.banner}>
        <Text style={styles.bannerLabel}>Total paid</Text>
        <Text style={styles.bannerValue}>{formatKobo(receipt.totalKobo, receipt.currency)}</Text>
      </View>

      <DocumentSection kicker="Customer">
        <DefinitionList
          rows={[
            { label: "Name", value: customer.name },
            { label: "Email", value: customer.email ?? "—" },
            { label: "Delivery", value: customer.deliveryAddress?.join(", ") ?? "—" },
          ]}
        />
      </DocumentSection>

      <DocumentSection kicker="What was paid">
        <DataTable columns={columns} rows={items} striped emptyMessage="No items recorded." />
      </DocumentSection>

      <DocumentSection kicker="Settlement">
        <DefinitionList
          rows={[
            { label: "Subtotal", value: formatKobo(receipt.subtotalKobo, receipt.currency), mono: true },
            { label: "Fees", value: formatKobo(receipt.feesKobo ?? 0, receipt.currency), mono: true },
            { label: "Tax", value: formatKobo(receipt.taxKobo, receipt.currency), mono: true },
            { label: "Total", value: formatKobo(receipt.totalKobo, receipt.currency), mono: true },
            { label: "Status", value: statusToLabel("paid") },
          ]}
        />
      </DocumentSection>

      {receipt.notes ? (
        <DocumentSection kicker="Notes" tone="elevated">
          <Text style={{ fontSize: typeScale.body, color: palette.inkSoft, fontFamily: "HenryCoSans" }}>{receipt.notes}</Text>
        </DocumentSection>
      ) : null}

      <LegalFooter
        lines={[
          "This receipt evidences payment captured by HenryCo on behalf of the originating division. Tax position reflects the rate in force on the paid date above.",
          "If you spot a discrepancy, contact HenryCo support within 7 days for the fastest resolution path.",
        ]}
      />
    </BrandedDocument>
  );
}
