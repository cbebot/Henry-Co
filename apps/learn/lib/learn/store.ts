import { getDivisionConfig, getDivisionUrl } from "@henryco/config";
import { createAdminSupabase } from "@/lib/supabase";
import { normalizeEmail } from "@/lib/env";

export type LearnUpsertMeta = {
  userId?: string | null;
  email?: string | null;
  role?: string | null;
};

const LEARN_STORE_ROUTE = "/learn/store";
const tablePresenceCache = new Map<string, boolean>();

function cleanText(value?: unknown) {
  return String(value ?? "").trim();
}

function safeRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function fallbackEventType(table: string) {
  return `learn_store_${table}`;
}

export function createId() {
  return crypto.randomUUID();
}

export function nowIso() {
  return new Date().toISOString();
}

export async function writeLearnLog(input: {
  eventType: string;
  route?: string | null;
  success?: boolean;
  meta?: LearnUpsertMeta;
  details?: Record<string, unknown>;
}) {
  const admin = createAdminSupabase();
  const { error } = await admin.from("care_security_logs").insert({
    event_type: input.eventType,
    route: input.route ?? LEARN_STORE_ROUTE,
    email: normalizeEmail(input.meta?.email),
    user_id: input.meta?.userId ?? null,
    role: cleanText(input.meta?.role) || "academy_system",
    success: input.success ?? true,
    details: input.details ?? {},
  } as never);

  if (error) {
    throw error;
  }
}

export async function hasLearnTable(table: string) {
  if (tablePresenceCache.has(table)) {
    return tablePresenceCache.get(table) ?? false;
  }

  try {
    const admin = createAdminSupabase();
    const { error } = await admin.from(table).select("id").limit(1);
    const exists = !error || !cleanText(error.message).includes("Could not find the table");
    tablePresenceCache.set(table, exists);
    return exists;
  } catch {
    tablePresenceCache.set(table, false);
    return false;
  }
}

async function readFallbackRows<T extends Record<string, unknown>>(table: string) {
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("care_security_logs")
    .select("details, created_at")
    .eq("route", LEARN_STORE_ROUTE)
    .eq("event_type", fallbackEventType(table))
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    throw error;
  }

  const merged = new Map<string, T>();
  for (const row of data ?? []) {
    const details = safeRecord(row.details);
    const payload = safeRecord(details?.payload) as T | null;
    const recordId =
      cleanText(details?.record_id) ||
      cleanText(payload?.id) ||
      cleanText(payload?.key);

    if (!payload || !recordId || merged.has(recordId)) continue;
    if (payload.__deleted === true) continue;
    merged.set(recordId, payload);
  }

  return [...merged.values()];
}

async function writeFallbackRow(
  table: string,
  payload: Record<string, unknown>,
  meta?: LearnUpsertMeta,
  idKey = "id"
) {
  const recordId = cleanText(payload[idKey] ?? payload.id ?? payload.key);
  await writeLearnLog({
    eventType: fallbackEventType(table),
    meta,
    details: {
      table,
      record_id: recordId,
      payload,
    },
  });
}

export async function readLearnCollection<T extends Record<string, unknown>>(
  table: string,
  orderBy?: string,
  ascending = true
) {
  try {
    if (await hasLearnTable(table)) {
      const admin = createAdminSupabase();
      let query = admin.from(table).select("*");
      if (orderBy) {
        query = query.order(orderBy, { ascending });
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as T[];
    }

    const rows = await readFallbackRows<T>(table);
    if (!orderBy) return rows;

    return rows.sort((left, right) => {
      const a = cleanText(left[orderBy]);
      const b = cleanText(right[orderBy]);
      return ascending ? a.localeCompare(b) : b.localeCompare(a);
    });
  } catch {
    return [] as T[];
  }
}

export async function getLearnSetting<T>(key: string) {
  const settings = await readLearnCollection<Record<string, unknown>>("learn_settings", "created_at", false);
  const row = settings.find((item) => cleanText(item.key) === cleanText(key));
  return (row?.value ?? null) as T | null;
}

export async function upsertLearnRecord(
  table: string,
  payload: Record<string, unknown>,
  meta?: LearnUpsertMeta,
  options?: { onConflict?: string; idKey?: string }
) {
  if (await hasLearnTable(table)) {
    const admin = createAdminSupabase();
    const { error } = await admin.from(table).upsert(payload as never, {
      onConflict: options?.onConflict || "id",
    });
    if (error) throw error;
    return;
  }

  await writeFallbackRow(table, payload, meta, options?.idKey || "id");
}

export async function insertLearnRecord(
  table: string,
  payload: Record<string, unknown>,
  meta?: LearnUpsertMeta,
  options?: { idKey?: string }
) {
  if (await hasLearnTable(table)) {
    const admin = createAdminSupabase();
    const { error } = await admin.from(table).insert(payload as never);
    if (error) throw error;
    return;
  }

  await writeFallbackRow(table, payload, meta, options?.idKey || "id");
}

export async function deleteLearnRecord(
  table: string,
  recordId: string,
  meta?: LearnUpsertMeta
) {
  if (await hasLearnTable(table)) {
    const admin = createAdminSupabase();
    const { error } = await admin.from(table).delete().eq("id", recordId);
    if (error) throw error;
    return;
  }

  await writeFallbackRow(
    table,
    {
      id: recordId,
      __deleted: true,
    },
    meta
  );
}

export async function syncLearnDivision() {
  const learn = getDivisionConfig("learn");
  const admin = createAdminSupabase();
  const { error } = await admin.from("company_divisions").upsert(
    {
      slug: learn.key,
      name: learn.name,
      tagline: learn.tagline,
      category: "Education",
      status: "active",
      subdomain: learn.subdomain,
      domain: `${learn.subdomain}.${process.env.NEXT_PUBLIC_BASE_DOMAIN || "henrycogroup.com"}`,
      short_description: learn.description,
      description: learn.description,
      primary_url: getDivisionUrl("learn"),
      highlights: [
        "Premium public courses and structured learning paths",
        "Internal training assignments and completion monitoring",
        "Certificate issuance and public verification",
        "Unified academy activity for future shared account dashboards"
      ],
      who_its_for: [
        "Public learners",
        "HenryCo internal teams",
        "Partners and vendors",
        "Business operators and service teams"
      ],
      how_it_works: [
        "Discover courses and academy tracks",
        "Enroll directly or receive internal assignments",
        "Complete lessons, quizzes, and milestone checks",
        "Earn certificates and keep progress synced to one identity"
      ],
      trust: [
        "Role-restricted internal learning tracks",
        "Server-side enrollment and certification logic",
        "Progress and notifications persisted in Supabase",
        "Certificate verification built for public trust"
      ],
      accent: learn.accent,
      is_published: true,
      is_featured: true,
      sort_order: 6,
      categories: ["Education", "Academy", "Internal Training", "Certification"],
      lead_name: "HenryCo Academy Operations",
      lead_title: "Academy Director",
    } as never,
    { onConflict: "slug" }
  );

  if (error) {
    throw error;
  }
}
