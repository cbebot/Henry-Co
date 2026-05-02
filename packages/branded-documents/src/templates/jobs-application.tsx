import * as React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

import { BrandedDocument } from "../components/BrandedDocument";
import { DocumentSection, DefinitionList } from "../components/DocumentSection";
import { LegalFooter } from "../components/SignatureBlock";
import { formatDateTime, titleCase } from "../format";
import { letterSpacing, palette, typeScale } from "../tokens";

export type JobsApplicationProps = {
  application: {
    id: string;
    referenceNo: string;
    submittedAt: string;
    status: string;
  };
  posting: {
    title: string;
    employer: string;
    location: string;
    employmentType: string;
  };
  candidate: {
    fullName: string;
    headline?: string | null;
    email: string;
    phone?: string | null;
    locationLine?: string | null;
  };
  resume: {
    summary?: string | null;
    experience: Array<{ company: string; role: string; period: string; bullets: string[] }>;
    education: Array<{ institution: string; credential: string; period: string }>;
    skills: string[];
  };
  coverLetter?: string | null;
  answers: Array<{ question: string; answer: string }>;
};

const styles = StyleSheet.create({
  expWrap: { marginTop: 6 },
  expRow: { marginTop: 12 },
  expHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  expRole: { fontSize: typeScale.bodyLarge, fontFamily: "HenryCoSerif", color: palette.ink, fontWeight: 600 },
  expCompany: { fontSize: typeScale.body, fontFamily: "HenryCoSans", color: palette.inkSoft },
  expPeriod: { fontSize: typeScale.caption, fontFamily: "HenryCoMono", color: palette.inkMuted },
  expBullet: { fontSize: typeScale.body, fontFamily: "HenryCoSans", color: palette.ink, lineHeight: 1.5, marginTop: 3 },
  skillChips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  chip: {
    fontSize: typeScale.hairline,
    fontFamily: "HenryCoSans",
    color: palette.ink,
    backgroundColor: palette.lineSoft,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    textTransform: "uppercase",
    letterSpacing: letterSpacing.kicker * 6,
    fontWeight: 600,
  },
  qa: { marginTop: 10 },
  question: { fontSize: typeScale.body, fontFamily: "HenryCoSans", color: palette.ink, fontWeight: 600 },
  answer: { fontSize: typeScale.body, fontFamily: "HenryCoSans", color: palette.inkSoft, marginTop: 3, lineHeight: 1.5 },
});

export function JobsApplicationDocument({ application, posting, candidate, resume, coverLetter, answers }: JobsApplicationProps) {
  return (
    <BrandedDocument
      metadata={{
        title: `Application ${application.referenceNo} — ${candidate.fullName}`,
        subject: `Application for ${posting.title}`,
        keywords: ["jobs", "application", posting.employer, candidate.fullName, application.referenceNo],
      }}
      header={{
        documentType: "Application package",
        title: `${candidate.fullName} → ${posting.title}`,
        subtitle: `${posting.employer} · ${posting.location} · ${titleCase(posting.employmentType)}`,
        meta: [
          { label: "Reference", value: application.referenceNo },
          { label: "Submitted", value: formatDateTime(application.submittedAt) },
          { label: "Status", value: titleCase(application.status) },
        ],
        divisionLabel: "Jobs",
      }}
      division="jobs"
    >
      <DocumentSection kicker="Candidate" tone="elevated">
        <DefinitionList
          rows={[
            { label: "Name", value: candidate.fullName },
            { label: "Headline", value: candidate.headline ?? "—" },
            { label: "Email", value: candidate.email },
            { label: "Phone", value: candidate.phone ?? "—" },
            { label: "Location", value: candidate.locationLine ?? "—" },
          ]}
        />
      </DocumentSection>

      {resume.summary ? (
        <DocumentSection kicker="Summary">
          <Text style={{ fontSize: typeScale.body, fontFamily: "HenryCoSans", color: palette.inkSoft, lineHeight: 1.6 }}>
            {resume.summary}
          </Text>
        </DocumentSection>
      ) : null}

      <DocumentSection kicker="Experience">
        <View style={styles.expWrap}>
          {resume.experience.slice(0, 5).map((row, idx) => (
            <View key={idx} style={styles.expRow} wrap={false}>
              <View style={styles.expHeader}>
                <View>
                  <Text style={styles.expRole}>{row.role}</Text>
                  <Text style={styles.expCompany}>{row.company}</Text>
                </View>
                <Text style={styles.expPeriod}>{row.period}</Text>
              </View>
              {row.bullets.map((b, i) => (
                <Text key={i} style={styles.expBullet}>
                  · {b}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </DocumentSection>

      <DocumentSection kicker="Education">
        <DefinitionList
          rows={resume.education.map((row) => ({
            label: row.credential,
            value: `${row.institution} · ${row.period}`,
          }))}
        />
      </DocumentSection>

      <DocumentSection kicker="Skills">
        <View style={styles.skillChips}>
          {resume.skills.map((s) => (
            <Text key={s} style={styles.chip}>
              {s}
            </Text>
          ))}
        </View>
      </DocumentSection>

      {coverLetter ? (
        <DocumentSection kicker="Cover letter" tone="accent">
          <Text style={{ fontSize: typeScale.body, fontFamily: "HenryCoSans", color: palette.inkSoft, lineHeight: 1.6 }}>
            {coverLetter}
          </Text>
        </DocumentSection>
      ) : null}

      {answers.length > 0 ? (
        <DocumentSection kicker="Screener answers">
          {answers.map((qa, idx) => (
            <View key={idx} style={styles.qa} wrap={false}>
              <Text style={styles.question}>{qa.question}</Text>
              <Text style={styles.answer}>{qa.answer}</Text>
            </View>
          ))}
        </DocumentSection>
      ) : null}

      <LegalFooter
        lines={[
          "This application package was assembled from the candidate's HenryCo Jobs profile at the moment of submission. Any subsequent profile edits are not reflected here.",
          "Recruiters and hiring teams should treat this PDF as the canonical record of what the candidate submitted at this point in time.",
        ]}
      />
    </BrandedDocument>
  );
}
