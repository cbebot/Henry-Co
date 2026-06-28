/**
 * Lightweight formatting helpers for the business module's widgets.
 * Mirrors `packages/dashboard-modules-marketplace/src/format.ts` so the
 * module package stays self-contained.
 */

import type { BusinessRole, BusinessStatus } from "./data";

/**
 * Title-case status enum values (`out_for_delivery` → `Out for delivery`).
 */
export function titleCaseStatus(value: string | null | undefined): string {
  if (!value) return "—";
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

/** Human label for a business membership role. */
export function roleLabel(role: BusinessRole): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "member":
      return "Member";
  }
}

/** Chip tone keyed to the business's verification/lifecycle status. */
export function statusChipTone(
  status: BusinessStatus,
): "success" | "warning" | "urgent" | "neutral" {
  switch (status) {
    case "active":
      return "success";
    case "pending":
      return "warning";
    case "suspended":
    case "closed":
      return "urgent";
    default:
      return "neutral";
  }
}
