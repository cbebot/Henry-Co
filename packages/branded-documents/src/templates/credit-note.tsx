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

/**
 * V3-19 — credit note: the legal face of a provider-CONFIRMED refund.
 *
 * Mirrors the receipt template's structure (banner · parties · items ·
 * settlement · audit tie · legal footer) so the two read as one document
 * family. Differences are semantic, not stylistic:
 *   - the banner is the AMOUNT CREDITED (money that LEFT the platform);
 *   - the header references the ORIGINAL receipt (`refundOf` + receipt no);
 *   - the VAT line is the POSTED output-VAT reversal for this refund — the
 *     issuing RPC rejects any figure the ledger did not record;
 *   - the audit tie carries the refund row + the refund-settlement ledger
 *     entry (not the charge posting).
 * The processor is NEVER named (ANTI-CLONE Principle 9): only the instrument
 * and the raw transaction reference appear. Money figures are never localized.
 */
export type CreditNoteLineItem = {
  id: string;
  title: string;
  detail?: string | null;
  amountKobo: number;
};

export type CreditNoteProps = {
  creditNote: {
    id: string;
    creditNoteNo: string;
    /** The original receipt this credit note refunds (HO-RCT-…), when one exists. */
    receiptNo?: string | null;
    division: string;
    refundedAt: string;
    paymentMethod: string;
    paymentReference?: string | null;
    subtotalKobo: number;
    /** VAT reversed in kobo. A line renders ONLY when this is > 0. */
    taxKobo: number;
    totalKobo: number;
    currency: string;
    /** The payment_intent the refunded charge settled (money-truth tie). */
    paymentIntentId?: string | null;
    /** The payment_refunds row this document evidences (money-truth tie). */
    refundId?: string | null;
    /** The posted refund-settlement journal entry (money-truth tie). */
    ledgerEntryId?: string | null;
  };
  /** Legal issuer — sourced from @henryco/config (Henry Onyx Limited + RC + office). */
  issuer: DocumentIssuerDetails;
  customer: {
    name: string;
    email?: string | null;
  };
  items: CreditNoteLineItem[];
  /** Localized static labels — resolved by the app from @henryco/i18n. */
  labels: PaymentDocumentLabels;
};

const styles = StyleSheet.create({
  banner: {
    marginTop: 16,
    backgroundColor: palette.ink,
    color: palette.copper,
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
    color: palette.copper,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: letterSpacing.kicker * 6,
  },
  bannerValue: {
    fontSize: typeScale.subhead,
    fontFamily: "HenryCoMono",
    color: palette.paper,
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

export function CreditNoteDocument({ creditNote, issuer, customer, items, labels }: CreditNoteProps) {
  const method = resolvePaymentMethodLabel(creditNote.paymentMethod, labels);
  const hasVat = (creditNote.taxKobo ?? 0) > 0;

  const columns: Array<DataTableColumn<CreditNoteLineItem>> = [
    { key: "title", header: labels.colItem, flex: 3.8, render: (r) => r.title + (r.detail ? ` — ${r.detail}` : "") },
    { key: "amount", header: labels.colAmount, flex: 1.4, align: "right", mono: true, render: (r) => formatKobo(r.amountKobo, creditNote.currency) },
  ];

  // Settlement rows: VAT only appears when a reversal was actually posted.
  const settlementRows: Array<{ label: string; value: string; mono?: boolean }> = [
    { label: labels.subtotal, value: formatKobo(creditNote.subtotalKobo, creditNote.currency), mono: true },
  ];
  if (hasVat) settlementRows.push({ label: labels.vat, value: formatKobo(creditNote.taxKobo, creditNote.currency), mono: true });
  settlementRows.push({ label: labels.total, value: formatKobo(creditNote.totalKobo, creditNote.currency), mono: true });
  settlementRows.push({ label: labels.metaStatus, value: labels.statusRefunded });

  // Audit tie: refund row + posted refund-settlement entry + the intent.
  const auditParts = [
    creditNote.paymentIntentId ? `intent ${creditNote.paymentIntentId}` : null,
    creditNote.refundId ? `refund ${creditNote.refundId}` : null,
    creditNote.ledgerEntryId ? `ledger ${creditNote.ledgerEntryId}` : null,
  ].filter(Boolean);

  const meta: Array<{ label: string; value: string }> = [
    { label: labels.metaRefunded, value: formatDateTime(creditNote.refundedAt) },
    { label: labels.metaMethod, value: method },
    { label: labels.metaReference, value: creditNote.paymentReference ?? "—" },
  ];
  if (creditNote.receiptNo) {
    meta.push({ label: labels.refundOf, value: creditNote.receiptNo });
  }

  return (
    <BrandedDocument
      metadata={{
        title: `${labels.creditNoteType} ${creditNote.creditNoteNo}`,
        author: issuer.name,
        subject: labels.creditNoteType,
        keywords: [
          "credit-note",
          creditNote.division,
          creditNote.creditNoteNo,
          creditNote.receiptNo ? `receipt:${creditNote.receiptNo}` : "",
          creditNote.paymentIntentId ? `intent:${creditNote.paymentIntentId}` : "",
          creditNote.refundId ? `refund:${creditNote.refundId}` : "",
          creditNote.ledgerEntryId ? `ledger:${creditNote.ledgerEntryId}` : "",
        ].filter(Boolean),
      }}
      header={{
        documentType: labels.creditNoteType,
        title: creditNote.creditNoteNo,
        subtitle: `${labels.metaRefunded} ${formatDateTime(creditNote.refundedAt)} · ${method}`,
        meta,
        divisionLabel: issuer.divisionLabel,
      }}
      division={creditNote.division}
    >
      <View style={styles.banner}>
        <Text style={styles.bannerLabel}>{labels.totalCredited}</Text>
        <Text style={styles.bannerValue}>{formatKobo(creditNote.totalKobo, creditNote.currency)}</Text>
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
        </View>
      </View>

      <DocumentSection kicker={labels.creditNoteItemsSection}>
        <DataTable columns={columns} rows={items} striped emptyMessage={labels.creditNoteItemsEmpty} />
      </DocumentSection>

      <DocumentSection kicker={labels.settlement}>
        <DefinitionList rows={settlementRows} />
      </DocumentSection>

      {auditParts.length ? (
        <Text style={styles.audit}>{`${labels.auditReference} · ${auditParts.join(" · ")}`}</Text>
      ) : null}

      <LegalFooter
        lines={[
          interpolateLegalLine(labels.creditNoteLegal1, { issuer: issuer.name, email: issuer.contactEmail }),
          interpolateLegalLine(labels.creditNoteLegal2, { issuer: issuer.name, email: issuer.contactEmail }),
        ]}
      />
    </BrandedDocument>
  );
}
