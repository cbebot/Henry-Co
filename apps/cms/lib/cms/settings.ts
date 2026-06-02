import "server-only";
import { createCmsSupabaseServer } from "@/lib/supabase/server";
import { SETTINGS_ID } from "./settings-shared";

// SETTINGS_ID (the literal primary key of the single settings row) lives in
// settings-shared so the client write layer can import it without server-only.
export { SETTINGS_ID };

export type CompanySocials = {
  x: string;
  linkedin: string;
  instagram: string;
  whatsapp: string;
};

export type CompanySettings = {
  company_name: string;
  legal_name: string;
  brand_title: string;
  brand_subtitle: string;
  brand_description: string;
  footer_blurb: string;
  copyright_label: string;
  brand_accent: string;
  logo_url: string;
  logo_public_id: string;
  favicon_url: string;
  favicon_public_id: string;
  default_meta_title: string;
  default_meta_description: string;
  base_domain: string;
  cloudinary_folder: string;
  support_email: string;
  support_phone: string;
  address: string;
  office_address: string;
  socials: CompanySocials;
  updated_at: string | null;
};

type Row = Record<string, unknown>;

/** Coalesce any value to a trimmed-safe string for a controlled form input. */
function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeSocials(value: unknown): CompanySocials {
  const obj: Row = value && typeof value === "object" ? (value as Row) : {};
  return {
    x: str(obj.x),
    linkedin: str(obj.linkedin),
    instagram: str(obj.instagram),
    whatsapp: str(obj.whatsapp),
  };
}

function normalizeSettings(row: Row): CompanySettings {
  return {
    company_name: str(row.company_name),
    legal_name: str(row.legal_name),
    brand_title: str(row.brand_title),
    brand_subtitle: str(row.brand_subtitle),
    brand_description: str(row.brand_description),
    footer_blurb: str(row.footer_blurb),
    copyright_label: str(row.copyright_label),
    brand_accent: str(row.brand_accent),
    logo_url: str(row.logo_url),
    logo_public_id: str(row.logo_public_id),
    favicon_url: str(row.favicon_url),
    favicon_public_id: str(row.favicon_public_id),
    default_meta_title: str(row.default_meta_title),
    default_meta_description: str(row.default_meta_description),
    base_domain: str(row.base_domain),
    cloudinary_folder: str(row.cloudinary_folder),
    support_email: str(row.support_email),
    support_phone: str(row.support_phone),
    address: str(row.address),
    office_address: str(row.office_address),
    socials: normalizeSocials(row.socials),
    updated_at: typeof row.updated_at === "string" ? row.updated_at : null,
  };
}

/** A blank, fully-typed settings shape (used if the row is somehow absent). */
function emptySettings(): CompanySettings {
  return normalizeSettings({});
}

/**
 * Read the single brand/settings record. The owner RLS policy authorizes the
 * select; we always target the literal `primary` key so there is exactly one row.
 */
export async function getSettings(): Promise<CompanySettings> {
  const supabase = await createCmsSupabaseServer();
  const { data } = await supabase
    .from("company_settings")
    .select("*")
    .eq("id", SETTINGS_ID)
    .maybeSingle();
  if (!data) return emptySettings();
  return normalizeSettings(data as Row);
}
