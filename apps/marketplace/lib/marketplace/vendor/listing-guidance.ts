// Human guidance for vendor listings — pure and testable, copy via injected `t`
// (pages own their translateSurfaceLabel). Thresholds mirror
// `evaluateListingSubmission` in lib/marketplace/governance.ts:
//   qualityScore < 68 → manual review; qualityScore >= 80 → high-quality badge;
//   riskScore >= 35   → risk review.
import type { ProductApprovalStatus } from "../types";

type Translate = (label: string) => string;

/** Humanized listing state — raw enum values never reach the page. */
export function approvalStatusLabel(status: ProductApprovalStatus, t: Translate): string {
  switch (status) {
    case "submitted":
      return t("Submitted");
    case "under_review":
      return t("Under review");
    case "approved":
      return t("Live");
    case "changes_requested":
      return t("Changes requested");
    case "rejected":
      return t("Rejected");
    case "draft":
    default:
      return t("Draft");
  }
}

function score(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

/**
 * One calm sentence in place of raw Quality/Risk score chips. Reads the
 * quality/risk numbers the upsert assessment stored in `filter_data`.
 */
export function listingGuidance(filterData: Record<string, unknown>, t: Translate): string {
  const quality = score(filterData.qualityScore);
  const risk = score(filterData.riskScore);
  if (quality === null && risk === null) {
    return t("Not yet assessed. Save or submit the listing to receive guidance.");
  }
  if ((risk ?? 0) >= 35) {
    return t("Held for risk review. Check the listing details before resubmitting.");
  }
  if ((quality ?? 0) >= 80) {
    return t("Strong listing. Complete details like this move through moderation fastest.");
  }
  if ((quality ?? 0) >= 68) {
    return t("Solid listing. A fuller description and clearer delivery details would strengthen it.");
  }
  // Only ask for a photo when one is genuinely missing. `hasPrimaryImage` is false only when
  // absent; a listing that already has a photo but scores low gets the copy-focused nudge, so
  // the guidance never tells a seller to add a photo they can plainly see is already there.
  const hasPhoto = filterData.hasPrimaryImage !== false;
  return hasPhoto
    ? t("Needs more detail. A fuller description and clear delivery details will move it through review faster.")
    : t("Needs more detail. Add a photo, a fuller description, and clear delivery details to move through review faster.");
}
