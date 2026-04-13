import "server-only";

import { normalizeEmail, normalizePhone } from "@henryco/config";
import { getCountry } from "@henryco/i18n";
import { createStaffAdminSupabase } from "@/lib/supabase/admin";

const PROPERTY_RUNTIME_BUCKET = "property-runtime";

type PropertyListingRecord = {
  id: string;
  status: string;
};

type PropertyInquiryRecord = {
  id: string;
  status: string;
};

type PropertyViewingRecord = {
  id: string;
  status: string;
};

type CustomerProfileRecord = {
  id: string;
  email: string | null;
  phone: string | null;
  country: string | null;
  currency: string | null;
  timezone: string | null;
};

type StaffRiskRow = {
  label: string;
  detail: string;
  tone: "warning" | "critical";
};

function maskEmail(value: string | null) {
  const normalized = normalizeEmail(value);
  if (!normalized) return "hidden email";

  const [localPart, domain = ""] = normalized.split("@");
  const visible = localPart.slice(0, Math.min(2, localPart.length));
  return `${visible}${"*".repeat(Math.max(1, localPart.length - visible.length))}@${domain}`;
}

function maskPhone(value: string | null) {
  const normalized = normalizePhone(value);
  if (!normalized) return "hidden phone";
  return `${"*".repeat(Math.max(4, normalized.length - 4))}${normalized.slice(-4)}`;
}

async function listJsonCollection<T>(folder: string): Promise<T[]> {
  const admin = createStaffAdminSupabase();
  try {
    const { data: files, error } = await admin.storage.from(PROPERTY_RUNTIME_BUCKET).list(folder, {
      limit: 500,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) throw error;

    const records = await Promise.all(
      (files ?? [])
        .filter((file) => file.name.endsWith(".json"))
        .map(async (file) => {
          const { data } = await admin.storage
            .from(PROPERTY_RUNTIME_BUCKET)
            .download(`${folder}/${file.name}`);

          if (!data) return null;
          return JSON.parse(await data.text()) as T;
        })
    );

    return records.filter(Boolean) as T[];
  } catch {
    return [];
  }
}

function collectDuplicateSignals(profiles: CustomerProfileRecord[]) {
  const emailMap = new Map<string, CustomerProfileRecord[]>();
  const phoneMap = new Map<string, CustomerProfileRecord[]>();

  for (const profile of profiles) {
    const email = normalizeEmail(profile.email);
    const phone = normalizePhone(profile.phone);

    if (email) {
      const rows = emailMap.get(email) ?? [];
      rows.push(profile);
      emailMap.set(email, rows);
    }

    if (phone) {
      const rows = phoneMap.get(phone) ?? [];
      rows.push(profile);
      phoneMap.set(phone, rows);
    }
  }

  const duplicateEmails = [...emailMap.entries()]
    .filter(([, rows]) => rows.length > 1)
    .map(([email, rows]) => ({
      label: maskEmail(email),
      detail: `${rows.length} customer profiles share this email and should stay under manual trust review for higher-risk actions.`,
      tone: "critical" as const,
    }));

  const duplicatePhones = [...phoneMap.entries()]
    .filter(([, rows]) => rows.length > 1)
    .map(([phone, rows]) => ({
      label: maskPhone(phone),
      detail: `${rows.length} customer profiles share this phone and should be reviewed before property, payout, or seller-trust escalation.`,
      tone: "warning" as const,
    }));

  return {
    duplicateEmails,
    duplicatePhones,
  };
}

function collectRegionalMismatchSignals(profiles: CustomerProfileRecord[]) {
  return profiles
    .filter((profile) => {
      const countryCode = String(profile.country || "").trim().toUpperCase();
      if (!countryCode || countryCode === "NG") return false;
      return profile.currency === "NGN" || profile.timezone === "Africa/Lagos";
    })
    .map((profile) => {
      const countryCode = String(profile.country || "").trim().toUpperCase();
      const country = getCountry(countryCode);
      const parts = [];

      if (profile.currency === "NGN" && country?.currencyCode && country.currencyCode !== "NGN") {
        parts.push(`currency is still NGN instead of ${country.currencyCode}`);
      }

      if (
        profile.timezone === "Africa/Lagos" &&
        country?.timezone &&
        country.timezone !== "Africa/Lagos"
      ) {
        parts.push(`timezone is still Africa/Lagos instead of ${country.timezone}`);
      }

      return {
        label: `${maskEmail(profile.email)} · ${country?.name || countryCode}`,
        detail: parts.join("; "),
        tone: "warning" as const,
      };
    });
}

export async function getPropertyOpsSummary() {
  const admin = createStaffAdminSupabase();
  const [listings, inquiries, viewings, profilesRes] = await Promise.all([
    listJsonCollection<PropertyListingRecord>("listings"),
    listJsonCollection<PropertyInquiryRecord>("inquiries"),
    listJsonCollection<PropertyViewingRecord>("viewings"),
    admin
      .from("customer_profiles")
      .select("id, email, phone, country, currency, timezone")
      .limit(5000),
  ]);

  const profiles = (profilesRes.data ?? []) as CustomerProfileRecord[];
  const duplicateSignals = collectDuplicateSignals(profiles);
  const regionalMismatches = collectRegionalMismatchSignals(profiles);

  return {
    liveListings: listings.filter((listing) => ["published", "approved"].includes(listing.status))
      .length,
    pendingListings: listings.filter((listing) =>
      [
        "submitted",
        "awaiting_documents",
        "awaiting_eligibility",
        "inspection_requested",
        "under_review",
        "changes_requested",
      ].includes(listing.status)
    ).length,
    openInquiries: inquiries.filter((inquiry) => inquiry.status !== "closed").length,
    openViewings: viewings.filter((viewing) =>
      ["requested", "scheduled", "confirmed"].includes(viewing.status)
    ).length,
    duplicateEmailCount: duplicateSignals.duplicateEmails.length,
    duplicatePhoneCount: duplicateSignals.duplicatePhones.length,
    regionalMismatchCount: regionalMismatches.length,
    riskRows: [
      ...duplicateSignals.duplicateEmails,
      ...duplicateSignals.duplicatePhones,
      ...regionalMismatches,
    ].slice(0, 8) as StaffRiskRow[],
  };
}
