export type CompanySettingsRecord = {
  id: string;
  company_name: string | null;
  cloudinary_folder: string | null;
  created_at: string | null;
  updated_at: string | null;
  socials: Record<string, string> | null;
  logo_url: string | null;
  logo_public_id: string | null;
  support_email: string | null;
  support_phone: string | null;
  address: string | null;
  legal_name: string | null;
  brand_title: string | null;
  brand_subtitle: string | null;
  brand_description: string | null;
  footer_blurb: string | null;
  base_domain: string | null;
  office_address: string | null;
  brand_accent: string | null;
  favicon_url: string | null;
  favicon_public_id: string | null;
  default_meta_title: string | null;
  default_meta_description: string | null;
  copyright_label: string | null;
};

export type CompanySettingsInput =
  | Partial<CompanySettingsRecord>
  | {
      settings?: Partial<CompanySettingsRecord> | null;
      hasServerError?: boolean;
    }
  | null;

function toText(value: unknown, fallback: string) {
  const text = typeof value === "string" ? value.trim() : String(value ?? "").trim();
  return text || fallback;
}

function toNullableText(value: unknown) {
  const text = typeof value === "string" ? value.trim() : String(value ?? "").trim();
  return text || null;
}

export function normalizeCompanySettings(input?: CompanySettingsInput): CompanySettingsRecord {
  const raw =
    input && typeof input === "object" && "settings" in input ? input.settings : input;
  const source = (raw ?? {}) as Record<string, unknown>;
  const officeAddress = toNullableText(source.office_address) ?? toNullableText(source.address);

  return {
    id: toText(source.id, "primary"),
    company_name: toNullableText(source.company_name) ?? toNullableText(source.brand_title),
    cloudinary_folder: toNullableText(source.cloudinary_folder) ?? "henryco",
    created_at: toNullableText(source.created_at),
    updated_at: toNullableText(source.updated_at),
    socials:
      source.socials && typeof source.socials === "object" && !Array.isArray(source.socials)
        ? (source.socials as Record<string, string>)
        : {},
    logo_url: toNullableText(source.logo_url),
    logo_public_id: toNullableText(source.logo_public_id),
    support_email: toNullableText(source.support_email),
    support_phone: toNullableText(source.support_phone),
    address: toNullableText(source.address) ?? officeAddress,
    legal_name: toText(source.legal_name, "Henry & Co."),
    brand_title: toText(source.brand_title, "Henry & Co."),
    brand_subtitle: toText(source.brand_subtitle, "Corporate Platform"),
    brand_description: toText(
      source.brand_description,
      "Henry & Co. brings together focused businesses under one respected group identity."
    ),
    footer_blurb: toText(
      source.footer_blurb,
      "Henry & Co. provides a clear way to understand the group and reach the right business with confidence."
    ),
    base_domain: toText(source.base_domain, "henrycogroup.com"),
    office_address: officeAddress,
    brand_accent: toText(source.brand_accent, "#C9A227"),
    favicon_url: toNullableText(source.favicon_url),
    favicon_public_id: toNullableText(source.favicon_public_id),
    default_meta_title: toText(source.default_meta_title, "Henry & Co."),
    default_meta_description: toText(
      source.default_meta_description,
      "Explore the businesses, services, and operating divisions of Henry & Co."
    ),
    copyright_label: toText(source.copyright_label, "Henry & Co."),
  };
}
