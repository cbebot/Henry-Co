import { createClient } from "@supabase/supabase-js";
import { fetchNoStore } from "./no-store-fetch";

export type DivisionLink = { label: string; url: string };

export type DivisionRow = {
  id: string;
  key: string;
  name: string;
  tagline: string | null;
  description: string | null;
  accent: string;
  primary_url: string | null;
  subdomain: string | null;
  logo_url: string | null;
  cover_url: string | null;
  categories: string[];
  highlights: string[];
  status: "active" | "coming_soon" | "paused" | string;
  is_featured: boolean;
  sort_order: number;
  lead: null | { name: string | null; avatar_url: string | null; title: string | null };
  links: DivisionLink[];
  kpi: Record<string, unknown>;
  updated_at: string | null;
};

export type DivisionDbRow = {
  id: string | number;
  slug: string | null;
  name: string | null;
  tagline: string | null;
  description: string | null;
  accent: string | null;
  primary_url: string | null;
  subdomain: string | null;
  logo_url: string | null;
  cover_url: string | null;
  categories: string[] | null;
  highlights: string[] | null;
  who_its_for?: string[] | null;
  how_it_works?: string[] | null;
  trust?: string[] | null;
  status: string | null;
  lead_person_id: string | null;
  lead_name: string | null;
  lead_title: string | null;
  lead_avatar_url: string | null;
  sort_order: number | null;
  is_featured: boolean | null;
  is_published: boolean | null;
  created_at?: string | null;
  updated_at: string | null;
};

type DivisionLeadRow = {
  id: string;
  full_name: string | null;
  role_title: string | null;
  role_label: string | null;
  job_title: string | null;
  photo_url: string | null;
};

export function toStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

export function normalizeBaseDomain(value?: string | null) {
  return String(value || "henrycogroup.com")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
}

export function normalizeStatus(status?: string | null): DivisionRow["status"] {
  const raw = String(status || "").trim().toLowerCase();

  if (raw === "coming soon" || raw === "coming_soon" || raw === "soon") return "coming_soon";
  if (raw === "paused" || raw === "private") return "paused";
  return "active";
}

function cleanOptionalText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

export function inferAccent(key?: string | null, name?: string | null) {
  const slug = String(key || "").toLowerCase();
  const label = String(name || "").toLowerCase();

  if (slug.includes("care") || label.includes("care")) return "#C9A227";
  if (slug.includes("hotel") || label.includes("hotel")) return "#F59E0B";
  if (slug.includes("build") || label.includes("build") || label.includes("construction")) {
    return "#7DD3FC";
  }
  if (slug.includes("media") || label.includes("media")) return "#A78BFA";
  if (slug.includes("logistics") || label.includes("logistics")) return "#34D399";

  return "#C9A227";
}

