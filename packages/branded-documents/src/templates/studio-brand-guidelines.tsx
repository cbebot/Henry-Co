import * as React from "react";
import { Text, View, StyleSheet } from "@react-pdf/renderer";

import { BrandedDocument } from "../components/BrandedDocument";
import { DocumentSection } from "../components/DocumentSection";
import { LegalFooter } from "../components/SignatureBlock";
import { formatDate } from "../format";
import { letterSpacing, palette, typeScale } from "../tokens";

/**
 * V3 PASS 21 — StudioBrandGuidelinesDocument PDF template.
 *
 * Shipped alongside (or inside) the generated asset pack. Renders a
 * concise brand-guidelines doc with:
 *   - Project + studio attribution
 *   - Logo lockup mention + minimum-clear-space rule
 *   - Colour palette (hex + RGB + CMYK if provided)
 *   - Type system (primary, secondary, mono)
 *   - Voice & tone notes
 *   - Asset usage notes + Cloudinary archive reference
 *   - Legal footer
 *
 * Data-light by design — the consumer (delivery handoff cron + the
 * /api/studio/asset-packs/generate route) supplies the project's
 * brand kit. When no brand kit is supplied, the doc renders a baseline
 * "Henry Onyx Studio default kit" page so the asset pack is never empty.
 */

export type StudioBrandColour = {
  name: string;
  hex: string;
  rgb?: string | null;
  cmyk?: string | null;
  usage?: string | null;
};

export type StudioBrandType = {
  family: string;
  role: string; // "Display" / "Body" / "Mono"
  weights?: string | null;
  pairing?: string | null;
};

export type StudioBrandGuidelinesProps = {
  brand: {
    name: string;
    tagline?: string | null;
    description?: string | null;
    logoUsage?: string | null;
    minimumClearSpace?: string | null;
    colours?: StudioBrandColour[] | null;
    typography?: StudioBrandType[] | null;
    voiceTone?: string[] | null;
    usageNotes?: string[] | null;
  };
  project: {
    id: string;
    title: string;
    deliveredAt?: string | null;
    archiveUrl?: string | null;
  };
  studio: {
    name: string;
    contactEmail: string;
  };
};

const styles = StyleSheet.create({
  intro: {
    fontSize: typeScale.body,
    fontFamily: "HenryCoSans",
    color: palette.inkSoft,
    lineHeight: 1.6,
    marginTop: 12,
  },
  tagline: {
    fontSize: typeScale.bodyLarge,
    fontFamily: "HenryCoSerif",
    color: palette.ink,
    fontStyle: "italic",
    marginTop: 6,
  },
  swatchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.line,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 6,
    marginRight: 16,
  },
  swatchMeta: { flex: 1 },
  swatchName: {
    fontSize: typeScale.body,
    fontFamily: "HenryCoSerif",
    color: palette.ink,
    fontWeight: 600,
  },
  swatchValues: {
    fontSize: typeScale.hairline,
    fontFamily: "HenryCoMono",
    color: palette.inkSoft,
    marginTop: 2,
  },
  swatchUsage: {
    fontSize: typeScale.hairline,
    fontFamily: "HenryCoSans",
    color: palette.inkSoft,
    marginTop: 2,
    lineHeight: 1.4,
  },
  typeRow: {
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.line,
  },
  typeFamily: {
    fontSize: typeScale.bodyLarge,
    fontFamily: "HenryCoSerif",
    color: palette.ink,
    fontWeight: 600,
  },
  typeRole: {
    fontSize: typeScale.hairline,
    fontFamily: "HenryCoSans",
    color: palette.copperDeep,
    textTransform: "uppercase",
    letterSpacing: letterSpacing.kicker * 6,
    marginTop: 2,
  },
  typeMeta: {
    fontSize: typeScale.body,
    fontFamily: "HenryCoSans",
    color: palette.inkSoft,
    marginTop: 2,
    lineHeight: 1.4,
  },
  voiceItem: {
    fontSize: typeScale.body,
    fontFamily: "HenryCoSans",
    color: palette.ink,
    marginVertical: 3,
    lineHeight: 1.5,
  },
  archive: {
    fontSize: typeScale.hairline,
    fontFamily: "HenryCoMono",
    color: palette.copperDeep,
    marginTop: 8,
  },
});

