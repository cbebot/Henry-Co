import { BRAND_EMAILS } from "@henryco/config";

import type { EmailPurpose, ResolvedSender } from "./types";

const NOREPLY_FALLBACK_EMAIL = BRAND_EMAILS.noreply;
const NOREPLY_FALLBACK_NAME = "Henry Onyx";

function readEnv(name: string): string | null {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : null;
}

function readFirst(...names: string[]): string | null {
  for (const name of names) {
    const value = readEnv(name);
    if (value) return value;
  }
  return null;
}

/**
 * Generic noreply identity. Used as the safe fallback when a purpose-specific
 * env var is not configured. Care must never become the global fallback —
 * unrelated mail going out as "Henry Onyx Care" damages trust.
 */
function noreplyIdentity(): ResolvedSender {
  // EMAIL-POSTMARK (2026-07-14): the from-address falls back to the Postmark
  // sender env, never a retired-vendor alias (AWS_SES_FROM_EMAIL /
  // BREVO_SENDER_EMAIL / RESEND_* removed) — a stale value in a retired-vendor
  // var can no longer poison the sender identity.
  return {
    email: readFirst("HENRYCO_NOREPLY_EMAIL", "POSTMARK_FROM_EMAIL") || NOREPLY_FALLBACK_EMAIL,
    name: readFirst("HENRYCO_NOREPLY_FROM_NAME") || NOREPLY_FALLBACK_NAME,
  };
}

type IdentityRule = {
  emailVars: string[];
  nameVars: string[];
  defaultName: string;
};

const RULES: Record<EmailPurpose, IdentityRule> = {
  auth: {
    emailVars: ["HENRYCO_ACCOUNTS_EMAIL"],
    nameVars: ["HENRYCO_ACCOUNTS_FROM_NAME"],
    defaultName: "Henry Onyx Accounts",
  },
  support: {
    // EMAIL-POSTMARK (2026-07-14): legacy RESEND_SUPPORT_* aliases removed.
    emailVars: ["HENRYCO_SUPPORT_EMAIL"],
    nameVars: ["HENRYCO_SUPPORT_FROM_NAME"],
    defaultName: "Henry Onyx Support",
  },
  care: {
    emailVars: ["HENRYCO_CARE_EMAIL"],
    nameVars: ["HENRYCO_CARE_FROM_NAME"],
    defaultName: "Henry Onyx Care",
  },
  studio: {
    emailVars: ["HENRYCO_STUDIO_EMAIL"],
    nameVars: ["HENRYCO_STUDIO_FROM_NAME"],
    defaultName: "Henry Onyx Studio",
  },
  marketplace: {
    emailVars: ["HENRYCO_MARKETPLACE_EMAIL"],
    nameVars: ["HENRYCO_MARKETPLACE_FROM_NAME"],
    defaultName: "Henry Onyx Marketplace",
  },
  jobs: {
    emailVars: ["HENRYCO_JOBS_EMAIL"],
    nameVars: ["HENRYCO_JOBS_FROM_NAME"],
    defaultName: "Henry Onyx Jobs",
  },
  learn: {
    emailVars: ["HENRYCO_LEARN_EMAIL"],
    nameVars: ["HENRYCO_LEARN_FROM_NAME"],
    defaultName: "Henry Onyx Learn",
  },
  property: {
    emailVars: ["HENRYCO_PROPERTY_EMAIL"],
    nameVars: ["HENRYCO_PROPERTY_FROM_NAME"],
    defaultName: "Henry Onyx Property",
  },
  logistics: {
    emailVars: ["HENRYCO_LOGISTICS_EMAIL"],
    nameVars: ["HENRYCO_LOGISTICS_FROM_NAME"],
    defaultName: "Henry Onyx Logistics",
  },
  newsletter: {
    emailVars: ["HENRYCO_NEWSLETTER_EMAIL"],
    nameVars: ["HENRYCO_NEWSLETTER_FROM_NAME"],
    defaultName: "Henry Onyx Editorial",
  },
  security: {
    emailVars: ["HENRYCO_SECURITY_EMAIL"],
    nameVars: ["HENRYCO_SECURITY_FROM_NAME"],
    defaultName: "Henry Onyx Security",
  },
  generic: {
    emailVars: ["HENRYCO_GENERIC_EMAIL"],
    nameVars: ["HENRYCO_GENERIC_FROM_NAME"],
    defaultName: "Henry Onyx",
  },
};

/**
 * Resolve the sender identity for a given email purpose.
 *
 * Resolution order, per-purpose:
 *   1. Purpose-specific env vars (e.g., HENRYCO_STUDIO_EMAIL).
 *   2. The shared HENRYCO_NOREPLY_EMAIL (or POSTMARK_FROM_EMAIL),
 *      using the purpose's branded name (e.g., "Henry Onyx Studio") so the
 *      message is still labelled correctly even if individual aliases
 *      are not yet DNS/DKIM-verified in Postmark.
 *   3. Hard fallback to BRAND_EMAILS.noreply / "Henry Onyx".
 *
 * Critical invariant: nothing here ever falls back to the Care identity.
 * The Care sender is reachable only when `purpose === "care"`.
 */
export function resolveSenderIdentity(purpose: EmailPurpose): ResolvedSender {
  const rule = RULES[purpose];
  const noreply = noreplyIdentity();

  return {
    email: readFirst(...rule.emailVars) || noreply.email,
    name: readFirst(...rule.nameVars) || rule.defaultName,
  };
}

export function getNoReplyIdentity(): ResolvedSender {
  return noreplyIdentity();
}
