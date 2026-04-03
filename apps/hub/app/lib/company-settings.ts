import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import {
  normalizeCompanySettings,
  type CompanySettingsRecord,
} from "./company-settings-shared";

const fallbackSettings: CompanySettingsRecord = normalizeCompanySettings(null);

async function createSupabaseServer() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {},
    },
  });
}

export async function getCompanySettings(): Promise<{
  settings: CompanySettingsRecord;
  hasServerError: boolean;
}> {
  try {
    const supabase = await createSupabaseServer();

    const { data, error } = await supabase
      .from("company_settings")
      .select(
        `
        id,
        company_name,
        cloudinary_folder,
        created_at,
        updated_at,
        socials,
        legal_name,
        brand_title,
        brand_subtitle,
        brand_description,
        footer_blurb,
        base_domain,
        support_email,
        support_phone,
        office_address,
        brand_accent,
        logo_url,
        logo_public_id,
        favicon_url,
        favicon_public_id,
        default_meta_title,
        default_meta_description,
        copyright_label,
        address
      `
      )
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return { settings: fallbackSettings, hasServerError: true };
    }

    return {
      settings: normalizeCompanySettings(data),
      hasServerError: false,
    };
  } catch {
    return { settings: fallbackSettings, hasServerError: true };
  }
}
