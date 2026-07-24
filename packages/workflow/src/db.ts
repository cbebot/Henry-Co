/**
 * DB adapters — the real `workflow_locks` / `internal_ai_spend_ledger` backing
 * for the lock + spend primitives. Structurally typed against the supabase-js
 * client (no hard `@supabase/supabase-js` dep, so the package stays light and
 * every app passes its own service-role admin client).
 *
 * All writes are service-role only; both tables are RLS default-deny and the
 * spend RPCs are `SECURITY DEFINER`, EXECUTE granted to service_role only
 * (V3-43 migration). Nothing here touches payments_private or a customer wallet.
 */

import type { LockStore } from "./lock";
import type { SpendStore } from "./spend";

/** A minimal, self-returning query-builder shape (the supabase-js filter chain). */
export interface QueryBuilderLike {
  update(values: Record<string, unknown>): QueryBuilderLike;
  eq(col: string, val: unknown): QueryBuilderLike;
  lt(col: string, val: unknown): QueryBuilderLike;
  select(cols: string): QueryBuilderLike;
  maybeSingle(): Promise<{ data: unknown; error: unknown }>;
}

/** The minimal supabase-js surface the adapters use. */
export interface SupabaseLike {
  from(table: string): QueryBuilderLike;
  rpc(fn: string, args: Record<string, unknown>): Promise<{ data: unknown; error: unknown }>;
}

/** The ONE lock table CAS — win iff `locked_until < now` for `lock_key`. */
export function workflowLockStore(client: SupabaseLike): LockStore {
  return {
    async tryAcquire(input) {
      const { data } = await client
        .from("workflow_locks")
        .update({ locked_until: input.untilIso, holder: input.worker, updated_at: input.nowIso })
        .eq("lock_key", input.key)
        .lt("locked_until", input.nowIso)
        .select("lock_key")
        .maybeSingle();
      return Boolean(data);
    },
    async release(input) {
      await client
        .from("workflow_locks")
        .update({ locked_until: input.nowIso, updated_at: input.nowIso })
        .eq("lock_key", input.key)
        .eq("holder", input.worker)
        .select("lock_key")
        .maybeSingle();
    },
  };
}

/** The ONE keyed internal-spend ledger, via the SECURITY DEFINER RPCs. */
export function internalSpendStore(client: SupabaseLike): SpendStore {
  return {
    async spentToday(input) {
      const { data, error } = await client.rpc("internal_ai_spend_today", { p_budget_key: input.budgetKey });
      if (error) return null; // read failure ⇒ caller degrades CLOSED
      return Number(data) || 0;
    },
    async add(input) {
      if (!(input.addKobo > 0)) return null;
      const { data, error } = await client.rpc("internal_ai_spend_add", {
        p_budget_key: input.budgetKey,
        p_add_kobo: Math.round(input.addKobo),
      });
      if (error) return null;
      return Number(data) || 0;
    },
  };
}
