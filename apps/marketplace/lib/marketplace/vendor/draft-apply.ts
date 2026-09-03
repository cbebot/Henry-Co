/**
 * Vendor draft apply pipeline — PURE (no React, no DOM).
 *
 * The product form owns its values in React state; the Henry Onyx Intelligence
 * panel hands a draft to this function through a typed callback. This replaces
 * the old querySelector/native-setter approach, which could silently miss
 * fields — the failure class this module eliminates.
 *
 * Respect rules:
 * - Core listing copy (title / summary / description) OVERWRITES: the seller
 *   asked for a draft of the copy. Title falls back to the seller's idea when
 *   the draft carries none. Specifications, when present, are appended to the
 *   description after a blank line.
 * - Factual fields (material, warranty, delivery_note, lead_time) fill ONLY
 *   when currently empty — the model never overwrites facts the seller stated.
 * - Empty draft fields never blank anything.
 * - `applied` lists exactly the field names that actually changed.
 *
 * Category is NOT applied here: the component option-matches the raw
 * `draft.category` label against its own option list (same includes() logic
 * the DOM path used).
 */

export interface ListingDraftInput {
  title?: string;
  summary?: string;
  description?: string;
  category?: string;
  specifications?: string;
  material?: string;
  warranty?: string;
  deliveryNote?: string;
  leadTime?: string;
}

export type ProductFieldValues = Record<string, string | boolean>;

export interface DraftApplyResult {
  next: ProductFieldValues;
  applied: string[];
}

const clean = (value: string | undefined): string => (value ?? "").trim();

export function applyDraftToFields(
  draft: ListingDraftInput,
  current: ProductFieldValues,
  ideaFallback: string,
): DraftApplyResult {
  const next: ProductFieldValues = { ...current };
  const applied: string[] = [];

  const currentText = (name: string): string => {
    const value = current[name];
    return typeof value === "string" ? value : "";
  };

  /** Core copy: overwrite with a non-empty value; skip when nothing changes. */
  const overwrite = (name: string, value: string): void => {
    if (!value) return;
    if (currentText(name) === value) return;
    next[name] = value;
    applied.push(name);
  };

  /** Facts: fill only when the seller left the field empty. */
  const fillIfEmpty = (name: string, value: string): void => {
    if (!value) return;
    if (currentText(name).trim()) return;
    next[name] = value;
    applied.push(name);
  };

  overwrite("title", clean(draft.title) || clean(ideaFallback));
  overwrite("summary", clean(draft.summary));

  const story = [clean(draft.description), clean(draft.specifications)]
    .filter(Boolean)
    .join("\n\n");
  overwrite("description", story);

  fillIfEmpty("material", clean(draft.material));
  fillIfEmpty("warranty", clean(draft.warranty));
  fillIfEmpty("delivery_note", clean(draft.deliveryNote));
  fillIfEmpty("lead_time", clean(draft.leadTime));

  return { next, applied };
}
