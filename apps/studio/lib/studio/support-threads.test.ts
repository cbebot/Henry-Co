/**
 * STU-a — every studio support route loads a thread through loadStudioThread,
 * which pins `division = "studio"`. `support_threads` is a shared cross-
 * division table keyed by id only, so without this scope a studio staffer
 * could read/mutate another division's thread. These tests prove the
 * division filter is applied, blank ids short-circuit, and a non-matching
 * row yields null (callers turn that into 404 — no existence oracle).
 *
 * The helper takes the admin client by injection, so the test drives it with
 * a tiny stub that records the query chain — no Supabase / server-only.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { loadStudioThread } from "./support-threads";

type EqCall = { column: string; value: string };

function fakeAdmin(row: Record<string, unknown> | null) {
  const eqCalls: EqCall[] = [];
  const state = { table: "", columns: "" };
  const builder = {
    eq(column: string, value: string) {
      eqCalls.push({ column, value });
      return builder;
    },
    async maybeSingle() {
      return { data: row, error: null };
    },
  };
  return {
    eqCalls,
    state,
    from(table: string) {
      state.table = table;
      return {
        select(columns: string) {
          state.columns = columns;
          return builder;
        },
      };
    },
  };
}

test("loads a studio thread and pins division = studio", async () => {
  const admin = fakeAdmin({
    id: "t1",
    user_id: "u1",
    subject: "Hi",
    division: "studio",
    category: "general",
    status: "open",
  });
  const thread = await loadStudioThread(admin as never, "t1");
  assert.ok(thread);
  assert.equal(thread?.id, "t1");
  assert.equal(admin.state.table, "support_threads");
  assert.ok(
    admin.eqCalls.some((c) => c.column === "division" && c.value === "studio"),
    "division=studio filter must be applied",
  );
  assert.ok(admin.eqCalls.some((c) => c.column === "id" && c.value === "t1"));
});

test("returns null when the row does not match (cross-division / missing)", async () => {
  const admin = fakeAdmin(null);
  const thread = await loadStudioThread(admin as never, "t-other");
  assert.equal(thread, null);
});

test("blank thread id short-circuits to null without a query", async () => {
  const admin = fakeAdmin({ id: "x" });
  const thread = await loadStudioThread(admin as never, "   ");
  assert.equal(thread, null);
  assert.equal(admin.state.table, "");
});
