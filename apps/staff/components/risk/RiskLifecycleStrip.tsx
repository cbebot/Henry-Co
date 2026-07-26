import "server-only";

/**
 * V3-40 — model lifecycle strip (rendered above the risk queue).
 *
 * Read path rides the SAME cookie client as the queue (RLS: security staff).
 * The promote/rollback forms render for OWNER access only and post to the
 * owner-gated server actions — the visibility check here is affordance, the
 * real gate is re-derived inside the action.
 */

import { getStaffRiskCopy } from "@henryco/i18n";
import { createStaffSupabaseServer } from "@/lib/supabase/server";
import { promoteRiskModelAction, rollbackRiskModelAction } from "@/app/(track-c)/_actions/risk-model";
import { RISK_SHADOW_WINDOW_DAYS } from "@/lib/risk/lifecycle";

type ModelRow = { version: string; status: string; approved_at: string | null };

export async function RiskLifecycleStrip({ hasOwnerAccess }: { hasOwnerAccess: boolean }) {
  const copy = getStaffRiskCopy("en");
  const supabase = await createStaffSupabaseServer();

  let models: ModelRow[] = [];
  const shadowDays = new Map<string, number>();
  try {
    const { data } = await supabase
      .from("model_versions")
      .select("version, status, approved_at")
      .eq("model_kind", "fraud_risk")
      .order("created_at", { ascending: false })
      .limit(8);
    models = (data ?? []) as ModelRow[];
    const { data: days } = await supabase
      .from("risk_scores")
      .select("model_version, scored_on")
      .eq("model_kind", "fraud_risk")
      .limit(5000);
    const seen = new Map<string, Set<string>>();
    for (const row of (days ?? []) as Array<{ model_version: string; scored_on: string }>) {
      const set = seen.get(row.model_version) ?? new Set<string>();
      set.add(row.scored_on);
      seen.set(row.model_version, set);
    }
    for (const [version, set] of seen) shadowDays.set(version, set.size);
  } catch {
    // committed-not-applied — render nothing rather than a broken strip.
    return null;
  }
  if (models.length === 0) return null;

  return (
    <section
      aria-label={copy.lifecycle.title}
      style={{
        border: "1px solid var(--hc-border-subtle, rgba(10,10,10,0.12))",
        borderRadius: "0.75rem",
        padding: "0.9rem 1.1rem",
        marginBottom: "1rem",
        background: "var(--hc-surface-elevated, #F8F7F3)",
      }}
    >
      <div style={{ fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--hc-text-tertiary, rgba(10,10,10,0.55))" }}>
        {copy.lifecycle.title}
      </div>
      <ul style={{ listStyle: "none", margin: "0.5rem 0 0", padding: 0, display: "grid", gap: "0.45rem" }}>
        {models.map((model) => {
          const days = shadowDays.get(model.version) ?? 0;
          const windowMet = days >= RISK_SHADOW_WINDOW_DAYS;
          return (
            <li key={model.version} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.7rem", fontSize: "0.84rem" }}>
              <strong style={{ fontVariantNumeric: "tabular-nums" }}>
                {copy.lifecycle.versionLabel} {model.version}
              </strong>
              <span>
                {copy.lifecycle.statusLabel}: {model.status}
              </span>
              <span style={{ color: "var(--hc-text-tertiary, rgba(10,10,10,0.55))" }}>
                {days}/{RISK_SHADOW_WINDOW_DAYS} {copy.lifecycle.shadowDays}
              </span>
              {hasOwnerAccess && model.status === "shadow" ? (
                <form action={promoteRiskModelAction} style={{ display: "inline-flex", gap: "0.4rem" }}>
                  <input type="hidden" name="version" value={model.version} />
                  <button
                    type="submit"
                    disabled={!windowMet}
                    title={windowMet ? undefined : copy.lifecycle.ownerOnly}
                    style={{ fontSize: "0.78rem", padding: "0.2rem 0.6rem", borderRadius: "0.45rem", cursor: windowMet ? "pointer" : "not-allowed" }}
                  >
                    {copy.lifecycle.promote}
                  </button>
                </form>
              ) : null}
              {hasOwnerAccess && model.status === "live" ? (
                <form action={rollbackRiskModelAction} style={{ display: "inline-flex", gap: "0.4rem", alignItems: "center" }}>
                  <input type="hidden" name="version" value={model.version} />
                  <input
                    name="reason"
                    required
                    placeholder={copy.lifecycle.reasonLabel}
                    style={{ fontSize: "0.78rem", padding: "0.2rem 0.5rem", borderRadius: "0.45rem", border: "1px solid var(--hc-border-subtle, rgba(10,10,10,0.2))" }}
                  />
                  <button type="submit" style={{ fontSize: "0.78rem", padding: "0.2rem 0.6rem", borderRadius: "0.45rem", cursor: "pointer" }}>
                    {copy.lifecycle.rollback}
                  </button>
                </form>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
