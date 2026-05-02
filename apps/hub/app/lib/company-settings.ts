import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import {
  normalizeCompanySettings,
  type CompanySettingsRecord,
} from "./company-settings-shared";

const fallbackSettings: CompanySettingsRecord = normalizeCompanySettings(null);

async function createSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  /** Guard the env: previews have historically shipped without these
   * (see project_henryco_vercel_preview_env_gap), and a missing URL
   * would otherwise throw inside @supabase/ssr at request time. The
   * caller's outer try/catch handles the rejection; we just make sure
   * we never construct a half-real client. */
  if (!url || !anon) {
    throw new Error("Hub Supabase env not configured for this deploy.");
  }

  const cookieStore = await cookies();

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
