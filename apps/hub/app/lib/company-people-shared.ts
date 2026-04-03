export type CompanyPersonRecord = {
  id: string;
  page_key: string;
  page_slug: string | null;
  group_key: string;
  kind: string | null;
  full_name: string;
  job_title: string | null;
  role_title: string | null;
  role_label: string | null;
  division_slug: string | null;
  department: string | null;
  short_bio: string | null;
  long_bio: string | null;
  bio: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  photo_url: string | null;
  image_url: string | null;
  photo_public_id: string | null;
  sort_order: number;
  is_owner: boolean;
  is_manager: boolean;
  is_featured: boolean;
  is_published: boolean;
  created_at: string | null;
  updated_at: string | null;
};

function trimText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function matchesRole(value: string | null, patterns: RegExp[]) {
  if (!value) return false;
  return patterns.some((pattern) => pattern.test(value));
}

const OWNER_PATTERNS = [
  /\bowner\b/i,
  /\bfounder\b/i,
  /\bchair(man|woman)?\b/i,
  /\bchief executive\b/i,
  /\bceo\b/i,
  /\bpresident\b/i,
  /\bprincipal\b/i,
];

const MANAGEMENT_PATTERNS = [
  /\bmanager\b/i,
  /\bmanagement\b/i,
  /\bdirector\b/i,
  /\bhead\b/i,
  /\blead\b/i,
  /\bchief\b/i,
  /\bofficer\b/i,
  /\bexecutive\b/i,
];

export function normalizeCompanyPerson(
  row?: Partial<CompanyPersonRecord> | null
): CompanyPersonRecord {
  const roleSignal = [
    trimText(row?.kind),
    trimText(row?.role_title),
    trimText(row?.role_label),
    trimText(row?.job_title),
  ]
    .filter(Boolean)
    .join(" ");

  const inferredOwner = Boolean(row?.is_owner) || matchesRole(roleSignal, OWNER_PATTERNS);
  const inferredManager =
    !inferredOwner &&
    (Boolean(row?.is_manager) ||
      matchesRole(roleSignal, MANAGEMENT_PATTERNS) ||
      trimText(row?.kind)?.toLowerCase() === "manager");
  const inferredFeatured =
    !inferredOwner && !inferredManager && Boolean(row?.is_featured);

  return {
    id: String(row?.id ?? ""),
    page_key: String(row?.page_key ?? row?.page_slug ?? "about").trim() || "about",
    page_slug: trimText(row?.page_slug) ?? trimText(row?.page_key),
    group_key: String(row?.group_key ?? "leadership").trim() || "leadership",
    kind: inferredOwner
      ? "owner"
      : inferredManager
        ? "manager"
        : inferredFeatured
          ? "featured"
          : trimText(row?.kind) ?? "leadership",
    full_name: String(row?.full_name ?? "").trim(),
    job_title: trimText(row?.job_title) ?? trimText(row?.role_title) ?? trimText(row?.role_label),
    role_title: trimText(row?.role_title) ?? trimText(row?.role_label) ?? trimText(row?.job_title),
    role_label: trimText(row?.role_label) ?? trimText(row?.role_title) ?? trimText(row?.job_title),
    division_slug: trimText(row?.division_slug),
    department: trimText(row?.department),
    short_bio: trimText(row?.short_bio) ?? trimText(row?.bio),
    long_bio: trimText(row?.long_bio) ?? trimText(row?.bio),
    bio: trimText(row?.bio) ?? trimText(row?.short_bio) ?? trimText(row?.long_bio),
    email: trimText(row?.email),
    phone: trimText(row?.phone),
    linkedin_url: trimText(row?.linkedin_url),
    photo_url: trimText(row?.photo_url) ?? trimText(row?.image_url),
    image_url: trimText(row?.image_url) ?? trimText(row?.photo_url),
    photo_public_id: trimText(row?.photo_public_id),
    sort_order: Number(row?.sort_order ?? 100),
    is_owner: inferredOwner,
    is_manager: inferredManager,
    is_featured: inferredFeatured,
    is_published: Boolean(row?.is_published ?? true),
    created_at: row?.created_at ?? null,
    updated_at: row?.updated_at ?? null,
  };
}