export function inferCategories(input: {
  key?: string | null;
  name?: string | null;
  tagline?: string | null;
  description?: string | null;
  highlights?: string[] | null;
}) {
  const hay = [
    input.key,
    input.name,
    input.tagline,
    input.description,
    ...(input.highlights || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const categories: string[] = [];

  if (hay.includes("fabric") || hay.includes("laundry") || hay.includes("dry clean")) {
    categories.push("Fabric Care");
  }
  if (hay.includes("hotel") || hay.includes("hospitality") || hay.includes("reservation")) {
    categories.push("Hospitality");
  }
  if (hay.includes("building") || hay.includes("construction") || hay.includes("renovation")) {
    categories.push("Construction");
  }
  if (hay.includes("delivery") || hay.includes("logistics") || hay.includes("transport")) {
    categories.push("Logistics");
  }
  if (hay.includes("media") || hay.includes("creative") || hay.includes("branding")) {
    categories.push("Creative");
  }

  return categories.length ? categories : ["General"];
}

export function buildPrimaryUrl(slug?: string | null) {
  const clean = String(slug || "").trim().toLowerCase();
  if (!clean) return null;

  if (process.env.NODE_ENV !== "production") {
    return `http://${clean}.localhost:3000`;
  }

  const baseDomain = normalizeBaseDomain(process.env.NEXT_PUBLIC_BASE_DOMAIN);
  return `https://${clean}.${baseDomain}`;
}

export function normalizeDivision(
  row: DivisionDbRow,
  linkedLead?: DivisionLeadRow | null
): DivisionRow {
  const slug = String(row.slug || row.id || "").trim().toLowerCase();
  const highlights = toStringArray(row.highlights);
  const description =
    typeof row.description === "string" && row.description.trim()
      ? row.description.trim()
      : null;
  const leadName = cleanOptionalText(row.lead_name) ?? cleanOptionalText(linkedLead?.full_name);
  const leadTitle =
    cleanOptionalText(row.lead_title) ??
    cleanOptionalText(linkedLead?.role_title) ??
    cleanOptionalText(linkedLead?.role_label) ??
    cleanOptionalText(linkedLead?.job_title);
  const leadAvatarUrl =
    cleanOptionalText(row.lead_avatar_url) ?? cleanOptionalText(linkedLead?.photo_url);

  return {
    id: String(row.id),
    key: slug || String(row.id),
    name: String(row.name || "Untitled division"),
    tagline: typeof row.tagline === "string" ? row.tagline : highlights[0] || null,
    description,
    accent: row.accent || inferAccent(slug, row.name),
    primary_url: row.primary_url || buildPrimaryUrl(slug),
    subdomain: row.subdomain || slug || null,
    logo_url: row.logo_url ?? null,
    cover_url: row.cover_url ?? null,
    categories: toStringArray(row.categories).length
      ? toStringArray(row.categories)
      : inferCategories({
          key: slug,
          name: row.name,
          tagline: row.tagline,
          description,
          highlights,
        }),
    highlights,
    status: normalizeStatus(row.status),
    is_featured: Boolean(row.is_featured),
    sort_order: row.sort_order ?? 100,
    lead:
      leadName || leadTitle || leadAvatarUrl
        ? {
            name: leadName,
            title: leadTitle,
            avatar_url: leadAvatarUrl,
          }
        : null,
    links: [],
    kpi: {},
    updated_at: row.updated_at ?? null,
  };
}

export async function getPublishedDivisions() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    return {
      divisions: [] as DivisionRow[],
      hasServerError: true,
    };
  }

  const supabase = createClient(url, anon, {
    global: {
      fetch: fetchNoStore,
    },
  });

  const { data, error } = await supabase
    .from("company_divisions")
    .select(
      `
      id,
      slug,
      name,
      tagline,
      description,
      accent,
      primary_url,
      subdomain,
      logo_url,
      cover_url,
      categories,
      highlights,
      status,
      lead_person_id,
      lead_name,
      lead_title,
      lead_avatar_url,
      sort_order,
      is_featured,
      is_published,
      updated_at
    `
    )
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return {
      divisions: [] as DivisionRow[],
      hasServerError: true,
    };
  }

  const leadPersonIds = Array.from(
    new Set(
      (data as DivisionDbRow[])
        .map((row) => String(row.lead_person_id || "").trim())
        .filter(Boolean)
    )
  );

  let linkedLeadMap = new Map<string, DivisionLeadRow>();

  if (leadPersonIds.length) {
    const { data: leadRows } = await supabase
      .from("company_people")
      .select("id, full_name, role_title, role_label, job_title, photo_url")
      .in("id", leadPersonIds)
      .eq("is_published", true);

    linkedLeadMap = new Map(
      Array.isArray(leadRows)
        ? (leadRows as DivisionLeadRow[]).map((row) => [String(row.id), row])
        : []
    );
  }

  return {
    divisions: (data as DivisionDbRow[]).map((row) =>
      normalizeDivision(
        row,
        row.lead_person_id ? linkedLeadMap.get(String(row.lead_person_id)) ?? null : null
      )
    ),
    hasServerError: false,
  };
}
