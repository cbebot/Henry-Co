import * as React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

import { BrandedDocument } from "../components/BrandedDocument";
import { DataTable, type DataTableColumn } from "../components/DataTable";
import { DocumentSection, DefinitionList } from "../components/DocumentSection";
import { LegalFooter } from "../components/SignatureBlock";
import { formatDateTime, formatKobo, statusToLabel, titleCase } from "../format";
import { letterSpacing, palette, typeScale } from "../tokens";

export type TransactionRow = {
  id: string;
  occurredAt: string;
  division: string | null;
  type: string | null;
  status: string | null;
  description: string | null;
  reference: string | null;
  amountKobo: number;
  direction?: "credit" | "debit" | null;
  currency?: string | null;
};

export type TransactionHistoryFilters = {
  fromDate?: string | null;
  toDate?: string | null;
  divisions?: string[] | null;
  types?: string[] | null;
  statuses?: string[] | null;
  amountFromKobo?: number | null;
  amountToKobo?: number | null;
};

export type TransactionHistoryProps = {
  user: { id: string; name?: string | null; email?: string | null };
  filters: TransactionHistoryFilters;
  rows: TransactionRow[];
  totals: {
    creditKobo: number;
    debitKobo: number;
    netKobo: number;
    rowCount: number;
  };
  generatedAt: string;
  division?: string;
};

const styles = StyleSheet.create({
  filterChips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  chip: {
    fontSize: typeScale.hairline,
    fontFamily: "HenryCoSans",
    color: palette.ink,
    backgroundColor: palette.paperElev,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    textTransform: "uppercase",
    letterSpacing: letterSpacing.kicker * 6,
    fontWeight: 600,
  },
});

function chipsFromFilters(filters: TransactionHistoryFilters): string[] {
  const out: string[] = [];
  if (filters.fromDate || filters.toDate) {
    const from = filters.fromDate ? formatDateTime(filters.fromDate).split(",")[0] : "Open";
    const to = filters.toDate ? formatDateTime(filters.toDate).split(",")[0] : "Now";
    out.push(`Range · ${from} → ${to}`);
  }
  if (filters.divisions?.length) out.push(`Division · ${filters.divisions.map(titleCase).join(", ")}`);
  if (filters.types?.length) out.push(`Type · ${filters.types.map(titleCase).join(", ")}`);
  if (filters.statuses?.length) out.push(`Status · ${filters.statuses.map(titleCase).join(", ")}`);
  if (filters.amountFromKobo != null || filters.amountToKobo != null) {
    const from = filters.amountFromKobo != null ? formatKobo(filters.amountFromKobo) : "—";
    const to = filters.amountToKobo != null ? formatKobo(filters.amountToKobo) : "—";
    out.push(`Amount · ${from} → ${to}`);
  }
  if (out.length === 0) out.push("No filters · full history");
  return out;
}

export function TransactionHistoryDocument({
  user,
  filters,
  rows,
  totals,
  generatedAt,
  division,
}: TransactionHistoryProps) {
  const chips = chipsFromFilters(filters);
  const columns: Array<DataTableColumn<TransactionRow>> = [
    { key: "date", header: "Date", flex: 1.4, render: (r) => formatDateTime(r.occurredAt), mono: true },
    { key: "division", header: "Division", flex: 1, render: (r) => titleCase(r.division ?? "—") },
    { key: "type", header: "Type", flex: 1, render: (r) => titleCase(r.type ?? "—") },
    { key: "description", header: "Description", flex: 2.4, render: (r) => r.description ?? "—" },
    { key: "reference", header: "Reference", flex: 1.4, render: (r) => r.reference ?? "—", mono: true },
    { key: "status", header: "Status", flex: 0.9, render: (r) => statusToLabel(r.status) },
    {
      key: "amount",
      header: "Amount",
      flex: 1.2,
      align: "right",
      mono: true,
      render: (r) => {
        const sign = r.direction === "credit" ? "+" : r.direction === "debit" ? "−" : "";
        return `${sign}${formatKobo(r.amountKobo, r.currency ?? "NGN")}`;
      },
    },
  ];

  return (
    <BrandedDocument
      metadata={{
        title: `Transaction history · ${user.name ?? user.email ?? user.id}`,
        author: "Henry & Co.",
        subject: "Transaction history",
        keywords: ["transaction", "history", "henryco", "statement"],
      }}
      header={{
        documentType: "Transaction history",
        title: user.name ?? user.email ?? "Account holder",
        subtitle: `${totals.rowCount} ${totals.rowCount === 1 ? "transaction" : "transactions"} · generated ${formatDateTime(generatedAt)}`,
        meta: [
          { label: "Issued", value: formatDateTime(generatedAt) },
          { label: "Account", value: user.id.slice(0, 8) + "…" },
        ],
        divisionLabel: titleCase(division ?? "Group"),
      }}
      division={division}
    >
      <DocumentSection kicker="View applied" tone="elevated">
        <View style={styles.filterChips}>
          {chips.map((c) => (
            <Text key={c} style={styles.chip}>
              {c}
            </Text>
          ))}
        </View>
        <View style={{ height: 6 }} />
        <DefinitionList
          rows={[
            { label: "Inflows", value: formatKobo(totals.creditKobo), mono: true },
            { label: "Outflows", value: formatKobo(totals.debitKobo), mono: true },
            { label: "Net change", value: formatKobo(totals.netKobo), mono: true },
          ]}
        />
      </DocumentSection>

      <DocumentSection kicker="Ledger">
        <DataTable
          columns={columns}
          rows={rows}
          striped
          emptyMessage="No transactions matched the filters above."
          footerRow={{
            description: "Net for selected view",
            amount: formatKobo(totals.netKobo),
          }}
        />
      </DocumentSection>

      <LegalFooter
        lines={[
          "This statement is a record of activity surfaced from the HenryCo unified ledger. Where a division marks a transaction pending or under review, the canonical settlement remains with that division until the status here updates.",
          "If a row looks unfamiliar, contact HenryCo support before disputing with your bank — most queries resolve faster through the originating division.",
        ]}
      />
    </BrandedDocument>
  );
}
