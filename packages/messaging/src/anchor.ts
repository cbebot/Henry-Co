import type { ContextAnchor, ContextAnchorType } from "./types";

const VALID: ReadonlySet<ContextAnchorType> = new Set([
  "support", "order", "listing", "booking", "job",
  "studio_project", "property_inquiry", "learn_cohort", "direct",
]);

export function normalizeAnchor(input: { type?: string; id?: string | null; division: string }): ContextAnchor {
  const type = input.type && VALID.has(input.type as ContextAnchorType)
    ? (input.type as ContextAnchorType)
    : "direct";
  const id = type === "direct" ? null : (input.id ?? null);
  return { type, id, division: input.division };
}
