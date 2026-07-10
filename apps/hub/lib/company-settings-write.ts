import "server-only";

import { revalidatePath } from "next/cache";
import { createAdminSupabase } from "@/app/lib/supabase-admin";
import { normalizeCompanySettings } from "@/app/lib/company-settings-shared";
import { writeOwnerAudit } from "@/lib/owner-audit-log";

/**
 * THE company-settings write path — extracted from /api/owner/settings POST
 * (F3, 2026-07-10) so the founder action rail executes through the EXACT same
 * sequence the human console uses: read existing → normalize → upsert → audit
 * (full before/after) → revalidate the public pages. One path, two callers.
 *
 * CALLERS MUST AUTHORIZE FIRST (requireOwner) — this module deliberately does
 * not gate, because the route and the F3 confirm rail each carry their own
 * owner authorization and mutation context.
 *
 * Partial-patch warning: normalizeCompanySettings fills DEFAULTS for missing
 * fields. A caller applying a single-field change must merge onto the current
 * row first (the F3 binding does) — never pass a bare partial.
 */
export async function applyCompanySettingsWrite(body: unknown): Promise<
  | { ok: true; oldValues: unknown; newValues: Record<string, unknown> }
  | { ok: false; error: string }
> {
  const admin = createAdminSupabase();
  const normalized = normalizeCompanySettings(body as never);

  const payload = {
    ...normalized,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await admin
    .from("company_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  const result = existing?.id
    ? await admin.from("company_settings").update(payload).eq("id", existing.id)
    : await admin.from("company_settings").insert(payload);

  if (result.error) {
    console.error("[company-settings-write]", result.error);
    return { ok: false, error: "Could not save company settings right now." };
  }

  // The DB write is the point of no return. Everything below is best-effort —
  // a revalidate or audit hiccup must NEVER flip a landed write to a failure
  // (review finding, 2026-07-10: a "failed" outcome on a committed write left
  // the F3 proposal ledger misreporting reality).
  try {
    await writeOwnerAudit({
      action: "owner.brand.settings.update",
      entityType: "company_settings",
      entityId: existing?.id ? String(existing.id) : null,
      oldValues: existing ?? null,
      newValues: payload,
      division: "hub",
    });
    for (const path of ["/", "/about", "/contact", "/privacy", "/terms", "/owner"]) {
      revalidatePath(path);
    }
  } catch (postWrite) {
    console.error("[company-settings-write] post-write step failed (write landed)", postWrite);
  }

  return { ok: true, oldValues: existing ?? null, newValues: payload };
}

/** The current settings row (or null) — the F3 true-state reader. */
export async function readCompanySettingsRow(): Promise<Record<string, unknown> | null> {
  const admin = createAdminSupabase();
  const { data } = await admin.from("company_settings").select("*").limit(1).maybeSingle();
  return (data as Record<string, unknown> | null) ?? null;
}
