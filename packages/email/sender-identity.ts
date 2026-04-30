import type { EmailPurpose, ResolvedSender } from "./types";

const NOREPLY_FALLBACK_EMAIL = "noreply@henrycogroup.com";
const NOREPLY_FALLBACK_NAME = "HenryCo";

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
 * unrelated mail going out as "HenryCo Care" damages trust.
 */
function noreplyIdentity(): ResolvedSender {
  return {
    email: readFirst("HENRYCO_NOREPLY_EMAIL", "BREVO_SENDER_EMAIL") || NOREPLY_FALLBACK_EMAIL,
    name: readFirst("HENRYCO_NOREPLY_FROM_NAME", "BREVO_SENDER_NAME") || NOREPLY_FALLBACK_NAME,
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
    defaultName: "HenryCo Accounts",
  },
  support: {
    emailVars: ["HENRYCO_SUPPORT_EMAIL", "RESEND_SUPPORT_FROM_EMAIL"],
    nameVars: ["HENRYCO_SUPPORT_FROM_NAME", "RESEND_SUPPORT_FROM_NAME"],
    defaultName: "HenryCo Support",
  },
  care: {
    emailVars: ["HENRYCO_CARE_EMAIL"],
    nameVars: ["HENRYCO_CARE_FROM_NAME"],
    defaultName: "HenryCo Care",
  },
  studio: {
    emailVars: ["HENRYCO_STUDIO_EMAIL"],
    nameVars: ["HENRYCO_STUDIO_FROM_NAME"],
    defaultName: "HenryCo Studio",
  },
  marketplace: {
    emailVars: ["HENRYCO_MARKETPLACE_EMAIL"],
    nameVars: ["HENRYCO_MARKETPLACE_FROM_NAME"],
    defaultName: "HenryCo Marketplace",
  },
  jobs: {
    emailVars: ["HENRYCO_JOBS_EMAIL"],
    nameVars: ["HENRYCO_JOBS_FROM_NAME"],
    defaultName: "HenryCo Jobs",
  },
  learn: {
    emailVars: ["HENRYCO_LEARN_EMAIL"],
    nameVars: ["HENRYCO_LEARN_FROM_NAME"],
    defaultName: "HenryCo Learn",
  },
  property: {
    emailVars: ["HENRYCO_PROPERTY_EMAIL"],
    nameVars: ["HENRYCO_PROPERTY_FROM_NAME"],
    defaultName: "HenryCo Property",
  },
  logistics: {
    emailVars: ["HENRYCO_LOGISTICS_EMAIL"],
    nameVars: ["HENRYCO_LOGISTICS_FROM_NAME"],
    defaultName: "HenryCo Logistics",
  },
  newsletter: {
    emailVars: ["HENRYCO_NEWSLETTER_EMAIL"],
    nameVars: ["HENRYCO_NEWSLETTER_FROM_NAME"],
    defaultName: "HenryCo Editorial",
  },
  security: {
    emailVars: ["HENRYCO_SECURITY_EMAIL"],
    nameVars: ["HENRYCO_SECURITY_FROM_NAME"],
    defaultName: "HenryCo Security",
  },
  generic: {
    emailVars: ["HENRYCO_GENERIC_EMAIL"],
    nameVars: ["HENRYCO_GENERIC_FROM_NAME"],
    defaultName: "HenryCo",
  },
};

/**
 * Resolve the sender identity for a given email purpose.
 *
 * Resolution order, per-purpose:
 *   1. Purpose-specific env vars (e.g., HENRYCO_STUDIO_EMAIL).
 *   2. The shared HENRYCO_NOREPLY_EMAIL (or its alias BREVO_SENDER_EMAIL),
 *      using the purpose's branded name (e.g., "HenryCo Studio") so the
 *      message is still labelled correctly even if individual aliases
 *      are not yet DNS/Brevo-verified.
 *   3. Hard fallback to noreply@henrycogroup.com / "HenryCo".
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
