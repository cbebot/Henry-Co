import * as React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { getBrandedDocumentsCopy, type AppLocale } from "@henryco/i18n";

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
  locale?: AppLocale;
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

export function ReceiptDocument({ receipt, customer, items, locale = "en" }: ReceiptProps) {
  const t = getBrandedDocumentsCopy(locale).receipt;
  const columns: Array<DataTableColumn<ReceiptLineItem>> = [
    { key: "title", header: t.columnItem, flex: 3.2, render: (r) => r.title + (r.detail ? ` — ${r.detail}` : "") },
    { key: "qty", header: t.columnQty, flex: 0.6, align: "right", mono: true, render: (r) => (r.quantity ? String(r.quantity) : "—") },
    { key: "amount", header: t.columnAmount, flex: 1.4, align: "right", mono: true, render: (r) => formatKobo(r.amountKobo, receipt.currency) },
  ];

  return (
    <BrandedDocument
      locale={locale}
      metadata={{
        title: `Receipt ${receipt.receiptNo}`,
        subject: t.subject,
        keywords: ["receipt", "henryco", receipt.division, receipt.receiptNo],
      }}
      header={{
        documentType: t.documentType,
        title: receipt.receiptNo,
        subtitle: t.subtitle(formatDateTime(receipt.paidAt), titleCase(receipt.paymentMethod)),
        meta: [
          { label: t.metaPaid, value: formatDateTime(receipt.paidAt) },
          { label: t.metaMethod, value: titleCase(receipt.paymentMethod) },
          { label: t.metaReference, value: receipt.paymentReference ?? "—" },
        ],
        divisionLabel: titleCase(receipt.division),
      }}
      division={receipt.division}
    >
      <View style={styles.banner}>
        <Text style={styles.bannerLabel}>{t.totalPaid}</Text>
        <Text style={styles.bannerValue}>{formatKobo(receipt.totalKobo, receipt.currency)}</Text>
      </View>

      <DocumentSection kicker={t.sectionCustomer}>
        <DefinitionList
          rows={[
            { label: t.rowName, value: customer.name },
            { label: t.rowEmail, value: customer.email ?? "—" },
            { label: t.rowDelivery, value: customer.deliveryAddress?.join(", ") ?? "—" },
          ]}
        />
      </DocumentSection>

      <DocumentSection kicker={t.sectionWhatPaid}>
        <DataTable columns={columns} rows={items} striped emptyMessage={t.emptyItems} />
      </DocumentSection>

      <DocumentSection kicker={t.sectionSettlement}>
        <DefinitionList
          rows={[
            { label: t.rowSubtotal, value: formatKobo(receipt.subtotalKobo, receipt.currency), mono: true },
            { label: t.rowFees, value: formatKobo(receipt.feesKobo ?? 0, receipt.currency), mono: true },
            { label: t.rowTax, value: formatKobo(receipt.taxKobo, receipt.currency), mono: true },
            { label: t.rowTotal, value: formatKobo(receipt.totalKobo, receipt.currency), mono: true },
            { label: t.rowStatus, value: statusToLabel("paid") },
          ]}
        />
      </DocumentSection>

      {receipt.notes ? (
        <DocumentSection kicker={t.sectionNotes} tone="elevated">
          <Text style={{ fontSize: typeScale.body, color: palette.inkSoft, fontFamily: "HenryCoSans" }}>{receipt.notes}</Text>
        </DocumentSection>
      ) : null}

      <LegalFooter lines={[t.legalLine1, t.legalLine2]} />
    </BrandedDocument>
  );
}
