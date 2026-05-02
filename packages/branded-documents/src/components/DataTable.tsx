import * as React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { letterSpacing, palette, typeScale } from "../tokens";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  flex: number;
  align?: "left" | "right" | "center";
  render: (row: T) => string;
  mono?: boolean;
};

export type DataTableProps<T> = {
  columns: Array<DataTableColumn<T>>;
  rows: T[];
  striped?: boolean;
  emptyMessage?: string;
  footerRow?: Record<string, string>;
};

const styles = StyleSheet.create({
  wrap: { width: "100%", marginTop: 6 },
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 0.6,
    borderBottomColor: palette.ink,
    paddingBottom: 6,
  },
  bodyRow: {
    flexDirection: "row",
    borderBottomWidth: 0.4,
    borderBottomColor: palette.lineSoft,
    paddingVertical: 7,
  },
  bodyRowZebra: {
    backgroundColor: palette.paperElev,
  },
  footerRow: {
    flexDirection: "row",
    borderTopWidth: 0.8,
    borderTopColor: palette.ink,
    paddingTop: 8,
    marginTop: 4,
  },
  th: {
    fontSize: typeScale.hairline,
    fontFamily: "HenryCoSans",
    color: palette.inkMuted,
    textTransform: "uppercase",
    letterSpacing: letterSpacing.kicker * 6,
    fontWeight: 700,
  },
  td: {
    fontSize: typeScale.body,
    fontFamily: "HenryCoSans",
    color: palette.ink,
  },
  tdMono: {
    fontSize: typeScale.body,
    fontFamily: "HenryCoMono",
    color: palette.ink,
  },
  empty: {
    fontSize: typeScale.body,
    fontFamily: "HenryCoSans",
    color: palette.inkMuted,
    paddingVertical: 18,
    textAlign: "center",
  },
});

export function DataTable<T>({ columns, rows, striped = false, emptyMessage, footerRow }: DataTableProps<T>) {
  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        {columns.map((col) => (
          <Text
            key={col.key}
            style={[styles.th, { flex: col.flex, textAlign: col.align ?? "left" }]}
          >
            {col.header.toUpperCase()}
          </Text>
        ))}
      </View>

      {rows.length === 0 ? (
        <Text style={styles.empty}>{emptyMessage ?? "No items in this view."}</Text>
      ) : (
        rows.map((row, idx) => (
          <View
            key={idx}
            style={striped && idx % 2 === 1 ? [styles.bodyRow, styles.bodyRowZebra] : styles.bodyRow}
            wrap={false}
          >
            {columns.map((col) => (
              <Text
                key={col.key}
                style={[col.mono ? styles.tdMono : styles.td, { flex: col.flex, textAlign: col.align ?? "left" }]}
              >
                {col.render(row)}
              </Text>
            ))}
          </View>
        ))
      )}

      {footerRow ? (
        <View style={styles.footerRow}>
          {columns.map((col) => (
            <Text
              key={col.key}
              style={[col.mono ? styles.tdMono : styles.td, { flex: col.flex, textAlign: col.align ?? "left", fontWeight: 700 }]}
            >
              {footerRow[col.key] ?? ""}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}
