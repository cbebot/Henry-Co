/**
 * Pure helpers for the vendor product image gallery (multi-image write path).
 * No React, no server imports — safe to unit-test and to import from the API route.
 */

/** Max images kept per product — a generous gallery without unbounded writes. */
export const MAX_PRODUCT_IMAGES = 10;

/**
 * The ordered product images to persist, first = cover. Prefers the multi-image field's
 * JSON array (`image_urls`); falls back to the legacy single `image_url`. Keeps only
 * non-empty strings, dedupes preserving order, and caps the count. Never throws on bad JSON.
 */
export function parseProductImageRefs(jsonArray: string, legacySingle: string): string[] {
  const out: string[] = [];
  const push = (value: unknown) => {
    if (typeof value !== "string") return;
    const trimmed = value.trim();
    if (trimmed && !out.includes(trimmed) && out.length < MAX_PRODUCT_IMAGES) out.push(trimmed);
  };
  if (jsonArray) {
    try {
      const parsed = JSON.parse(jsonArray) as unknown;
      if (Array.isArray(parsed)) parsed.forEach(push);
    } catch {
      /* malformed → fall through to the legacy single below */
    }
  }
  if (out.length === 0) push(legacySingle);
  return out;
}

/** The media rows to persist for a product's gallery — first is the cover. */
export function buildProductMediaRows(
  productId: string,
  imageRefs: string[],
): Array<{ product_id: string; url: string; kind: "image"; is_primary: boolean; sort_order: number }> {
  return imageRefs.map((url, index) => ({
    product_id: productId,
    url,
    kind: "image",
    is_primary: index === 0,
    sort_order: index,
  }));
}
