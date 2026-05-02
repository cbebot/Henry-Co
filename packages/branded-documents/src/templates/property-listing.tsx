import * as React from "react";
import { View, Text, StyleSheet, Image } from "@react-pdf/renderer";

import { BrandedDocument } from "../components/BrandedDocument";
import { DocumentSection, DefinitionList } from "../components/DocumentSection";
import { LegalFooter } from "../components/SignatureBlock";
import { formatKobo, titleCase } from "../format";
import { letterSpacing, palette, typeScale } from "../tokens";

export type PropertyListingProps = {
  listing: {
    id: string;
    slug: string;
    title: string;
    transactionType: "sale" | "rent" | "lease";
    priceKobo: number;
    pricePeriod?: "month" | "year" | "once";
    currency: string;
    bedrooms?: number | null;
    bathrooms?: number | null;
    areaSqm?: number | null;
    description: string;
    address: { line1: string; city: string; state: string; country?: string | null };
    amenities: string[];
    heroImages: string[];
  };
  agent: {
    name: string;
    role: string;
    phone?: string | null;
    email: string;
    licenseNumber?: string | null;
  };
};

const styles = StyleSheet.create({
  hero: {
    marginTop: 18,
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  heroPrimary: {
    width: "100%",
    height: 220,
    borderRadius: 6,
    objectFit: "cover",
  },
  heroSecondaryRow: { flexDirection: "row", gap: 8, width: "100%" },
  heroSecondary: { flex: 1, height: 110, borderRadius: 6, objectFit: "cover" },
  priceBlock: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: palette.paperElev,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 6,
  },
  priceLabel: {
    fontSize: typeScale.hairline,
    fontFamily: "HenryCoSans",
    color: palette.inkMuted,
    textTransform: "uppercase",
    letterSpacing: letterSpacing.kicker * 6,
    fontWeight: 700,
  },
  priceValue: {
    fontSize: typeScale.head,
    fontFamily: "HenryCoMono",
    color: palette.ink,
    fontWeight: 700,
  },
  amenityChips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
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
});

export function PropertyListingDocument({ listing, agent }: PropertyListingProps) {
  const period =
    listing.pricePeriod === "month" ? " /month" : listing.pricePeriod === "year" ? " /year" : "";
  const [primary, ...secondary] = listing.heroImages;

  return (
    <BrandedDocument
      metadata={{
        title: `${listing.title} — HenryCo Property`,
        subject: "Property listing one-pager",
        keywords: ["property", "real-estate", listing.transactionType, listing.title],
      }}
      header={{
        documentType: "Property listing",
        title: listing.title,
        subtitle: `${listing.address.line1}, ${listing.address.city}, ${listing.address.state}`,
        meta: [
          { label: "Type", value: titleCase(listing.transactionType) },
          { label: "Bed/Bath", value: `${listing.bedrooms ?? "—"} / ${listing.bathrooms ?? "—"}` },
          { label: "Area", value: listing.areaSqm ? `${listing.areaSqm} m²` : "—" },
        ],
        divisionLabel: "Property",
      }}
      division="property"
    >
      <View style={styles.hero}>
        {primary ? <Image src={primary} style={styles.heroPrimary} /> : null}
        {secondary.length > 0 ? (
          <View style={styles.heroSecondaryRow}>
            {secondary.slice(0, 3).map((src) => (
              <Image key={src} src={src} style={styles.heroSecondary} />
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.priceBlock}>
        <Text style={styles.priceLabel}>{listing.transactionType === "sale" ? "Sale price" : "Asking"}</Text>
        <Text style={styles.priceValue}>
          {formatKobo(listing.priceKobo, listing.currency)}
          {period}
        </Text>
      </View>

      <DocumentSection kicker="Overview">
        <Text style={{ fontSize: typeScale.body, fontFamily: "HenryCoSans", color: palette.inkSoft, lineHeight: 1.6 }}>
          {listing.description}
        </Text>
      </DocumentSection>

      <DocumentSection kicker="Amenities">
        <View style={styles.amenityChips}>
          {listing.amenities.map((a) => (
            <Text key={a} style={styles.chip}>
              {a}
            </Text>
          ))}
        </View>
      </DocumentSection>

      <DocumentSection kicker="Listing agent" tone="accent">
        <DefinitionList
          rows={[
            { label: "Name", value: agent.name },
            { label: "Role", value: agent.role },
            { label: "Phone", value: agent.phone ?? "—" },
            { label: "Email", value: agent.email },
            { label: "License", value: agent.licenseNumber ?? "—", mono: true },
          ]}
        />
      </DocumentSection>

      <LegalFooter
        lines={[
          "Listing data is published for marketing purposes. Final terms — including price, condition, and availability — are confirmed in writing through the agent above.",
          "HenryCo Property does not act as principal for any sale or lease unless explicitly stated; brokerage fees are governed by the engagement agreement.",
        ]}
      />
    </BrandedDocument>
  );
}
