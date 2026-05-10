import type { JsonLdNode } from "./base";

export type RealEstateListingKind =
  | "rent"
  | "sale"
  | "land"
  | "commercial"
  | "managed"
  | "shortlet";

export type RealEstateListingAvailability =
  | "InStock"
  | "OutOfStock"
  | "PreOrder"
  | "Discontinued";

export type RealEstateListingAgent = {
  name: string;
  telephone?: string;
  email?: string;
  imageUrl?: string;
  areaServed?: string[];
};

export type RealEstateListingAddress = {
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  addressCountry?: string;
};

export type RealEstateListingOptions = {
  name: string;
  description?: string;
  url: string;
  imageUrls?: string[];
  datePosted?: string;
  kind: RealEstateListingKind;
  bedrooms?: number | null;
  bathrooms?: number | null;
  /** Floor size in square metres. */
  sizeSqm?: number | null;
  petsAllowed?: boolean;
  amenities?: string[];
  address?: RealEstateListingAddress;
  offer?: {
    price: number;
    priceCurrency: string;
    availability: RealEstateListingAvailability;
    /** ISO-8601 timestamp; only emitted when availability is PreOrder. */
    availabilityStarts?: string | null;
  };
  agent?: RealEstateListingAgent;
};

// Residential rent/sale/managed/shortlet → Accommodation (parent class supporting
// numberOfRooms / numberOfBathroomsTotal / floorSize / amenityFeature).
// Land/commercial → Place; the residential properties don't apply.
function mainEntityType(kind: RealEstateListingKind): "Accommodation" | "Place" {
  return kind === "land" || kind === "commercial" ? "Place" : "Accommodation";
}

function buildAccommodationOrPlace(opts: RealEstateListingOptions): JsonLdNode {
  const isResidential = mainEntityType(opts.kind) === "Accommodation";

  const amenityFeature = (opts.amenities ?? [])
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({
      "@type": "LocationFeatureSpecification",
      name,
      value: true,
    }));

  return {
    "@type": mainEntityType(opts.kind),
    name: opts.name,
    address: opts.address
      ? {
          "@type": "PostalAddress",
          streetAddress: opts.address.streetAddress,
          addressLocality: opts.address.addressLocality,
          addressRegion: opts.address.addressRegion,
          addressCountry: opts.address.addressCountry,
        }
      : undefined,
    numberOfRooms: isResidential
      ? opts.bedrooms ?? undefined
      : undefined,
    numberOfBedrooms: isResidential
      ? opts.bedrooms ?? undefined
      : undefined,
    numberOfBathroomsTotal: isResidential
      ? opts.bathrooms ?? undefined
      : undefined,
    floorSize:
      typeof opts.sizeSqm === "number" && opts.sizeSqm > 0
        ? {
            "@type": "QuantitativeValue",
            value: opts.sizeSqm,
            unitCode: "MTK",
          }
        : undefined,
    petsAllowed:
      isResidential && typeof opts.petsAllowed === "boolean"
        ? opts.petsAllowed
        : undefined,
    amenityFeature: amenityFeature.length > 0 ? amenityFeature : undefined,
  };
}

export function buildRealEstateListingLd(opts: RealEstateListingOptions): JsonLdNode {
  const offer = opts.offer
    ? {
        "@type": "Offer",
        price: String(opts.offer.price),
        priceCurrency: opts.offer.priceCurrency,
        availability: `https://schema.org/${opts.offer.availability}`,
        availabilityStarts:
          opts.offer.availability === "PreOrder" && opts.offer.availabilityStarts
            ? opts.offer.availabilityStarts
            : undefined,
        url: opts.url,
      }
    : undefined;

  const agent = opts.agent
    ? {
        "@type": "RealEstateAgent",
        name: opts.agent.name,
        telephone: opts.agent.telephone,
        email: opts.agent.email,
        image: opts.agent.imageUrl,
        areaServed: opts.agent.areaServed,
      }
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: opts.name,
    description: opts.description,
    url: opts.url,
    image: opts.imageUrls,
    datePosted: opts.datePosted,
    mainEntity: buildAccommodationOrPlace(opts),
    offers: offer,
    realEstateAgent: agent,
  };
}
