import * as React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { letterSpacing, palette, typeScale } from "../tokens";

export type DocumentSectionProps = {
  kicker?: string;
  title?: string;
  children: React.ReactNode;
  tone?: "default" | "elevated" | "accent";
};

const styles = StyleSheet.create({
  wrap: { marginTop: 22 },
  elevated: { backgroundColor: palette.paperElev, borderRadius: 8, padding: 18 },
  accent: {
    borderLeftWidth: 3,
    borderLeftColor: palette.copper,
    paddingLeft: 14,
    paddingTop: 4,
    paddingBottom: 4,
  },
  kicker: {
    fontSize: typeScale.hairline,
    fontFamily: "HenryCoSans",
    color: palette.copperDeep,
    letterSpacing: letterSpacing.kicker * 6,
    textTransform: "uppercase",
    fontWeight: 700,
    marginBottom: 6,
  },
  title: {
    fontSize: typeScale.subhead,
    fontFamily: "HenryCoSerif",
    color: palette.ink,
    fontWeight: 600,
    marginBottom: 8,
  },
});

export function DocumentSection({ kicker, title, tone = "default", children }: DocumentSectionProps) {
  const containerStyle =
    tone === "elevated"
      ? [styles.wrap, styles.elevated]
      : tone === "accent"
        ? [styles.wrap, styles.accent]
        : styles.wrap;
  return (
    <View style={containerStyle} wrap={false}>
      {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

const dlStyles = StyleSheet.create({
  row: { flexDirection: "row", paddingVertical: 4, alignItems: "flex-start" },
  label: {
    fontSize: typeScale.caption,
    fontFamily: "HenryCoSans",
    color: palette.inkMuted,
    width: "38%",
    paddingRight: 12,
    textTransform: "uppercase",
    letterSpacing: letterSpacing.kicker * 6,
    fontWeight: 600,
  },
  value: {
    flex: 1,
    fontSize: typeScale.body,
    fontFamily: "HenryCoSans",
    color: palette.ink,
  },
  valueMono: {
    flex: 1,
    fontSize: typeScale.body,
    fontFamily: "HenryCoMono",
    color: palette.ink,
  },
});

export function DefinitionList({
  rows,
}: {
  rows: Array<{ label: string; value: string; mono?: boolean }>;
}) {
  return (
    <View>
      {rows.map((row) => (
        <View key={row.label} style={dlStyles.row}>
          <Text style={dlStyles.label}>{row.label}</Text>
          <Text style={row.mono ? dlStyles.valueMono : dlStyles.value}>{row.value || "—"}</Text>
        </View>
      ))}
    </View>
  );
}
