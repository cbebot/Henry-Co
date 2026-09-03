import "server-only";

import { evaluateFreeBudget, resolveFreeBudgetKobo, type FreeBudgetOutcome } from "@henryco/ai-gateway";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * The durable half of the Free-AI Economic Guardrail. Reads today's accumulated free-AI spend
 * from the ledger (service role, deny-all table) and applies the gateway's pure budget policy,
 * so the free surfaces never lose more in a day than the budget the owner set. Best-effort: if
 * the ledger is unreachable (or not migrated yet), it degrades OPEN rather than blocking help.
 */

/** Decide whether a free turn may proceed under today's budget. */
export async function checkFreeBudget(isAnonymous: boolean): Promise<FreeBudgetOutcome> {
  try {
    const admin = createAdminSupabase();
    const { data, error } = await admin.rpc("ai_free_spend_today");
    if (error) return { decision: "allow", usedFraction: 0 };
    const spentTodayKobo = Number(data) || 0;
    return evaluateFreeBudget({
      spentTodayKobo,
      budgetKobo: resolveFreeBudgetKobo(process.env),
      isAnonymous,
    });
  } catch {
    return { decision: "allow", usedFraction: 0 };
  }
}

/** Add a completed free turn's estimated provider cost (the real loss) to today's total. Best-effort. */
export async function recordFreeSpend(costKobo: number): Promise<void> {
  if (!(costKobo > 0)) return;
  try {
    const admin = createAdminSupabase();
    await admin.rpc("ai_free_spend_add", { p_add_kobo: Math.round(costKobo) });
  } catch {
    /* best-effort */
  }
}
