import { COMPANY, getDivisionConfig } from "@henryco/config";
import type { JsonLdNode } from "./base";

export type LocalBusinessOptions = {
  key: "hub";
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry: string;
  };
  geo?: { latitude: number; longitude: number };
  openingHours?: string[];
  priceRange?: string;
};

export function buildLocalBusinessLd(opts: LocalBusinessOptions): JsonLdNode {
  const division = getDivisionConfig(opts.key);
  const url = `https://${COMPANY.group.baseDomain}`;
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${url}#localbusiness`,
    name: division.name,
    description: division.description,
    url,
    email: division.supportEmail,
    // NUMBER-PURGE (2026-07-10): NO telephone in structured data — Google was
    // lifting the digits into the search snippet. Email only.
    priceRange: opts.priceRange,
    address: {
      "@type": "PostalAddress",
      ...opts.address,
    },
    geo: opts.geo
      ? {
          "@type": "GeoCoordinates",
          latitude: opts.geo.latitude,
          longitude: opts.geo.longitude,
        }
      : undefined,
    openingHoursSpecification: opts.openingHours,
  };
}
