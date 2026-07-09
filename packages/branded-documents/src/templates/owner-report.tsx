import * as React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

import { BrandedDocument } from "../components/BrandedDocument";
import { DataTable, type DataTableColumn } from "../components/DataTable";
import { DocumentSection, DefinitionList } from "../components/DocumentSection";
import { formatDateTime, formatKobo, titleCase } from "../format";
import { letterSpacing, palette, typeScale } from "../tokens";

/**
 * OwnerReportDocument — V3 PASS 21 / H6.
 *
 * The premium PDF rendering for the owner-reporting weekly + monthly
 * crons. Replaces the inline HTML email-as-PDF rendering with a
 * @react-pdf/renderer document driven by the same DASH-8 tokens as
 * every other branded document.
 *
 * Sections:
 *   - Executive headline (kind + period label + recipient)
 *   - Reconcilable metric cards (revenue, outflow, critical signals,
 *     open support)
 *   - Owner watchlist (top urgent signals)
 *   - Money visibility lines
 *   - Operations & messaging health
 *   - Division pressure
 *   - Recent money movement table
 *   - Optional next actions
 *
 * The owner-reporting cron passes the canonical owner-overview +
 * finance + operations + messaging snapshot; this template only
 * formats it.
 */

export type OwnerReportKind = "weekly" | "monthly";

export type OwnerReportMetric = {
  label: string;
  value: string;
  detail: string;
};

export type OwnerReportDivisionPressure = {
  slug: string;
  displayName: string;
  healthLabel: string;
  alertCount: number;
  revenueLabel: string;
};

export type OwnerReportSignalRow = {
  id: string;
  title: string;
  body: string;
  division?: string | null;
};

export type OwnerReportPaymentRow = {
  id: string;
  division: string;
  label: string;
  status: string;
  amountLabel: string;
};

