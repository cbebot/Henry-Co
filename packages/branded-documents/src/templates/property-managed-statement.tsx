import * as React from "react";
import { Text, View, StyleSheet } from "@react-pdf/renderer";
import { getBrandedDocumentsCopy, type AppLocale } from "@henryco/i18n";

import { BrandedDocument } from "../components/BrandedDocument";
import { DocumentSection, DefinitionList } from "../components/DocumentSection";
import { DataTable, type DataTableColumn } from "../components/DataTable";
import { LegalFooter } from "../components/SignatureBlock";
import {
  formatDateTime,
  formatKobo,
  statusToLabel,
  titleCase,
} from "../format";
import { letterSpacing, palette, typeScale } from "../tokens";

/**
 * V3 PASS 21 — PropertyManagedStatement PDF template.
 *
 * Monthly (or arbitrary-period) financial statement for a managed-property
 * owner. The statement shows rent collected, maintenance spend, and the
 * net pass-through to the owner, plus an itemised ledger of every rent
 * row and every maintenance ticket closed in the period.
 *
 * Used by:
 *   - account.henrycogroup.com `?module=property` → My managed properties
 *   - apps/property staff workspace (managed-property dashboard)
 *   - cron-driven monthly mailout (future wave)
 */

export type PropertyManagedRentRow = {
  id: string;
  periodLabel: string;
  periodStartsAt: string;
  periodEndsAt: string;
  amountKobo: number;
  status: string;
  collectedAt?: string | null;
  notes?: string | null;
};

export type PropertyManagedMaintenanceRow = {
  id: string;
  ticketSummary: string;
  category: string;
  severity: string;
  status: string;
  scheduledFor?: string | null;
  resolvedAt?: string | null;
  amountKobo: number;
};

