"use client";

import { createCmsSupabaseBrowser } from "@/lib/supabase/browser";
import { SETTINGS_ID } from "./settings-shared";
import type { CompanySettings, CompanySocials } from "./settings";

type Result = { ok: true } | { ok: false; error: string };

/** Editable input is the settings shape minus the server-managed timestamp. */
export type SettingsInput = Omit<CompanySettings, "updated_at">;

/** Nullable text columns store NULL when blank so the DB stays clean. */
function orNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/** Socials persists as a jsonb object; blank handles become null inside it. */
function socialsObject(socials: CompanySocials): Record<string, string | null> {
  return {
    x: orNull(socials.x),
    linkedin: orNull(socials.linkedin),
    instagram: orNull(socials.instagram),
    whatsapp: orNull(socials.whatsapp),
  };
}

/**
 * Update the single live company_settings row. There is no draft/publish here —
 * brand settings are always live, so this writes straight to the canonical row
 * keyed by the literal `primary` id. `company_name`, `cloudinary_folder`, and
 * `socials` are NOT NULL columns, so they are always sent as concrete values.
 */
export async function saveSettings(input: SettingsInput): Promise<Result> {
  const supabase = createCmsSupabaseBrowser();
  const { error } = await supabase
    .from("company_settings")
    .update({
      company_name: input.company_name.trim(),
      legal_name: orNull(input.legal_name),
      brand_title: orNull(input.brand_title),
      brand_subtitle: orNull(input.brand_subtitle),
      brand_description: orNull(input.brand_description),
      footer_blurb: orNull(input.footer_blurb),
      copyright_label: orNull(input.copyright_label),
      brand_accent: orNull(input.brand_accent),
      logo_url: orNull(input.logo_url),
      logo_public_id: orNull(input.logo_public_id),
      favicon_url: orNull(input.favicon_url),
      favicon_public_id: orNull(input.favicon_public_id),
      default_meta_title: orNull(input.default_meta_title),
      default_meta_description: orNull(input.default_meta_description),
      base_domain: orNull(input.base_domain),
      cloudinary_folder: input.cloudinary_folder.trim(),
      support_email: orNull(input.support_email),
      support_phone: orNull(input.support_phone),
      address: orNull(input.address),
      office_address: orNull(input.office_address),
      socials: socialsObject(input.socials),
      updated_at: new Date().toISOString(),
    })
    .eq("id", SETTINGS_ID);

  return error ? { ok: false, error: error.message } : { ok: true };
}