export type OwnerReportProps = {
  kind: OwnerReportKind;
  periodKey: string;
  periodLabel: string;
  recipientName: string;
  executiveDigest: string;
  metrics: OwnerReportMetric[];
  signals: OwnerReportSignalRow[];
  moneyVisibilityLines: string[];
  messagingLines: string[];
  divisionPressure: OwnerReportDivisionPressure[];
  recentPayments: OwnerReportPaymentRow[];
  recommendations: OwnerReportSignalRow[];
  generatedAt: string;
  hqUrl: string;
};

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  metricCard: {
    flexGrow: 1,
    flexBasis: "45%",
    minWidth: 180,
    borderRadius: 12,
    backgroundColor: palette.paperElev,
    borderWidth: 1,
    borderColor: palette.line,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metricLabel: {
    fontSize: typeScale.hairline,
    fontFamily: "HenryCoSans",
    color: palette.inkMuted,
    textTransform: "uppercase",
    letterSpacing: letterSpacing.kicker * 6,
    fontWeight: 700,
  },
  metricValue: {
    marginTop: 4,
    fontSize: typeScale.head,
    fontFamily: "HenryCoMono",
    color: palette.ink,
    fontWeight: 700,
  },
  metricDetail: {
    marginTop: 4,
    fontSize: typeScale.caption,
    color: palette.inkMuted,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  bullet: {
    width: 6,
    fontSize: typeScale.body,
    color: palette.copper,
    marginRight: 4,
  },
  listText: {
    flex: 1,
    fontSize: typeScale.body,
    color: palette.ink,
  },
  caveat: {
    marginTop: 12,
    fontSize: typeScale.caption,
    color: palette.inkMuted,
  },
});

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <View style={{ marginTop: 4 }}>
      {items.map((item, index) => (
        <View key={index} style={styles.listItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.listText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export function OwnerReportDocument({
  kind,
  periodKey,
  periodLabel,
  recipientName,
  executiveDigest,
  metrics,
  signals,
  moneyVisibilityLines,
  messagingLines,
  divisionPressure,
  recentPayments,
  recommendations,
  generatedAt,
  hqUrl,
}: OwnerReportProps) {
  const title = kind === "monthly"
    ? `Henry Onyx owner monthly report · ${periodLabel}`
    : `Henry Onyx owner weekly report · ${periodLabel}`;
  const intro = kind === "monthly"
    ? "Richer monthly owner snapshot: money movement, pressure points, delivery health, and sensible executive next actions."
    : "Weekly owner report — the most important operational and financial truths visible without parsing raw tables.";

  const paymentColumns: Array<DataTableColumn<OwnerReportPaymentRow>> = [
    { key: "division", header: "Source", flex: 1.2, render: (r) => titleCase(r.division) },
    { key: "label", header: "Reference", flex: 2.4, render: (r) => r.label },
    { key: "status", header: "Status", flex: 1.0, render: (r) => titleCase(r.status) },
    { key: "amount", header: "Amount", flex: 1.0, align: "right", mono: true, render: (r) => r.amountLabel },
  ];

  return (
    <BrandedDocument
      metadata={{
        title,
        subject: title,
        keywords: ["owner-report", "henryco", kind, periodKey],
      }}
      header={{
        documentType: kind === "monthly" ? "Owner Monthly Report" : "Owner Weekly Report",
        title: periodLabel,
        subtitle: `Generated ${formatDateTime(generatedAt)} · Recipient ${recipientName}`,
        meta: [
          { label: "Kind", value: kind === "monthly" ? "Monthly" : "Weekly" },
          { label: "Period", value: periodLabel },
          { label: "Generated", value: formatDateTime(generatedAt) },
        ],
        divisionLabel: "Hub",
      }}
      division="hub"
      footer={{
        legal:
          "Generated from live Henry Onyx HQ surfaces. Numbers reconcile against the platform of record at the timestamp printed in the header.",
      }}
    >
      <DocumentSection kicker="Executive headline">
        <Text style={{ fontSize: typeScale.body, color: palette.ink, lineHeight: 1.6 }}>{intro}</Text>
        <Text style={{ marginTop: 6, fontSize: typeScale.body, color: palette.inkMuted, lineHeight: 1.6 }}>
          {executiveDigest}
        </Text>
      </DocumentSection>

      <DocumentSection kicker="Reconcilable metrics">
        <View style={styles.metricsRow}>
          {metrics.map((metric) => (
            <View key={metric.label} style={styles.metricCard}>
              <Text style={styles.metricLabel}>{metric.label}</Text>
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={styles.metricDetail}>{metric.detail}</Text>
            </View>
          ))}
        </View>
      </DocumentSection>

      {signals.length ? (
        <DocumentSection kicker="Owner watchlist">
          <BulletList items={signals.map((s) => `${s.title}: ${s.body}`)} />
        </DocumentSection>
      ) : null}

      {moneyVisibilityLines.length ? (
        <DocumentSection kicker="Money visibility">
          <BulletList items={moneyVisibilityLines} />
        </DocumentSection>
      ) : null}

      {messagingLines.length ? (
        <DocumentSection kicker="Operations and messaging health">
          <BulletList items={messagingLines} />
        </DocumentSection>
      ) : null}

      {divisionPressure.length ? (
        <DocumentSection kicker="Division pressure">
          <DefinitionList
            rows={divisionPressure.map((row) => ({
              label: row.displayName,
              value: `${row.healthLabel} · ${row.alertCount} alert(s) · ${row.revenueLabel}`,
            }))}
          />
        </DocumentSection>
      ) : null}

      {recentPayments.length ? (
        <DocumentSection kicker="Recent money movement">
          <DataTable
            columns={paymentColumns}
            rows={recentPayments}
            striped
            emptyMessage="No movement in this window."
          />
        </DocumentSection>
      ) : null}

      {recommendations.length ? (
        <DocumentSection kicker="Practical next actions">
          <BulletList items={recommendations.map((r) => `${r.title}: ${r.body}`)} />
        </DocumentSection>
      ) : null}

      <Text style={styles.caveat}>Open Owner HQ: {hqUrl}</Text>
    </BrandedDocument>
  );
}

/**
 * Convenience helper: format a kobo amount for a metric value cell.
 * Re-exported so the owner-reporting cron does not need to import
 * `formatKobo` from the deep package path.
 */
export function ownerReportFormatKobo(kobo: number, currency = "NGN") {
  return formatKobo(kobo, currency);
}
