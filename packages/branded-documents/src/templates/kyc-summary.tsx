import * as React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

import { BrandedDocument } from "../components/BrandedDocument";
import { DataTable, type DataTableColumn } from "../components/DataTable";
import { DocumentSection, DefinitionList } from "../components/DocumentSection";
import { LegalFooter } from "../components/SignatureBlock";
import { formatDateTime, statusToLabel, titleCase } from "../format";
import { letterSpacing, palette, typeScale } from "../tokens";

export type KycSubmissionRow = {
  id: string;
  documentType: string;
  status: string;
  submittedAt: string;
  reviewedAt?: string | null;
  reviewerNote?: string | null;
};

export type KycSummaryProps = {
  user: { id: string; name: string; email?: string | null };
  status: string;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewerNote?: string | null;
  submissions: KycSubmissionRow[];
};

const styles = StyleSheet.create({
  notice: {
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: palette.paperElev,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: palette.copperDeep,
  },
  noticeKicker: {
    fontSize: typeScale.hairline,
    fontFamily: "HenryCoSans",
    color: palette.copperDeep,
    textTransform: "uppercase",
    letterSpacing: letterSpacing.kicker * 6,
    fontWeight: 700,
  },
  noticeBody: {
    marginTop: 4,
    fontSize: typeScale.body,
    color: palette.inkSoft,
    fontFamily: "HenryCoSans",
    lineHeight: 1.5,
  },
});

export function KycSummaryDocument({ user, status, submittedAt, reviewedAt, reviewerNote, submissions }: KycSummaryProps) {
  const columns: Array<DataTableColumn<KycSubmissionRow>> = [
    { key: "type", header: "Document", flex: 2, render: (r) => titleCase(r.documentType) },
    { key: "status", header: "Status", flex: 1, render: (r) => statusToLabel(r.status) },
    { key: "submitted", header: "Submitted", flex: 1.4, render: (r) => formatDateTime(r.submittedAt), mono: true },
    { key: "reviewed", header: "Reviewed", flex: 1.4, render: (r) => (r.reviewedAt ? formatDateTime(r.reviewedAt) : "—"), mono: true },
    { key: "note", header: "Reviewer note", flex: 2.2, render: (r) => r.reviewerNote ?? "—" },
  ];

  return (
    <BrandedDocument
      metadata={{
        title: `KYC summary · ${user.name}`,
        subject: "Identity verification summary",
        keywords: ["kyc", "verification", "henryco", user.id],
      }}
      header={{
        documentType: "Identity verification summary",
        title: user.name,
        subtitle: `Status · ${statusToLabel(status)}`,
        meta: [
          { label: "Submitted", value: submittedAt ? formatDateTime(submittedAt) : "—" },
          { label: "Reviewed", value: reviewedAt ? formatDateTime(reviewedAt) : "—" },
        ],
        divisionLabel: "Trust & Compliance",
      }}
      division="account"
    >
      <View style={styles.notice}>
        <Text style={styles.noticeKicker}>Privacy posture</Text>
        <Text style={styles.noticeBody}>
          This summary records what was submitted and how the HenryCo trust team has reviewed it. The underlying ID
          documents are never embedded in this PDF — only the metadata you see below.
        </Text>
      </View>

      <DocumentSection kicker="Account holder" tone="elevated">
        <DefinitionList
          rows={[
            { label: "Name", value: user.name },
            { label: "Email", value: user.email ?? "—" },
            { label: "Account ID", value: user.id, mono: true },
            { label: "Overall status", value: statusToLabel(status) },
          ]}
        />
      </DocumentSection>

      <DocumentSection kicker="Submissions">
        <DataTable columns={columns} rows={submissions} emptyMessage="No KYC submissions on file." />
      </DocumentSection>

      {reviewerNote ? (
        <DocumentSection kicker="Reviewer note" tone="accent">
          <Text style={{ fontSize: typeScale.body, color: palette.inkSoft, fontFamily: "HenryCoSans", lineHeight: 1.5 }}>
            {reviewerNote}
          </Text>
        </DocumentSection>
      ) : null}

      <LegalFooter
        lines={[
          "HenryCo retains identity documents only as long as required by Nigerian law and applicable KYC obligations. This summary is your audit-trail copy and does not include the document images themselves.",
          "If you need to update an ID, do so from your HenryCo account verification page; the original record will then move to historical state and a new entry will replace it in this view.",
        ]}
      />
    </BrandedDocument>
  );
}
