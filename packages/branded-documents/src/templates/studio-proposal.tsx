import * as React from "react";
import { Text, View, StyleSheet } from "@react-pdf/renderer";
import { getBrandedDocumentsCopy, type AppLocale } from "@henryco/i18n";

import { BrandedDocument } from "../components/BrandedDocument";
import { DocumentSection, DefinitionList } from "../components/DocumentSection";
import { DataTable, type DataTableColumn } from "../components/DataTable";
import { LegalFooter } from "../components/SignatureBlock";
import {
  formatDate,
  formatDateTime,
  formatKobo,
  statusToLabel,
} from "../format";
import { letterSpacing, palette, typeScale } from "../tokens";

/**
 * V3 PASS 21 — StudioProposalDocument PDF template.
 *
 * Used by the e-signature flow on /client/proposals/[id]/accept and the
 * proposal-sent email attachment. Renders:
 *   - Proposal number + status + valid-until
 *   - Studio team + client parties
 *   - Project scope bullets
 *   - Milestones (name + due + amount)
 *   - Investment + deposit breakdown
 *   - Signature block (signed_at, signed_by_name, signed_by_email,
 *     provider, ip_address) when present
 *   - Legal footer
 */

export type StudioProposalMilestone = {
  id: string;
  name: string;
  description?: string | null;
  dueLabel?: string | null;
  amountKobo: number;
};

export type StudioProposalProps = {
  proposal: {
    id: string;
    proposalNumber: string;
    title: string;
    summary: string;
    status: string;
    investmentKobo: number;
    depositKobo: number;
    currency: string;
    validUntil: string;
    issuedAt: string;
    scopeBullets: string[];
    deliverables?: string[] | null;
    timelineLabel?: string | null;
    serviceLabel?: string | null;
    packageLabel?: string | null;
    teamLabel?: string | null;
    milestones?: StudioProposalMilestone[] | null;
  };
  client: {
    name: string;
    email?: string | null;
    organisation?: string | null;
  };
  studio: {
    name: string;
    addressLines: string[];
    contactEmail: string;
    contactPhone?: string | null;
    rcNumber?: string | null;
  };
  signature?: {
    signedAt: string;
    signedByName?: string | null;
    signedByEmail?: string | null;
    provider: string;
    ipAddress?: string | null;
    locale?: string | null;
  } | null;
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
  scopeItem: {
    fontSize: typeScale.body,
    fontFamily: "HenryCoSans",
    color: palette.ink,
    marginVertical: 3,
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
  signatureBlock: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: palette.line,
    paddingTop: 16,
  },
  signatureRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  signatureLabel: {
    fontSize: typeScale.body,
    fontFamily: "HenryCoSans",
    color: palette.inkSoft,
  },
  signatureValue: {
    fontSize: typeScale.body,
    fontFamily: "HenryCoMono",
    color: palette.ink,
  },
});

