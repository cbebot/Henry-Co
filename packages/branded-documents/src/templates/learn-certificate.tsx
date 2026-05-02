import * as React from "react";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";

import { AccentStripe } from "../components/DocumentHeader";
import { BrandedMonogram, BrandedWordmark } from "../components/BrandMarks";
import { letterSpacing, palette, page as pageTokens, typeScale } from "../tokens";

export type LearnCertificateProps = {
  certificate: {
    id: string;
    certificateNo: string;
    verificationCode: string;
    issuedAt: string;
    score?: number | null;
    learnerName: string;
    courseTitle: string;
    courseSlug?: string | null;
    completionRule?: string | null;
  };
  verificationUrl: string;
  qrDataUrl: string;
  issuer?: {
    name: string;
    title: string;
    accreditation?: string | null;
  };
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: palette.paper,
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    fontFamily: "HenryCoSans",
    color: palette.ink,
    fontSize: 10.5,
  },
  outerFrame: {
    position: "absolute",
    top: 24,
    left: 24,
    right: 24,
    bottom: 24,
    borderWidth: 1.4,
    borderColor: palette.copperDeep,
    borderRadius: 4,
  },
  innerFrame: {
    position: "absolute",
    top: 32,
    left: 32,
    right: 32,
    bottom: 32,
    borderWidth: 0.4,
    borderColor: palette.copperDeep,
    borderRadius: 2,
  },
  watermarkLayer: {
    position: "absolute",
    top: pageTokens.height / 2 - 200,
    left: 0,
    right: 0,
    alignItems: "center",
    transform: "rotate(-12deg)",
  },
  content: {
    position: "absolute",
    top: 64,
    left: 64,
    right: 64,
    bottom: 64,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  topMonogramCol: { alignItems: "center", flex: 1 },
  kicker: {
    fontSize: typeScale.caption,
    fontFamily: "HenryCoSans",
    color: palette.copperDeep,
    textTransform: "uppercase",
    letterSpacing: letterSpacing.kicker * 6,
    fontWeight: 700,
    textAlign: "center",
  },
  preamble: {
    marginTop: 38,
    fontSize: typeScale.bodyLarge,
    fontFamily: "HenryCoSerif",
    fontStyle: "italic",
    color: palette.inkSoft,
    textAlign: "center",
  },
  learner: {
    marginTop: 18,
    fontSize: typeScale.ceremony,
    fontFamily: "HenryCoSerif",
    color: palette.ink,
    fontWeight: 700,
    textAlign: "center",
    letterSpacing: letterSpacing.ceremony * 24,
  },
  hairline: {
    marginTop: 12,
    height: 0.6,
    backgroundColor: palette.copperDeep,
    width: "62%",
    alignSelf: "center",
  },
  body: {
    marginTop: 18,
    fontSize: typeScale.bodyLarge,
    fontFamily: "HenryCoSerif",
    color: palette.inkSoft,
    textAlign: "center",
    lineHeight: 1.6,
  },
  course: {
    marginTop: 14,
    fontSize: typeScale.head + 4,
    fontFamily: "HenryCoSerif",
    color: palette.ink,
    fontWeight: 600,
    textAlign: "center",
    letterSpacing: -0.4,
  },
  bottomRow: {
    position: "absolute",
    left: 64,
    right: 64,
    bottom: 80,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  signatureCol: { alignItems: "flex-start", flex: 1 },
  scriptName: {
    fontFamily: "HenryCoSerif",
    fontStyle: "italic",
    fontSize: 24,
    color: palette.ink,
    paddingBottom: 8,
  },
  rule: { width: 220, height: 0.6, backgroundColor: palette.ink, marginTop: 4 },
  caption: {
    marginTop: 4,
    fontSize: typeScale.hairline,
    fontFamily: "HenryCoSans",
    color: palette.inkMuted,
    textTransform: "uppercase",
    letterSpacing: letterSpacing.kicker * 6,
    fontWeight: 700,
  },
  meta: {
    fontSize: typeScale.caption,
    fontFamily: "HenryCoSans",
    color: palette.inkSoft,
    marginTop: 4,
  },
  metaMono: {
    fontSize: typeScale.caption,
    fontFamily: "HenryCoMono",
    color: palette.inkSoft,
    marginTop: 2,
  },
  qrCol: { alignItems: "flex-end" },
  qr: { width: 96, height: 96 },
  qrUrl: {
    marginTop: 4,
    fontSize: typeScale.hairline,
    fontFamily: "HenryCoMono",
    color: palette.inkMuted,
    maxWidth: 220,
    textAlign: "right",
  },
  qrLabel: {
    fontSize: typeScale.hairline,
    fontFamily: "HenryCoSans",
    color: palette.inkMuted,
    textTransform: "uppercase",
    letterSpacing: letterSpacing.kicker * 6,
    fontWeight: 700,
    marginTop: 4,
    textAlign: "right",
  },
  bottomFooter: {
    position: "absolute",
    left: 64,
    right: 64,
    bottom: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: typeScale.hairline,
    fontFamily: "HenryCoSans",
    color: palette.inkMuted,
    letterSpacing: letterSpacing.kicker * 6,
    textTransform: "uppercase",
    fontWeight: 600,
  },
});

