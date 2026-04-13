import "server-only";

import { normalizeEmail, normalizePhone } from "@henryco/config";
import { createAdminSupabase } from "@/lib/supabase";

export type ContactOverlapSummary = {
  emailMatches: number;
  phoneMatches: number;
  reviewRequired: boolean;
  reasons: string[];
};

export type SignupContactPreflight = {
  emailExists: boolean;
  phoneReviewRequired: boolean;
  duplicateEmailMatches: number;
  duplicatePhoneMatches: number;
  reasons: string[];
  canProceed: boolean;
};

function maskEmail(value: string) {
  const normalized = normalizeEmail(value);
  if (!normalized) return "hidden email";

  const [localPart, domain = ""] = normalized.split("@");
  if (!localPart) return normalized;

  const visible = localPart.slice(0, Math.min(2, localPart.length));
  return `${visible}${"*".repeat(Math.max(1, localPart.length - visible.length))}@${domain}`;
}

function maskPhone(value: string) {
  const normalized = normalizePhone(value);
  if (!normalized) return "hidden phone";

  const tail = normalized.slice(-4);
  return `${"*".repeat(Math.max(4, normalized.length - 4))}${tail}`;
}

export async function getContactOverlapSummary(input: {
  userId?: string | null;
  email?: string | null;
  phone?: string | null;
}): Promise<ContactOverlapSummary> {
  const admin = createAdminSupabase();
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);

  const [emailOverlap, phoneOverlap] = await Promise.all([
    email
      ? admin
          .from("customer_profiles")
          .select("id", { count: "exact", head: true })
          .eq("email", email)
          .neq("id", input.userId || "00000000-0000-0000-0000-000000000000")
      : Promise.resolve({ count: 0, error: null } as const),
    phone
      ? admin
          .from("customer_profiles")
          .select("id", { count: "exact", head: true })
          .eq("phone", phone)
          .neq("id", input.userId || "00000000-0000-0000-0000-000000000000")
      : Promise.resolve({ count: 0, error: null } as const),
  ]);

  const emailMatches = emailOverlap.error ? 0 : Number(emailOverlap.count || 0);
  const phoneMatches = phoneOverlap.error ? 0 : Number(phoneOverlap.count || 0);
  const reasons: string[] = [];

  if (emailMatches > 0 && email) {
    reasons.push(
      `${maskEmail(email)} appears on ${emailMatches + 1} HenryCo account${emailMatches === 1 ? "" : "s"} and needs review before higher-trust actions unlock.`
    );
  }

  if (phoneMatches > 0 && phone) {
    reasons.push(
      `${maskPhone(phone)} appears on ${phoneMatches + 1} HenryCo account${phoneMatches === 1 ? "" : "s"} and stays under manual trust review for higher-risk workflows.`
    );
  }

  return {
    emailMatches,
    phoneMatches,
    reviewRequired: emailMatches > 0 || phoneMatches > 0,
    reasons,
  };
}

export async function getSignupContactPreflight(input: {
  email?: string | null;
  phone?: string | null;
}): Promise<SignupContactPreflight> {
  const overlap = await getContactOverlapSummary({
    email: input.email,
    phone: input.phone,
  });
  const reasons = [
    overlap.emailMatches > 0
      ? "This email already belongs to a HenryCo account. Sign in or reset your password instead of opening a second account."
      : null,
    ...overlap.reasons,
  ].filter(Boolean) as string[];

  return {
    emailExists: overlap.emailMatches > 0,
    phoneReviewRequired: overlap.phoneMatches > 0,
    duplicateEmailMatches: overlap.emailMatches,
    duplicatePhoneMatches: overlap.phoneMatches,
    reasons,
    canProceed: overlap.emailMatches === 0,
  };
}
