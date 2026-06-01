import * as React from "react";
import { Text, View, StyleSheet } from "@react-pdf/renderer";

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
}: PropertyManagedStatementProps) {
  const rentColumns: Array<DataTableColumn<PropertyManagedRentRow>> = [
    {
      key: "period",
      header: "Period",
      flex: 1.2,
      mono: true,
      render: (row) => row.periodLabel,
    },
    {
      key: "window",
      header: "Window",
      flex: 1.8,
      render: (row) =>
        `${formatDateTime(row.periodStartsAt)} – ${formatDateTime(row.periodEndsAt)}`,
    },
    {
      key: "status",
      header: "Status",
      flex: 1,
      render: (row) => statusToLabel(row.status),
    },
    {
      key: "collectedAt",
      header: "Collected",
      flex: 1.2,
      render: (row) => (row.collectedAt ? formatDateTime(row.collectedAt) : "—"),
    },
    {
      key: "amount",
      header: "Amount",
      flex: 1.2,
      align: "right",
      mono: true,
      render: (row) => formatKobo(row.amountKobo, totals.currency),
    },
  ];

  const maintenanceColumns: Array<DataTableColumn<PropertyManagedMaintenanceRow>> = [
    {
      key: "summary",
      header: "Ticket",
      flex: 2.2,
      render: (row) => row.ticketSummary,
    },
    {
      key: "category",
      header: "Category",
      flex: 1.2,
      render: (row) => titleCase(row.category),
    },
    {
      key: "severity",
      header: "Severity",
      flex: 1,
      render: (row) => titleCase(row.severity),
    },
    {
      key: "status",
      header: "Status",
      flex: 1,
      render: (row) => statusToLabel(row.status),
    },
    {
      key: "resolved",
      header: "Resolved",
      flex: 1.2,
      render: (row) => (row.resolvedAt ? formatDateTime(row.resolvedAt) : "—"),
    },
    {
      key: "amount",
      header: "Amount",
      flex: 1.2,
      align: "right",
      mono: true,
      render: (row) => formatKobo(row.amountKobo, totals.currency),
    },
  ];

  const legalLines = [
    "This statement reflects rent collected and operating expenses applied to the managed listing above during the period. Amounts are gross of withholding tax; Henry Holdings Limited remits the net pass-through on the cadence agreed in your management instrument.",
    "Any discrepancy must be raised in writing within the dispute window stated in your management instrument; Henry Holdings Limited cannot re-bill or re-collect outside that window.",
    ...(notes ?? []),
  ];

  return (
    <BrandedDocument
      metadata={{
        title: `Managed-property statement · ${listing.title} · ${period.label}`,
        subject: "HenryCo Property managed statement",
        keywords: ["property", "managed", "statement", "henryco", listing.title],
      }}
      header={{
        documentType: "Managed-property statement",
        title: listing.title,
        subtitle: `${period.label} · ${listing.locationLabel}`,
        meta: [
          { label: "Period", value: period.label },
          { label: "Starts", value: formatDateTime(period.startsAt) },
          { label: "Ends", value: formatDateTime(period.endsAt) },
        ],
        divisionLabel: "Property · Managed",
      }}
      division="property"
    >
      <View style={styles.banner}>
        <Text style={styles.bannerLabel}>Net payable to owner</Text>
        <Text style={styles.bannerValue}>
          {formatKobo(totals.netPayableKobo, totals.currency)}
        </Text>
      </View>

      <DocumentSection kicker="Owner" tone="elevated">
        <DefinitionList
          rows={[
            { label: "Name", value: owner.name },
            { label: "Legal name", value: owner.legalName ?? owner.name },
            { label: "Email", value: owner.email ?? "—" },
            { label: "Phone", value: owner.phone ?? "—" },
          ]}
        />
      </DocumentSection>

      <DocumentSection kicker="Listing">
        <DefinitionList
          rows={[
            { label: "Title", value: listing.title },
            {
              label: "Address",
              value: listing.addressLine
                ? `${listing.addressLine}, ${listing.locationLabel}`
                : listing.locationLabel,
            },
            {
              label: "Managed since",
              value: listing.managedSince ? formatDateTime(listing.managedSince) : "—",
            },
          ]}
        />
      </DocumentSection>

      <DocumentSection kicker="Period summary">
        <DefinitionList
          rows={[
            {
              label: "Gross rent collected",
              value: formatKobo(totals.grossRentKobo, totals.currency),
              mono: true,
            },
            {
              label: "Maintenance spend",
              value: formatKobo(totals.maintenanceKobo, totals.currency),
              mono: true,
            },
            {
              label: "Management fee",
              value: formatKobo(totals.managementFeeKobo, totals.currency),
              mono: true,
            },
            {
              label: "Net payable to owner",
              value: formatKobo(totals.netPayableKobo, totals.currency),
              mono: true,
            },
          ]}
        />
      </DocumentSection>

      <DocumentSection kicker="Rent ledger">
        <DataTable
          columns={rentColumns}
          rows={rentRows}
          striped
          emptyMessage="No rent activity in this period."
        />
      </DocumentSection>

      <DocumentSection kicker="Maintenance">
        <DataTable
          columns={maintenanceColumns}
          rows={maintenanceRows}
          striped
          emptyMessage="No maintenance activity in this period."
        />
      </DocumentSection>

      <LegalFooter lines={legalLines} />
    </BrandedDocument>
  );
}
