// V3-40 — the account-side sensitive-action risk gate (server-only).
//
// Consulted by requireSensitiveAction via the optional `riskGate` hook on the
// wallet-sensitive routes. What it reports — and ALL it can ever report — is a
// STAFF-APPLIED hold/freeze under a LIVE risk model:
//   * a score alone gates nothing (system actor can only flag — no auto-punishment),
//   * a shadow/rolled-back model gates nothing,
//   * flag dark (`predictive_shadow` off) → the gate is not even constructed,
//   * absent tables / any read error → fail-OPEN (a broken risk reader must never
//     lock a paying customer out).
// The customer-facing message is neutral typed copy (12 locales) — never the word
// "fraud", never a score.

import "server-only";

import type { SensitiveActionRiskGate } from "@henryco/auth/server/sensitive-action-guard";
import { getRiskStatusCopy } from "@henryco/i18n/server";
import {
  isFlagEnabled,
  isSensitiveActionGated,
  parseHenryFeatureFlags,
  type ActiveEnforcement,
} from "@henryco/intelligence";
import { getAccountAppLocale } from "@/lib/locale-server";
import { createAdminSupabase } from "@/lib/supabase";

/** Latest user-affecting enforcement state for one entity (service-role read). */
export async function readActiveEnforcement(
  entityType: "account" | "listing" | "transaction" | "support_ticket",
  entityId: string,
): Promise<ActiveEnforcement | null> {
  try {
    const admin = createAdminSupabase();
    const { data, error } = await admin
      .from("risk_enforcement_log")
      .select("action, actor, model_kind, model_version, created_at, id")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .in("action", ["hold", "freeze", "release", "staff_override"])
      .order("created_at", { ascending: false })
      // id tiebreaker: on the rare same-timestamp tie the latest action is still
      // deterministic (a stale hold can never win over its own release).
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as { action: string; actor: string; model_kind: string; model_version: string };
    if (row.action !== "hold" && row.action !== "freeze") return null; // released/overridden

    const { data: model } = await admin
      .from("model_versions")
      .select("status")
      .eq("model_kind", row.model_kind)
      .eq("version", row.model_version)
      .maybeSingle();
    const modelStatus = (model as { status?: string } | null)?.status;
    return {
      state: row.action,
      appliedByStaff: row.actor !== "system",
      modelStatus:
        modelStatus === "live" || modelStatus === "shadow" || modelStatus === "rolled_back" || modelStatus === "retired"
          ? modelStatus
          : "retired",
    };
  } catch {
    return null; // fail-open
  }
}

/**
 * Build the gate for the signed-in account, or undefined when the risk system
 * is dark — undefined means requireSensitiveAction skips the hook entirely.
 */
export function buildAccountRiskGate(): SensitiveActionRiskGate | undefined {
  const flags = parseHenryFeatureFlags(process.env as Record<string, string | undefined>);
  if (!isFlagEnabled(flags, "predictive_shadow")) return undefined;

  return async ({ userId }) => {
    const active = await readActiveEnforcement("account", userId);
    if (!isSensitiveActionGated(active)) return { gated: false };
    const locale = await getAccountAppLocale().catch(() => "en" as const);
    const copy = getRiskStatusCopy(locale);
    const message = active?.state === "freeze" ? copy.freeze.body : copy.hold.body;
    return { gated: true, message };
  };
}
