import * as React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { letterSpacing, palette, typeScale } from "../tokens";

export type SignatureBlockProps = {
  signatoryName: string;
  signatoryRole: string;
  signedAt?: string;
  signatureImage?: string;
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: 28,
    paddingTop: 14,
    borderTopWidth: 0.6,
    borderTopColor: palette.line,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 32,
  },
  column: { flex: 1, minWidth: 200 },
  scriptName: {
    fontFamily: "HenryCoSerif",
    fontStyle: "italic",
    fontSize: 22,
    color: palette.ink,
    paddingBottom: 6,
    paddingTop: 12,
  },
  rule: { borderBottomWidth: 0.6, borderBottomColor: palette.ink, marginBottom: 8 },
  caption: {
    fontSize: typeScale.hairline,
    fontFamily: "HenryCoSans",
    color: palette.inkMuted,
    textTransform: "uppercase",
    letterSpacing: letterSpacing.kicker * 6,
    fontWeight: 700,
  },
  name: {
    fontSize: typeScale.body,
    fontFamily: "HenryCoSans",
    color: palette.ink,
    fontWeight: 600,
    marginTop: 4,
  },
  role: {
    fontSize: typeScale.caption,
    fontFamily: "HenryCoSans",
    color: palette.inkMuted,
  },
  date: {
    fontSize: typeScale.caption,
    fontFamily: "HenryCoMono",
    color: palette.inkMuted,
    marginTop: 6,
  },
});

export function SignatureBlock({ signatoryName, signatoryRole, signedAt }: SignatureBlockProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.column}>
        <Text style={styles.scriptName}>{signatoryName}</Text>
        <View style={styles.rule} />
        <Text style={styles.caption}>Authorised signatory</Text>
        <Text style={styles.name}>{signatoryName}</Text>
        <Text style={styles.role}>{signatoryRole}</Text>
        {signedAt ? <Text style={styles.date}>Signed · {signedAt}</Text> : null}
      </View>
    </View>
  );
}

export type LegalFooterProps = {
  lines: string[];
};

const legalStyles = StyleSheet.create({
  wrap: {
    marginTop: 22,
    paddingTop: 12,
    borderTopWidth: 0.4,
    borderTopColor: palette.lineSoft,
  },
  line: {
    fontSize: typeScale.hairline,
    fontFamily: "HenryCoSans",
    color: palette.inkMuted,
    lineHeight: 1.5,
  },
});

export function LegalFooter({ lines }: LegalFooterProps) {
  return (
    <View style={legalStyles.wrap}>
      {lines.map((line) => (
        <Text key={line} style={legalStyles.line}>
          {line}
        </Text>
      ))}
    </View>
  );
}
