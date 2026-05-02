import type { JsonLdNode } from "./base";

export type ProductOfferAvailability =
  | "InStock"
  | "OutOfStock"
  | "PreOrder"
  | "BackOrder"
  | "Discontinued";

export type ProductOptions = {
  name: string;
  description?: string;
  sku?: string;
  brand?: string;
  imageUrls?: string[];
  url: string;
  offers: {
    priceCurrency: string;
    price: string;
    availability: ProductOfferAvailability;
    url: string;
    priceValidUntil?: string;
  };
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
    bestRating?: number;
  };
};

export function buildProductLd(opts: ProductOptions): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: opts.name,
    description: opts.description,
    sku: opts.sku,
    image: opts.imageUrls,
    url: opts.url,
    brand: opts.brand
      ? {
          "@type": "Brand",
          name: opts.brand,
        }
      : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: opts.offers.priceCurrency,
      price: opts.offers.price,
      availability: `https://schema.org/${opts.offers.availability}`,
      url: opts.offers.url,
      priceValidUntil: opts.offers.priceValidUntil,
    },
    aggregateRating: opts.aggregateRating
      ? {
          "@type": "AggregateRating",
          ratingValue: opts.aggregateRating.ratingValue,
          reviewCount: opts.aggregateRating.reviewCount,
          bestRating: opts.aggregateRating.bestRating ?? 5,
        }
      : undefined,
  };
}
