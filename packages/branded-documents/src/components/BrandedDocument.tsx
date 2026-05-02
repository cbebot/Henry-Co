import * as React from "react";
import { Document, Page, View, StyleSheet } from "@react-pdf/renderer";
import { AccentStripe, DocumentHeader, type DocumentHeaderProps } from "./DocumentHeader";
import { DocumentFooter, type DocumentFooterProps } from "./DocumentFooter";
import { BrandedMonogram } from "./BrandMarks";
import { palette, page as pageTokens } from "../tokens";

export type BrandedDocumentProps = {
  metadata: {
    title: string;
    author?: string;
    subject?: string;
    keywords?: string[];
    creator?: string;
    producer?: string;
    language?: string;
  };
  header: DocumentHeaderProps;
  footer?: DocumentFooterProps;
  division?: string;
  watermark?: boolean;
  size?: "A4" | "LETTER";
  children: React.ReactNode;
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: palette.paper,
    paddingTop: pageTokens.margin.top,
    paddingRight: pageTokens.margin.right,
    paddingBottom: pageTokens.margin.bottom,
    paddingLeft: pageTokens.margin.left,
    fontFamily: "HenryCoSans",
    color: palette.ink,
    fontSize: 10.5,
  },
  watermark: {
    position: "absolute",
    top: 320,
    left: 0,
    right: 0,
    alignItems: "center",
    opacity: 1,
    transform: "rotate(-12deg)",
  },
});

export function BrandedDocument({
  metadata,
  header,
  footer,
  division,
  watermark,
  size = "A4",
  children,
}: BrandedDocumentProps) {
  return (
    <Document
      title={metadata.title}
      author={metadata.author ?? "Henry & Co."}
      subject={metadata.subject ?? metadata.title}
      keywords={(metadata.keywords ?? []).join(", ")}
      creator={metadata.creator ?? "HenryCo Branded Documents"}
      producer={metadata.producer ?? "HenryCo Branded Documents"}
      language={metadata.language ?? "en-NG"}
      pdfVersion="1.7"
    >
      <Page size={size} style={styles.page}>
        <AccentStripe division={division ?? header.division} />
        {watermark ? (
          <View style={styles.watermark} fixed>
            <BrandedMonogram size={420} watermark />
          </View>
        ) : null}
        <DocumentHeader {...header} />
        <View style={{ marginTop: 18 }}>{children}</View>
        <DocumentFooter {...(footer ?? {})} />
      </Page>
    </Document>
  );
}
