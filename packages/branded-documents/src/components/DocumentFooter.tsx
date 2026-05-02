import * as React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { BrandedMonogram } from "./BrandMarks";
import { letterSpacing, palette, typeScale } from "../tokens";

export type DocumentFooterProps = {
  legal?: string;
  referenceId?: string;
  verificationUrl?: string;
};

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 56,
    right: 56,
    bottom: 32,
    paddingTop: 12,
    borderTopWidth: 0.6,
    borderTopColor: palette.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: { flexDirection: "row", alignItems: "center", gap: 8 },
  brand: {
    fontSize: typeScale.hairline,
    fontFamily: "HenryCoSans",
    color: palette.inkMuted,
    letterSpacing: letterSpacing.kicker * 6,
    textTransform: "uppercase",
    fontWeight: 600,
  },
  legal: {
    fontSize: typeScale.hairline,
    fontFamily: "HenryCoSans",
    color: palette.inkMuted,
  },
  page: {
    fontSize: typeScale.hairline,
    fontFamily: "HenryCoMono",
    color: palette.inkMuted,
  },
});

export function DocumentFooter({ legal = "Henry & Co. — every business under one trusted name." }: DocumentFooterProps) {
  return (
    <View style={styles.wrap} fixed>
      <View style={styles.left}>
        <BrandedMonogram size={14} />
        <Text style={styles.brand}>HENRY & CO.</Text>
        <Text style={styles.legal}>· {legal}</Text>
      </View>
      <Text
        style={styles.page}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}
