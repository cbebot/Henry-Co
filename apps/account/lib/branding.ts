import "server-only";

import { cache } from "react";
import { createAdminSupabase } from "@/lib/supabase";
import { divisionColor, divisionLabel } from "@/lib/format";

export type DivisionBrand = {
  key: string;
  label: string;
  accent: string;
  logoUrl: string | null;
  primaryUrl: string | null;
};

const STATIC_BRANDS: Record<string, DivisionBrand> = {
  account: {
    key: "account",
    label: "HenryCo Account",
    accent: divisionColor("account"),
    logoUrl: process.env.NEXT_PUBLIC_LOGO_URL || null,
    primaryUrl: "/",
  },
  wallet: {
    key: "wallet",
    label: "HenryCo Wallet",
    accent: divisionColor("wallet"),
    logoUrl: process.env.NEXT_PUBLIC_LOGO_URL || null,
    primaryUrl: "/wallet",
  },
  security: {
    key: "security",
    label: "Security",
    accent: "#EF4444",
    logoUrl: null,
    primaryUrl: "/security",
  },
  support: {
    key: "support",
    label: "Support",
    accent: "#3B82F6",
    logoUrl: null,
    primaryUrl: "/support",
  },
  general: {
    key: "general",
    label: "HenryCo",
    accent: "#6B7280",
    logoUrl: process.env.NEXT_PUBLIC_LOGO_URL || null,
    primaryUrl: "/notifications",
  },
};

const getDbBrands = cache(async () => {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("company_divisions")
    .select("slug, name, accent, logo_url, primary_url, is_published")
    .order("sort_order", { ascending: true });

  return (data ?? []).reduce<Record<string, DivisionBrand>>((acc, row) => {
    const key = typeof row.slug === "string" ? row.slug : "";
    if (!key) return acc;
    acc[key] = {
      key,
      label: typeof row.name === "string" ? row.name : divisionLabel(key),
      accent:
        typeof row.accent === "string" && row.accent.trim()
          ? row.accent
          : divisionColor(key),
      logoUrl: typeof row.logo_url === "string" && row.logo_url.trim() ? row.logo_url : null,
      primaryUrl:
        typeof row.primary_url === "string" && row.primary_url.trim() ? row.primary_url : null,
    };
    return acc;
  }, {});
});

export async function getDivisionBrands() {
  return {
    ...STATIC_BRANDS,
    ...(await getDbBrands()),
  };
}

export async function getDivisionBrand(key?: string | null): Promise<DivisionBrand> {
  const normalized = typeof key === "string" && key.trim() ? key.trim() : "general";
  const brands = await getDivisionBrands();
  return (
    brands[normalized] || {
      key: normalized,
      label: divisionLabel(normalized),
      accent: divisionColor(normalized),
      logoUrl: null,
      primaryUrl: null,
    }
  );
}