function sanitizeHex(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("#")) return trimmed;
  return `#${trimmed}`;
}

export function StudioBrandGuidelinesDocument({ brand, project, studio }: StudioBrandGuidelinesProps) {
  const colours = brand.colours ?? [];
  const typography = brand.typography ?? [];
  const voiceTone = brand.voiceTone ?? [];
  const usageNotes = brand.usageNotes ?? [];

  return (
    <BrandedDocument
      metadata={{
        title: `${brand.name} — brand guidelines`,
        author: studio.name,
        subject: project.title,
        keywords: ["brand", "guidelines", "studio", "henryco", brand.name],
      }}
      header={{
        documentType: "Brand guidelines",
        title: brand.name,
        subtitle: project.title,
        meta: [
          {
            label: "Delivered",
            value: project.deliveredAt ? formatDate(project.deliveredAt) : "—",
          },
          { label: "Studio", value: studio.name },
        ],
        divisionLabel: "Studio",
      }}
      division="studio"
    >
      {brand.tagline ? <Text style={styles.tagline}>“{brand.tagline}”</Text> : null}
      {brand.description ? <Text style={styles.intro}>{brand.description}</Text> : null}

      {brand.logoUsage || brand.minimumClearSpace ? (
        <DocumentSection kicker="Logo lockup">
          {brand.logoUsage ? <Text style={styles.intro}>{brand.logoUsage}</Text> : null}
          {brand.minimumClearSpace ? (
            <Text style={styles.intro}>{`Minimum clear space: ${brand.minimumClearSpace}.`}</Text>
          ) : null}
        </DocumentSection>
      ) : null}

      {colours.length > 0 ? (
        <DocumentSection kicker="Colour palette">
          {colours.map((c, idx) => (
            <View key={`${idx}-${c.name}`} style={styles.swatchRow}>
              <View style={[styles.swatch, { backgroundColor: sanitizeHex(c.hex) }]} />
              <View style={styles.swatchMeta}>
                <Text style={styles.swatchName}>{c.name}</Text>
                <Text style={styles.swatchValues}>
                  {sanitizeHex(c.hex)}
                  {c.rgb ? ` · RGB ${c.rgb}` : ""}
                  {c.cmyk ? ` · CMYK ${c.cmyk}` : ""}
                </Text>
                {c.usage ? <Text style={styles.swatchUsage}>{c.usage}</Text> : null}
              </View>
            </View>
          ))}
        </DocumentSection>
      ) : null}

      {typography.length > 0 ? (
        <DocumentSection kicker="Type system">
          {typography.map((t, idx) => (
            <View key={`${idx}-${t.family}`} style={styles.typeRow}>
              <Text style={styles.typeFamily}>{t.family}</Text>
              <Text style={styles.typeRole}>{t.role}</Text>
              {t.weights ? <Text style={styles.typeMeta}>{`Weights: ${t.weights}`}</Text> : null}
              {t.pairing ? <Text style={styles.typeMeta}>{`Pairing: ${t.pairing}`}</Text> : null}
            </View>
          ))}
        </DocumentSection>
      ) : null}

      {voiceTone.length > 0 ? (
        <DocumentSection kicker="Voice & tone">
          {voiceTone.map((line, idx) => (
            <Text key={`${idx}-${line}`} style={styles.voiceItem}>
              {`•  ${line}`}
            </Text>
          ))}
        </DocumentSection>
      ) : null}

      {usageNotes.length > 0 ? (
        <DocumentSection kicker="Asset usage">
          {usageNotes.map((line, idx) => (
            <Text key={`${idx}-${line}`} style={styles.voiceItem}>
              {`•  ${line}`}
            </Text>
          ))}
          {project.archiveUrl ? (
            <Text style={styles.archive}>{`Asset archive: ${project.archiveUrl}`}</Text>
          ) : null}
        </DocumentSection>
      ) : null}

      <LegalFooter
        lines={[
          "Brand guidelines are issued for the licensee and engagement scope agreed with Henry Onyx Studio. Redistribution, sub-licensing, or use outside the agreed engagement requires written consent.",
          "Where third-party fonts or imagery are referenced, those assets remain under the licence of their original rights-holders.",
        ]}
      />
    </BrandedDocument>
  );
}
