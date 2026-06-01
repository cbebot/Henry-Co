import * as React from "react";
import { Text, View, StyleSheet } from "@react-pdf/renderer";

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

export function StudioInvoiceDocument({ invoice, project, client, studio }: StudioInvoiceProps) {
  const columns: Array<DataTableColumn<StudioInvoiceLineItem>> = [
    {
      key: "title",
      header: "Description",
      flex: 3,
      render: (r) => r.title + (r.note ? ` — ${r.note}` : ""),
    },
    {
      key: "milestone",
      header: "Milestone",
      flex: 1.4,
      render: (r) => r.milestoneLabel ?? "—",
    },
    {
      key: "amount",
      header: "Amount",
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
      metadata={{
        title: `Invoice ${invoice.invoiceNumber}`,
        author: studio.name,
        subject: invoice.description || `Invoice ${invoice.invoiceNumber}`,
        keywords: ["invoice", "studio", "henryco", invoice.invoiceNumber],
      }}
      header={{
        documentType: "Invoice",
        title: invoice.invoiceNumber,
        subtitle: invoice.description || project.title,
        meta: [
          { label: "Issued", value: formatDate(invoice.issuedAt) },
          { label: "Due", value: invoice.dueAt ? formatDate(invoice.dueAt) : "On receipt" },
          { label: "Status", value: statusToLabel(invoice.status) },
        ],
        divisionLabel: "Studio",
      }}
      division="studio"
    >
      <View style={styles.parties}>
        <View style={styles.partyCol}>
          <Text style={styles.partyKicker}>From</Text>
          <Text style={styles.partyName}>{studio.name}</Text>
          {studio.addressLines.map((line) => (
            <Text key={line} style={styles.partyLine}>
              {line}
            </Text>
          ))}
          <Text style={styles.partyLine}>{studio.contactEmail}</Text>
          {studio.contactPhone ? <Text style={styles.partyLine}>{studio.contactPhone}</Text> : null}
          {studio.rcNumber ? <Text style={styles.partyLine}>RC: {studio.rcNumber}</Text> : null}
          {studio.vatNumber ? <Text style={styles.partyLine}>VAT: {studio.vatNumber}</Text> : null}
        </View>
        <View style={styles.partyCol}>
          <Text style={styles.partyKicker}>Bill to</Text>
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

      <DocumentSection kicker="Project">
        <DefinitionList
          rows={[
            { label: "Project", value: project.title },
            { label: "Payment plan", value: project.paymentPlanName ?? "—" },
            { label: "Next milestone", value: project.nextMilestone ?? "—" },
          ]}
        />
      </DocumentSection>

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
          {paidInForeign ? (
            <Text style={styles.fxNote}>
              {`Settled as ${formatKobo(invoice.paidKobo ?? 0, invoice.paidCurrency ?? invoice.currency)}`}
              {invoice.fxRate ? ` at ${invoice.fxRate.toFixed(4)} ${invoice.paidCurrency}/${invoice.currency}` : ""}
            </Text>
          ) : null}
        </View>
      </View>

      <LegalFooter
        lines={[
          "Issued by Henry Holdings Limited through HenryCo Studio billing. Multi-currency settlement is captured at the gateway rate on the day of payment; both invoice currency and settled currency are recorded for audit.",
          "Disputes must be raised within seven calendar days of issue. Late payment may attract reminder schedule per the engagement agreement.",
        ]}
      />
    </BrandedDocument>
  );
}
