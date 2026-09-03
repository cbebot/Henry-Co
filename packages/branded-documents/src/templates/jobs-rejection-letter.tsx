import * as React from "react";
import { Text } from "@react-pdf/renderer";

import { BrandedDocument } from "../components/BrandedDocument";
import { DocumentSection } from "../components/DocumentSection";
import { LegalFooter } from "../components/SignatureBlock";
import { formatDateTime } from "../format";
import { palette, typeScale } from "../tokens";

/**
 * V3-70 S6 — branded rejection / application-update letter.
 *
 * Presentation-only: all copy (header, body paragraphs, sign-off, legal lines)
 * arrives ALREADY localized + merge-field-filled from the caller (the document
 * route resolves @henryco/i18n + @henryco/config LEGAL). The recruiter picks a
 * template + tone; they never type raw HTML. Light/dark-agnostic (PDF palette).
 */
export type JobsRejectionLetterProps = {
  referenceNo: string;
  issuedAt: string;
  candidateName: string;
  roleTitle: string;
  businessName: string;
  labels: {
    documentType: string;
    headerTitle: string;
    subtitle: string;
    bodyKicker: string;
  };
  /** Localized body paragraphs, merge fields already filled. */
  paragraphs: string[];
  /** Localized sign-off line, e.g. "With appreciation, the {business} hiring team". */
  signOff: string;
  /** Localized legal footer lines (include the Henry Onyx Limited legal entity). */
  legalLines: string[];
};

export function JobsRejectionLetterDocument({
  referenceNo,
  issuedAt,
  candidateName,
  roleTitle,
  businessName,
  labels,
  paragraphs,
  signOff,
  legalLines,
}: JobsRejectionLetterProps) {
  return (
    <BrandedDocument
      metadata={{
        title: `${labels.headerTitle} — ${candidateName}`,
        subject: `${roleTitle} · ${businessName}`,
        keywords: ["jobs", "hiring", "application update", businessName, candidateName, referenceNo],
      }}
      header={{
        documentType: labels.documentType,
        title: labels.headerTitle,
        subtitle: labels.subtitle,
        meta: [
          { label: "Reference", value: referenceNo },
          { label: "Issued", value: formatDateTime(issuedAt) },
        ],
        divisionLabel: "Jobs",
      }}
      division="jobs"
    >
      <DocumentSection kicker={labels.bodyKicker} tone="elevated">
        {paragraphs.map((paragraph, idx) => (
          <Text
            key={idx}
            style={{
              fontSize: typeScale.body,
              fontFamily: "HenryCoSans",
              color: palette.inkSoft,
              lineHeight: 1.6,
              marginTop: idx === 0 ? 0 : 10,
            }}
          >
            {paragraph}
          </Text>
        ))}
        <Text
          style={{
            fontSize: typeScale.body,
            fontFamily: "HenryCoSerif",
            color: palette.ink,
            lineHeight: 1.6,
            marginTop: 16,
            fontWeight: 600,
          }}
        >
          {signOff}
        </Text>
      </DocumentSection>

      <LegalFooter lines={legalLines} />
    </BrandedDocument>
  );
}
