// Live division visibility — the ONE bridge between the owner's division
// registry (company_divisions, written from the owner console) and every
// public surface that renders division links from the static COMPANY config.
//
// WHY: pausing a division in the command center previously changed NOTHING on
// the public sites — footers/nav rendered getPublicDivisions() (static config)
// and never consulted the database, so a paused division kept showing
// everywhere. These helpers read the registry's live status (anon-readable,
// public-by-design catalog data: slug + status only — no PII, no money) and
// filter the static list.
//
// Design constraints:
//  - Dependency-free: a plain PostgREST fetch against the project's public
//    anon endpoint — no supabase-js import, so this file adds zero weight to
//    @henryco/config consumers.
//  - Server-first: `next: { revalidate: 60 }` gives every app a shared 60s
//    cache; a pause propagates to all public surfaces within a minute.
//  - FAIL-OPEN: any error (env missing, network, RLS change) returns "nothing
//    paused" — a telemetry hiccup must never blank the ecosystem's footers.
//    Only an explicit `status = 'paused'` or `is_published = false` row hides
//    a division; divisions without a registry row stay visible.

import { getPublicDivisions, type PublicDivisionLink } from "./company";

/** Registry slugs that differ from the static config's DivisionKey. */
const SLUG_TO_KEY_ALIASES: Record<string, string> = {
  "buildings-interiors": "building",
};

type RegistryRow = { slug: string | null; status: string | null; is_published: boolean | null };

/**
 * The set of division KEYS (config keys, aliases resolved) that must be
 * hidden from public surfaces right now: explicitly paused or unpublished.
 */
export async function getHiddenDivisionKeys(): Promise<Set<string>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return new Set();

  try {
    const res = await fetch(
      `${url}/rest/v1/company_divisions?select=slug,status,is_published`,
      {
        headers: { apikey: anon, Authorization: `Bearer ${anon}` },
        // Shared 60s cache per app instance — a pause goes ecosystem-wide
        // within a minute without hammering the registry.
        next: { revalidate: 60 },
      },
    );
    if (!res.ok) return new Set();
    const rows = (await res.json().catch(() => null)) as RegistryRow[] | null;
    if (!Array.isArray(rows)) return new Set();

    const hidden = new Set<string>();
    for (const row of rows) {
      const slug = String(row.slug ?? "").trim().toLowerCase();
      if (!slug) continue;
      const key = SLUG_TO_KEY_ALIASES[slug] ?? slug;
      if (row.status === "paused" || row.is_published === false) {
        hidden.add(key);
      }
    }
    return hidden;
  } catch {
    return new Set();
  }
}

/**
 * The static public division list minus anything the owner has paused or
 * unpublished. Drop-in replacement for getPublicDivisions() on SERVER
 * surfaces (footers, nav, marketing grids).
 */
export async function getLivePublicDivisions(
  base?: PublicDivisionLink[],
): Promise<PublicDivisionLink[]> {
  const all = base ?? getPublicDivisions();
  const hidden = await getHiddenDivisionKeys();
  if (hidden.size === 0) return all;
  return all.filter((division) => !hidden.has(division.key));
}
