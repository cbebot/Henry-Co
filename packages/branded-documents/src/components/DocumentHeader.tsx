import * as React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { BrandedWordmark } from "./BrandMarks";
import { letterSpacing, palette, resolveDivisionAccent, typeScale } from "../tokens";

type Meta = { label: string; value: string };

export type DocumentHeaderProps = {
  documentType: string;
  title: string;
  subtitle?: string;
  meta?: Meta[];
  division?: string;
  divisionLabel?: string;
};

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  brandColumn: { flexDirection: "column", gap: 4 },
  divisionLabel: {
    fontSize: typeScale.hairline,
    color: palette.inkMuted,
    fontFamily: "HenryCoSans",
    letterSpacing: letterSpacing.kicker * 6,
    textTransform: "uppercase",
    fontWeight: 600,
  },
  metaColumn: { alignItems: "flex-end", flexDirection: "column", gap: 2 },
  metaRow: { flexDirection: "row", gap: 6 },
  metaLabel: {
    fontSize: typeScale.hairline,
    fontFamily: "HenryCoSans",
    color: palette.inkMuted,
    textTransform: "uppercase",
    letterSpacing: letterSpacing.kicker * 6,
    fontWeight: 600,
  },
  metaValue: {
    fontSize: typeScale.caption,
    fontFamily: "HenryCoMono",
    color: palette.ink,
  },
  rule: { height: 1, backgroundColor: palette.line, marginTop: 18 },
  titleBlock: { marginTop: 22 },
  kicker: {
    fontSize: typeScale.caption,
    fontFamily: "HenryCoSans",
    color: palette.copperDeep,
    letterSpacing: letterSpacing.kicker * 6,
    textTransform: "uppercase",
    fontWeight: 700,
  },
  title: {
    marginTop: 6,
    fontSize: typeScale.display,
    fontFamily: "HenryCoSerif",
    color: palette.ink,
    letterSpacing: letterSpacing.head * 24,
    fontWeight: 600,
  },
  subtitle: {
    marginTop: 4,
    fontSize: typeScale.bodyLarge,
    fontFamily: "HenryCoSans",
    color: palette.inkSoft,
  },
});

export function DocumentHeader({
  documentType,
  title,
  subtitle,
  meta = [],
  divisionLabel,
}: DocumentHeaderProps) {
  return (
    <View>
      <View style={styles.header}>
        <View style={styles.brandColumn}>
          <BrandedWordmark variant="full" height={20} />
          {divisionLabel ? <Text style={styles.divisionLabel}>{divisionLabel}</Text> : null}
        </View>
        {meta.length > 0 ? (
          <View style={styles.metaColumn}>
            {meta.map((row) => (
              <View key={`${row.label}:${row.value}`} style={styles.metaRow}>
                <Text style={styles.metaLabel}>{row.label}</Text>
                <Text style={styles.metaValue}>{row.value}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
      <View style={styles.rule} />
      <View style={styles.titleBlock}>
        <Text style={styles.kicker}>{documentType}</Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

export function AccentStripe({ division }: { division?: string }) {
  const tone = resolveDivisionAccent(division);
  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 6,
        backgroundColor: tone.accent,
      }}
    />
  );
}