export function LearnCertificateDocument({ certificate, verificationUrl, qrDataUrl, issuer }: LearnCertificateProps) {
  const issuerInfo = issuer ?? {
    name: "Adaeze Henry-Mbachu",
    title: "Director, HenryCo Learn",
    accreditation: "Issued under HenryCo Learn academic standards",
  };

  return (
    <Document
      title={`Certificate ${certificate.certificateNo} — ${certificate.learnerName}`}
      author="Henry & Co. — HenryCo Learn"
      subject={`Certificate of completion for ${certificate.courseTitle}`}
      keywords={`certificate, henryco learn, ${certificate.courseTitle}, ${certificate.certificateNo}`}
      creator="HenryCo Branded Documents"
      producer="HenryCo Branded Documents"
      language="en-NG"
      pdfVersion="1.7"
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        <AccentStripe division="learn" />

        <View style={styles.watermarkLayer} fixed>
          <BrandedMonogram size={520} watermark color={palette.copperDeep} accent={palette.copperDeep} />
        </View>

        <View style={styles.outerFrame} />
        <View style={styles.innerFrame} />

        <View style={styles.content}>
          <View style={styles.topRow}>
            <BrandedWordmark variant="full" height={22} />
            <View style={styles.topMonogramCol}>
              <BrandedMonogram size={28} accent={palette.copperDeep} />
              <Text style={[styles.kicker, { marginTop: 6 }]}>HenryCo Learn</Text>
            </View>
            <View style={{ width: 96, alignItems: "flex-end" }}>
              <Text style={[styles.kicker, { textAlign: "right" }]}>Certificate of Completion</Text>
            </View>
          </View>

          <Text style={styles.preamble}>This is to certify that</Text>
          <Text style={styles.learner}>{certificate.learnerName}</Text>
          <View style={styles.hairline} />
          <Text style={styles.body}>has satisfied every learning, assessment, and integrity requirement set for</Text>
          <Text style={styles.course}>{certificate.courseTitle}</Text>

          {certificate.completionRule ? (
            <Text style={[styles.body, { fontSize: typeScale.body, marginTop: 12 }]}>
              {certificate.completionRule}
            </Text>
          ) : null}
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.signatureCol}>
            <Text style={styles.scriptName}>{issuerInfo.name}</Text>
            <View style={styles.rule} />
            <Text style={styles.caption}>Issuing officer</Text>
            <Text style={styles.meta}>{issuerInfo.title}</Text>
            {issuerInfo.accreditation ? <Text style={styles.meta}>{issuerInfo.accreditation}</Text> : null}
          </View>

          <View style={{ alignItems: "center", flex: 1 }}>
            <Text style={styles.caption}>Certificate number</Text>
            <Text style={[styles.metaMono, { fontSize: typeScale.subhead, marginTop: 4 }]}>{certificate.certificateNo}</Text>
            <Text style={[styles.caption, { marginTop: 12 }]}>Issued</Text>
            <Text style={styles.metaMono}>
              {new Date(certificate.issuedAt).toLocaleDateString("en-NG", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
            {certificate.score != null ? (
              <>
                <Text style={[styles.caption, { marginTop: 8 }]}>Score</Text>
                <Text style={styles.metaMono}>{certificate.score}</Text>
              </>
            ) : null}
          </View>

          <View style={styles.qrCol}>
            <Image src={qrDataUrl} style={styles.qr} />
            <Text style={styles.qrLabel}>Verify this credential</Text>
            <Text style={styles.qrUrl}>{verificationUrl}</Text>
            <Text style={[styles.qrUrl, { marginTop: 2 }]}>Code · {certificate.verificationCode}</Text>
          </View>
        </View>

        <View style={styles.bottomFooter} fixed>
          <Text style={styles.footerText}>HENRY & CO. · HenryCo Learn academic certificate</Text>
          <Text style={styles.footerText}>Genuine certificates resolve at the URL above</Text>
        </View>
      </Page>
    </Document>
  );
}
