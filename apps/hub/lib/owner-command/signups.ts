import "server-only";

import { unstable_cache } from "next/cache";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * owner-command/signups — the first signups time-series the owner console has
 * ever had (OCC-3; the delta study found NO aggregate signup query anywhere).
 *
 * Exact HEAD counts over customer_profiles.created_at — one cheap count per
 * week window plus the all-time total. No row scans, no sampling caps: these
 * numbers are exact by construction.
 */

const CACHE_SECONDS = 300;
const TIMEOUT_MS = 6000;
const WEEKS = 8;

export type SignupsSnapshot =
  | {
      ok: true;
      generatedAt: string;
      totalProfiles: number;
      last7d: number;
      /** Weekly signup counts, oldest → newest; weekStart is the ISO date of day 1 of the 7-day window. */
      weekly: Array<{ weekStart: string; count: number }>;
    }
  | { ok: false; reason: "timeout" | "unavailable" };

async function readSnapshot(): Promise<SignupsSnapshot> {
  const sb = createAdminSupabase();
  const dayMs = 86_400_000;
  const now = Date.now();

  const windows: Array<{ weekStart: string; gte: string; lt: string }> = [];
  for (let i = WEEKS - 1; i >= 0; i--) {
    const start = new Date(now - (i + 1) * 7 * dayMs);
    const end = new Date(now - i * 7 * dayMs);
    windows.push({
      weekStart: start.toISOString().slice(0, 10),
      gte: start.toISOString(),
      lt: end.toISOString(),
    });
  }

  const [totalRes, ...weekRes] = await Promise.all([
    sb.from("customer_profiles").select("id", { count: "exact", head: true }),
    ...windows.map((w) =>
      sb
        .from("customer_profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", w.gte)
        .lt("created_at", w.lt),
    ),
  ]);

  if (totalRes.error) throw totalRes.error;
  for (const res of weekRes) {
    if (res.error) throw res.error;
  }

  const weekly = windows.map((w, i) => ({ weekStart: w.weekStart, count: weekRes[i].count ?? 0 }));

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    totalProfiles: totalRes.count ?? 0,
    last7d: weekly[weekly.length - 1]?.count ?? 0,
    weekly,
  };
}

const readSnapshotCached = unstable_cache(
  async (): Promise<SignupsSnapshot | null> => {
    try {
      return await readSnapshot();
    } catch {
      // Never cache a failure — the next request retries.
      return null;
    }
  },
  ["owner-command-signups"],
  { revalidate: CACHE_SECONDS, tags: ["owner-command-signups"] },
);

export async function getSignupsSnapshot(): Promise<SignupsSnapshot> {
  try {
    const result = await Promise.race<SignupsSnapshot | null | "timeout">([
      readSnapshotCached(),
      new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), TIMEOUT_MS)),
    ]);
    if (result === "timeout") return { ok: false, reason: "timeout" };
    return result ?? { ok: false, reason: "unavailable" };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
