import type { JsonLdNode } from "./base";

export type AggregateRatingOptions = {
  itemName: string;
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  worstRating?: number;
};

export function buildAggregateRatingLd(opts: AggregateRatingOptions): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    itemReviewed: {
      "@type": "Thing",
      name: opts.itemName,
    },
    ratingValue: opts.ratingValue,
    reviewCount: opts.reviewCount,
    bestRating: opts.bestRating ?? 5,
    worstRating: opts.worstRating ?? 1,
  };
}
