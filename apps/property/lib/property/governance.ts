import type {
  PropertyListingInspectionStatus,
  PropertyListingStatus,
} from "@/lib/property/types";

export const PROPERTY_PUBLIC_STATUSES: PropertyListingStatus[] = ["approved", "published"];

export const PROPERTY_REVIEW_QUEUE_STATUSES: PropertyListingStatus[] = [
  "submitted",
  "awaiting_documents",
  "awaiting_eligibility",
  "inspection_requested",
  "inspection_scheduled",
  "under_review",
  "requires_correction",
  "changes_requested",
  "blocked",
  "escalated",
];

export function isPropertyListingPublicStatus(status: string) {
  return PROPERTY_PUBLIC_STATUSES.includes(status as PropertyListingStatus);
}

export function isPropertyListingReviewQueueStatus(status: string) {
  return PROPERTY_REVIEW_QUEUE_STATUSES.includes(status as PropertyListingStatus);
}

export function getPropertyListingStatusSummary(status: PropertyListingStatus) {
  switch (status) {
    case "awaiting_documents":
      return "More evidence is required before editorial review can continue.";
    case "awaiting_eligibility":
      return "Identity, authority, or trust prerequisites are still incomplete.";
    case "inspection_requested":
      return "HenryCo needs an inspection workflow before publication can continue.";
    case "inspection_scheduled":
      return "An inspection is already booked or being locked in.";
    case "under_review":
      return "The submission is in editorial and policy review.";
    case "requires_correction":
    case "changes_requested":
      return "The owner or agent needs to fix copy, evidence, or readiness details.";
    case "blocked":
      return "The listing is held back because the current trust posture is too weak.";
    case "escalated":
      return "The listing needs higher-scrutiny staff review before it can move forward.";
    case "approved":
      return "The listing is approved for trusted publication.";
    case "published":
      return "The listing is live on the public HenryCo Property surface.";
    case "rejected":
      return "The listing was rejected and will not move forward without a new submission path.";
    case "verified":
      return "The listing has passed verification steps and is ready for final publication handling.";
    case "submitted":
      return "The listing has entered the trust and moderation pipeline.";
    case "archived":
      return "The listing is no longer active.";
    case "draft":
    default:
      return "The listing has not entered the public governance flow yet.";
  }
}

export function resolveListingStatusFromInspectionStatus(
  currentStatus: PropertyListingStatus,
  inspectionStatus: PropertyListingInspectionStatus
): PropertyListingStatus {
  if (isPropertyListingPublicStatus(currentStatus)) {
    return currentStatus;
  }

  switch (inspectionStatus) {
    case "requested":
      return "inspection_requested";
    case "scheduled":
      return "inspection_scheduled";
    case "completed":
    case "waived":
      return "under_review";
    case "failed":
      return "blocked";
    case "cancelled":
      return "changes_requested";
    default:
      return currentStatus;
  }
}
