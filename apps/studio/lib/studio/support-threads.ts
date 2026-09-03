import type { createAdminSupabase } from "@/lib/supabase";

/**
 * STU-a — studio-scoped support-thread loader.
 *
 * `support_threads` is a SHARED, cross-division table keyed by `id` only.
 * A studio staffer must never read or mutate a thread that belongs to
 * another division, so every studio support route loads threads through
 * this helper. It pins `division = "studio"` with STRICT equality — a row
 * whose division is NULL or any non-studio value yields `null` (fail
 * closed). Callers treat `null` as "not found" and respond 404/forbidden,
 * so the endpoint never becomes a cross-division existence oracle.
 */
export type StudioThreadRow = {
  id: string;
  user_id: string | null;
  subject: string | null;
  division: string | null;
  category: string | null;
  status: string | null;
};

export async function loadStudioThread(
  admin: ReturnType<typeof createAdminSupabase>,
  threadId: string,
): Promise<StudioThreadRow | null> {
  const id = String(threadId ?? "").trim();
  if (!id) return null;

  const { data } = await admin
    .from("support_threads")
    .select("id, user_id, subject, division, category, status")
    .eq("id", id)
    .eq("division", "studio")
    .maybeSingle<StudioThreadRow>();

  return data ?? null;
}
