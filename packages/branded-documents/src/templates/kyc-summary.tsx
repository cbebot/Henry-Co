import * as React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { getBrandedDocumentsCopy, type AppLocale } from "@henryco/i18n";

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
  locale?: AppLocale;
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

export function KycSummaryDocument({ user, status, submittedAt, reviewedAt, reviewerNote, submissions, locale = "en" }: KycSummaryProps) {
  const t = getBrandedDocumentsCopy(locale).kyc;
  const columns: Array<DataTableColumn<KycSubmissionRow>> = [
    { key: "type", header: t.columnDocument, flex: 2, render: (r) => titleCase(r.documentType) },
    { key: "status", header: t.columnStatus, flex: 1, render: (r) => statusToLabel(r.status) },
    { key: "submitted", header: t.columnSubmitted, flex: 1.4, render: (r) => formatDateTime(r.submittedAt), mono: true },
    { key: "reviewed", header: t.columnReviewed, flex: 1.4, render: (r) => (r.reviewedAt ? formatDateTime(r.reviewedAt) : "—"), mono: true },
    { key: "note", header: t.columnReviewerNote, flex: 2.2, render: (r) => r.reviewerNote ?? "—" },
  ];

  return (
    <BrandedDocument
      locale={locale}
      metadata={{
        title: `KYC summary · ${user.name}`,
        subject: t.subject,
        keywords: ["kyc", "verification", "henryco", user.id],
      }}
      header={{
        documentType: t.documentType,
        title: user.name,
        subtitle: `${t.statusPrefix} · ${statusToLabel(status)}`,
        meta: [
          { label: t.metaSubmitted, value: submittedAt ? formatDateTime(submittedAt) : "—" },
          { label: t.metaReviewed, value: reviewedAt ? formatDateTime(reviewedAt) : "—" },
        ],
        divisionLabel: t.divisionLabel,
      }}
      division="account"
    >
      <View style={styles.notice}>
        <Text style={styles.noticeKicker}>{t.privacyKicker}</Text>
        <Text style={styles.noticeBody}>{t.privacyBody}</Text>
      </View>

      <DocumentSection kicker={t.accountHolder} tone="elevated">
        <DefinitionList
          rows={[
            { label: t.rowName, value: user.name },
            { label: t.rowEmail, value: user.email ?? "—" },
            { label: t.rowAccountId, value: user.id, mono: true },
            { label: t.rowOverallStatus, value: statusToLabel(status) },
          ]}
        />
      </DocumentSection>

      <DocumentSection kicker={t.sectionSubmissions}>
        <DataTable columns={columns} rows={submissions} emptyMessage={t.emptySubmissions} />
      </DocumentSection>

      {reviewerNote ? (
        <DocumentSection kicker={t.sectionReviewerNote} tone="accent">
          <Text style={{ fontSize: typeScale.body, color: palette.inkSoft, fontFamily: "HenryCoSans", lineHeight: 1.5 }}>
            {reviewerNote}
          </Text>
        </DocumentSection>
      ) : null}

      <LegalFooter lines={[t.legalLine1, t.legalLine2]} />
    </BrandedDocument>
  );
}
