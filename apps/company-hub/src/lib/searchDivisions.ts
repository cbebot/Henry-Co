import type { Division, DivisionStatus } from "@/types/division";

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "");
}

function buildHaystack(division: Division): string {
  return normalize(
    [
      division.name,
      division.tagline,
      division.summary,
      division.description,
      division.subdomain,
      ...division.sectors,
    ].join(" "),
  );
}

export function matchesQuery(division: Division, query: string): boolean {
  const q = normalize(query.trim());
  if (!q) return true;

  const haystack = buildHaystack(division);
  const tokens = q.split(/\s+/);
  return tokens.every((token) => haystack.includes(token));
}

export function filterByStatus(
  divisions: Division[],
  filter: "all" | DivisionStatus,
): Division[] {
  if (filter === "all") return divisions;
  return divisions.filter((d) => d.status === filter);
}

export function searchDivisions(
  divisions: Division[],
  query: string,
  statusFilter: "all" | DivisionStatus = "all",
): Division[] {
  return filterByStatus(divisions, statusFilter).filter((d) =>
    matchesQuery(d, query),
  );
}

export function getSearchSuggestions(
  query: string,
  divisions: Division[],
): string[] {
  const q = normalize(query.trim());
  if (!q) return [];

  return divisions
    .filter((d) => matchesQuery(d, query))
    .slice(0, 5)
    .map((d) => d.name);
}