export function StudioProposalDocument({ proposal, client, studio, signature, locale = "en" }: StudioProposalProps) {
  const t = getBrandedDocumentsCopy(locale).studioProposal;
  const milestoneColumns: Array<DataTableColumn<StudioProposalMilestone>> = [
    {
      key: "name",
      header: t.columnMilestone,
      flex: 3,
      render: (r) => r.name + (r.description ? ` — ${r.description}` : ""),
    },
    {
      key: "due",
      header: t.columnDue,
      flex: 1.2,
      render: (r) => r.dueLabel ?? "—",
    },
    {
      key: "amount",
      header: t.columnAmount,
      flex: 1.3,
      align: "right",
      mono: true,
      render: (r) => formatKobo(r.amountKobo, proposal.currency),
    },
  ];

  return (
    <BrandedDocument
      locale={locale}
      metadata={{
        title: `Proposal ${proposal.proposalNumber}`,
        author: studio.name,
        subject: proposal.title,
        keywords: ["proposal", "studio", "henryco", proposal.proposalNumber],
      }}
      header={{
        documentType: t.documentType,
        title: proposal.proposalNumber,
        subtitle: proposal.title,
        meta: [
          { label: t.metaIssued, value: formatDate(proposal.issuedAt) },
          { label: t.metaValidUntil, value: formatDate(proposal.validUntil) },
          { label: t.metaStatus, value: statusToLabel(proposal.status) },
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
        </View>
        <View style={styles.partyCol}>
          <Text style={styles.partyKicker}>{t.partyPreparedFor}</Text>
          <Text style={styles.partyName}>{client.name}</Text>
          {client.organisation ? <Text style={styles.partyLine}>{client.organisation}</Text> : null}
          {client.email ? <Text style={styles.partyLine}>{client.email}</Text> : null}
        </View>
      </View>

      <DocumentSection kicker={t.sectionEngagement}>
        <DefinitionList
          rows={[
            { label: t.rowService, value: proposal.serviceLabel ?? "—" },
            { label: t.rowPackage, value: proposal.packageLabel ?? "—" },
            { label: t.rowTeam, value: proposal.teamLabel ?? "—" },
            { label: t.rowTimeline, value: proposal.timelineLabel ?? "—" },
          ]}
        />
      </DocumentSection>

      <DocumentSection kicker={t.sectionScope}>
        {proposal.scopeBullets.length > 0 ? (
          proposal.scopeBullets.map((bullet, idx) => (
            <Text key={`${idx}-${bullet}`} style={styles.scopeItem}>
              {`•  ${bullet}`}
            </Text>
          ))
        ) : (
          <Text style={styles.scopeItem}>{t.scopeFallback}</Text>
        )}
      </DocumentSection>

      {proposal.deliverables && proposal.deliverables.length > 0 ? (
        <DocumentSection kicker={t.sectionDeliverables}>
          {proposal.deliverables.map((line, idx) => (
            <Text key={`${idx}-${line}`} style={styles.scopeItem}>
              {`•  ${line}`}
            </Text>
          ))}
        </DocumentSection>
      ) : null}

      {proposal.milestones && proposal.milestones.length > 0 ? (
        <DocumentSection kicker={t.sectionMilestones}>
          <DataTable columns={milestoneColumns} rows={proposal.milestones} emptyMessage={t.emptyMilestones} />
        </DocumentSection>
      ) : null}

      <View style={styles.totalsBlock}>
        <View style={styles.totalsLeft}>
          <DefinitionList
            rows={[
              { label: t.rowDepositDue, value: formatKobo(proposal.depositKobo, proposal.currency), mono: true },
              { label: t.rowCurrency, value: proposal.currency },
              { label: t.rowValidUntil, value: formatDate(proposal.validUntil) },
            ]}
          />
        </View>
        <View style={styles.totalsRight}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t.totalInvestment}</Text>
            <Text style={styles.totalValue}>{formatKobo(proposal.investmentKobo, proposal.currency)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t.totalDeposit}</Text>
            <Text style={styles.totalValue}>{formatKobo(proposal.depositKobo, proposal.currency)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.grandLabel}>{t.totalBalance}</Text>
            <Text style={styles.grandValue}>
              {formatKobo(Math.max(proposal.investmentKobo - proposal.depositKobo, 0), proposal.currency)}
            </Text>
          </View>
        </View>
      </View>

      {signature ? (
        <View style={styles.signatureBlock}>
          <Text style={styles.partyKicker}>{t.signed}</Text>
          <View style={styles.signatureRow}>
            <Text style={styles.signatureLabel}>{t.signedAt}</Text>
            <Text style={styles.signatureValue}>{formatDateTime(signature.signedAt)}</Text>
          </View>
          {signature.signedByName ? (
            <View style={styles.signatureRow}>
              <Text style={styles.signatureLabel}>{t.signedBy}</Text>
              <Text style={styles.signatureValue}>{signature.signedByName}</Text>
            </View>
          ) : null}
          {signature.signedByEmail ? (
            <View style={styles.signatureRow}>
              <Text style={styles.signatureLabel}>{t.signedEmail}</Text>
              <Text style={styles.signatureValue}>{signature.signedByEmail}</Text>
            </View>
          ) : null}
          <View style={styles.signatureRow}>
            <Text style={styles.signatureLabel}>{t.signedProvider}</Text>
            <Text style={styles.signatureValue}>{signature.provider}</Text>
          </View>
          {signature.ipAddress ? (
            <View style={styles.signatureRow}>
              <Text style={styles.signatureLabel}>{t.signedIp}</Text>
              <Text style={styles.signatureValue}>{signature.ipAddress}</Text>
            </View>
          ) : null}
          {signature.locale ? (
            <View style={styles.signatureRow}>
              <Text style={styles.signatureLabel}>{t.signedLocale}</Text>
              <Text style={styles.signatureValue}>{signature.locale}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <LegalFooter lines={[t.legalLine1, t.legalLine2]} />
    </BrandedDocument>
  );
}
