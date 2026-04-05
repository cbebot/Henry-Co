import type { Division, DivisionStatus } from "@/domain/division";
import { DIVISION_CATALOG } from "@/domain/divisionCatalog";
import type { Database } from "@/core/database.types";

export type DivisionRow = Database["public"]["Tables"]["divisions"]["Row"];

export function mapDivisionRow(row: DivisionRow): Division {
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