export type PropertyManagedStatementProps = {
  owner: {
    id: string;
    name: string;
    legalName?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  listing: {
    id: string;
    slug: string;
    title: string;
    addressLine?: string | null;
    locationLabel: string;
    managedSince?: string | null;
  };
  period: {
    label: string;
    startsAt: string;
    endsAt: string;
  };
  totals: {
    grossRentKobo: number;
    maintenanceKobo: number;
    managementFeeKobo: number;
    netPayableKobo: number;
    currency: string;
  };
  rentRows: PropertyManagedRentRow[];
  maintenanceRows: PropertyManagedMaintenanceRow[];
  notes?: string[];
  locale?: AppLocale;
};

const styles = StyleSheet.create({
  banner: {
    marginTop: 16,
    backgroundColor: "#B06C3E",
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
    color: "#13070C",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: letterSpacing.kicker * 6,
  },
  bannerValue: {
    fontSize: typeScale.subhead,
    fontFamily: "HenryCoMono",
    color: "#13070C",
    fontWeight: 700,
  },
});

export function PropertyManagedStatementDocument({
  owner,
  listing,
  period,
  totals,
  rentRows,
  maintenanceRows,
  notes,
  locale = "en",
}: PropertyManagedStatementProps) {
  const t = getBrandedDocumentsCopy(locale).propertyManaged;
  const rentColumns: Array<DataTableColumn<PropertyManagedRentRow>> = [
    {
      key: "period",
      header: t.columnPeriod,
      flex: 1.2,
      mono: true,
      render: (row) => row.periodLabel,
    },
    {
      key: "window",
      header: t.columnWindow,
      flex: 1.8,
      render: (row) =>
        `${formatDateTime(row.periodStartsAt)} – ${formatDateTime(row.periodEndsAt)}`,
    },
    {
      key: "status",
      header: t.columnStatus,
      flex: 1,
      render: (row) => statusToLabel(row.status),
    },
    {
      key: "collectedAt",
      header: t.columnCollected,
      flex: 1.2,
      render: (row) => (row.collectedAt ? formatDateTime(row.collectedAt) : "—"),
    },
    {
      key: "amount",
      header: t.columnAmount,
      flex: 1.2,
      align: "right",
      mono: true,
      render: (row) => formatKobo(row.amountKobo, totals.currency),
    },
  ];

  const maintenanceColumns: Array<DataTableColumn<PropertyManagedMaintenanceRow>> = [
    {
      key: "summary",
      header: t.columnTicket,
      flex: 2.2,
      render: (row) => row.ticketSummary,
    },
    {
      key: "category",
      header: t.columnCategory,
      flex: 1.2,
      render: (row) => titleCase(row.category),
    },
    {
      key: "severity",
      header: t.columnSeverity,
      flex: 1,
      render: (row) => titleCase(row.severity),
    },
    {
      key: "status",
      header: t.columnStatus,
      flex: 1,
      render: (row) => statusToLabel(row.status),
    },
    {
      key: "resolved",
      header: t.columnResolved,
      flex: 1.2,
      render: (row) => (row.resolvedAt ? formatDateTime(row.resolvedAt) : "—"),
    },
    {
      key: "amount",
      header: t.columnAmount,
      flex: 1.2,
      align: "right",
      mono: true,
      render: (row) => formatKobo(row.amountKobo, totals.currency),
    },
  ];

  const legalLines = [t.legalLine1, t.legalLine2, ...(notes ?? [])];

  return (
    <BrandedDocument
      locale={locale}
      metadata={{
        title: `Managed-property statement · ${listing.title} · ${period.label}`,
        subject: t.subject,
        keywords: ["property", "managed", "statement", "henryco", listing.title],
      }}
      header={{
        documentType: t.documentType,
        title: listing.title,
        subtitle: `${period.label} · ${listing.locationLabel}`,
        meta: [
          { label: t.metaPeriod, value: period.label },
          { label: t.metaStarts, value: formatDateTime(period.startsAt) },
          { label: t.metaEnds, value: formatDateTime(period.endsAt) },
        ],
        divisionLabel: t.divisionLabel,
      }}
      division="property"
    >
      <View style={styles.banner}>
        <Text style={styles.bannerLabel}>{t.netPayable}</Text>
        <Text style={styles.bannerValue}>
          {formatKobo(totals.netPayableKobo, totals.currency)}
        </Text>
      </View>

      <DocumentSection kicker={t.sectionOwner} tone="elevated">
        <DefinitionList
          rows={[
            { label: t.rowName, value: owner.name },
            { label: t.rowLegalName, value: owner.legalName ?? owner.name },
            { label: t.rowEmail, value: owner.email ?? "—" },
            { label: t.rowPhone, value: owner.phone ?? "—" },
          ]}
        />
      </DocumentSection>

      <DocumentSection kicker={t.sectionListing}>
        <DefinitionList
          rows={[
            { label: t.rowTitle, value: listing.title },
            {
              label: t.rowAddress,
              value: listing.addressLine
                ? `${listing.addressLine}, ${listing.locationLabel}`
                : listing.locationLabel,
            },
            {
              label: t.rowManagedSince,
              value: listing.managedSince ? formatDateTime(listing.managedSince) : "—",
            },
          ]}
        />
      </DocumentSection>

      <DocumentSection kicker={t.sectionPeriodSummary}>
        <DefinitionList
          rows={[
            {
              label: t.rowGrossRent,
              value: formatKobo(totals.grossRentKobo, totals.currency),
              mono: true,
            },
            {
              label: t.rowMaintenanceSpend,
              value: formatKobo(totals.maintenanceKobo, totals.currency),
              mono: true,
            },
            {
              label: t.rowManagementFee,
              value: formatKobo(totals.managementFeeKobo, totals.currency),
              mono: true,
            },
            {
              label: t.rowNetPayable,
              value: formatKobo(totals.netPayableKobo, totals.currency),
              mono: true,
            },
          ]}
        />
      </DocumentSection>

      <DocumentSection kicker={t.sectionRentLedger}>
        <DataTable
          columns={rentColumns}
          rows={rentRows}
          striped
          emptyMessage={t.emptyRent}
        />
      </DocumentSection>

      <DocumentSection kicker={t.sectionMaintenance}>
        <DataTable
          columns={maintenanceColumns}
          rows={maintenanceRows}
          striped
          emptyMessage={t.emptyMaintenance}
        />
      </DocumentSection>

      <LegalFooter lines={legalLines} />
    </BrandedDocument>
  );
}
