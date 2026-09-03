import { COMPANY } from "./company";

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function stableSupportToken(seed: string) {
  let hash = 2166136261;

  for (const char of seed) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36).toUpperCase().padStart(8, "0").slice(0, 8);
}

export function buildSupportThreadRef(threadId: string) {
  return `SUP-${stableSupportToken(cleanText(threadId) || "henryco-support")}`;
}

export function mapAccountSupportCategoryToDivision(category: string | null | undefined) {
  const normalized = cleanText(category).toLowerCase();

  if (normalized === "care") return "care";
  if (normalized === "marketplace") return "marketplace";
  if (normalized === "jobs") return "jobs";
  if (normalized === "learn") return "learn";
  if (normalized === "studio") return "studio";
  if (normalized === "property") return "property";
  if (normalized === "logistics") return "logistics";

  return "account";
}

export function mapAccountSupportCategoryToCareServiceCategory(category: string | null | undefined) {
  const normalized = cleanText(category).toLowerCase();

  if (normalized === "billing" || normalized === "wallet") {
    return "billing_payment";
  }

  return "general";
}

export function mapSupportPriorityToCareUrgency(priority: string | null | undefined) {
  const normalized = cleanText(priority).toLowerCase();

  if (normalized === "urgent") return "urgent";
  if (normalized === "high") return "priority";

  return "routine";
}

export function mapAccountSupportStatusToCareStatus(status: string | null | undefined) {
  const normalized = cleanText(status).toLowerCase();

  if (normalized === "resolved" || normalized === "closed") {
    return "resolved";
  }

  if (normalized === "awaiting_reply" || normalized === "in_progress") {
    return "open";
  }

  if (normalized === "open") {
    return "open";
  }

  return "new";
}

export function mapCareSupportStatusToAccountStatus(status: string | null | undefined) {
  const normalized = cleanText(status).toLowerCase();

  if (normalized === "resolved") {
    return "resolved";
  }

  if (normalized === "pending_customer") {
    return "awaiting_reply";
  }

  if (normalized === "open" || normalized === "new") {
    return "in_progress";
  }

  return "open";
}

/**
 * NUMBER-PURGE + SINGLE-SOURCE (owner 2026-07-08, HARDENED 2026-07-10): raw
 * company numbers never render anywhere; every chat affordance builds its ONE
 * masked wa.me href HERE — and there is exactly ONE source: the code constant
 * `COMPANY.group.supportPhone` (packages/config/company.ts). The owner found
 * divisions showing DIFFERENT WhatsApp numbers because callers threaded
 * per-division CMS values (care payment_support_whatsapp / payment_whatsapp /
 * support_phone, studio platform settings, …) through the old `override`
 * param. The param is now ACCEPTED-BUT-IGNORED (kept so legacy call sites
 * compile) — no CMS row or division config can fragment the number again.
 * Changing the company number is a single edit to that one constant.
 */
export function getSupportWhatsAppHref(_ignoredLegacyOverride?: string | null): string {
  const digits = String(COMPANY.group.supportPhone).replace(/[^0-9]/g, "");
  return `https://wa.me/${digits}`;
}
