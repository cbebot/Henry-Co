import type { Division, DivisionStatus } from "@/domain/division";
import { DIVISION_CATALOG } from "@/domain/divisionCatalog";
import type { Database } from "@/core/database.types";
import { getSupabaseClient } from "@/core/supabase";
import { getEnv, isSupabaseConfigured } from "@/core/env";

type DivisionRow = Database["public"]["Tables"]["divisions"]["Row"];

function mapRow(row: DivisionRow): Division {
  const local = DIVISION_CATALOG.find((d) => d.slug === row.slug);
  const status = (row.status as DivisionStatus) ?? "active";
  return {
    slug: row.slug,
    name: row.name,
    shortName: local?.shortName ?? row.name,
    status,
    featured: row.featured,
    summary: row.summary ?? local?.summary ?? "",
    highlights: local?.highlights ?? [],
    destinationUrl: row.destination_url ?? local?.destinationUrl ?? "",
    sectors: (row.sectors as Division["sectors"] | null) ?? local?.sectors ?? [],
    accentHex: row.accent_hex ?? local?.accentHex ?? "#C9A227",
  };
}

export async function fetchDivisionsRemote(): Promise<Division[] | null> {
  const env = getEnv();
  if (!isSupabaseConfigured(env)) return null;
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("divisions").select("*").order("name");
  if (error || !data?.length) return null;
  return data.map((row) => mapRow(row as DivisionRow));
}

export async function getDivisions(): Promise<Division[]> {
  const remote = await fetchDivisionsRemote();
  return remote ?? DIVISION_CATALOG;
}
