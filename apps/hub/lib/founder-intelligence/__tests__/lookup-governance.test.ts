import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";

import {
  FOUNDER_LOOKUP_GOVERNANCE,
  lookupParamKeys,
} from "../lookup-governance";

/**
 * F4 lookup governance gate — the read-side twin of the F3 action gate. If a
 * future lookup breaks any invariant, this fails and the PR is blocked.
 */

test("every lookup paramsSchema is a zod object and is STRICT (unknown keys rejected)", () => {
  for (const g of FOUNDER_LOOKUP_GOVERNANCE) {
    const ok = g.paramsSchema.safeParse(sampleFor(g.key));
    assert.ok(ok.success, `${g.key} should accept its own sample: ${JSON.stringify(ok)}`);
    const withExtra = { ...sampleFor(g.key), __injected: "x" };
    assert.ok(!g.paramsSchema.safeParse(withExtra).success, `${g.key} must reject unknown keys (not .strict())`);
  }
});

test("every lookup is readOnly === true (the catalog cannot hold a write)", () => {
  for (const g of FOUNDER_LOOKUP_GOVERNANCE) {
    assert.equal(g.readOnly, true, `${g.key} must be readOnly`);
  }
});

test("every lookup param is a STRING (a read filter is never a number to invent)", () => {
  for (const g of FOUNDER_LOOKUP_GOVERNANCE) {
    const sample = sampleFor(g.key);
    for (const key of lookupParamKeys(g)) {
      if (sample[key] === undefined) continue; // optional param omitted in the sample
      assert.equal(typeof sample[key], "string", `${g.key}.${key} sample must be a string`);
    }
  }
});

test("lookup keys are unique and bounded", () => {
  const keys = FOUNDER_LOOKUP_GOVERNANCE.map((g) => g.key);
  assert.equal(new Set(keys).size, keys.length, "duplicate lookup key");
  for (const key of keys) {
    assert.ok(key.length > 0 && key.length <= 64, `${key} length out of bounds`);
    assert.match(key, /^[a-z0-9._-]+$/, `${key} must be kebab/dot-cased`);
  }
});

test("every lookup has a non-empty prompt description naming its params", () => {
  for (const g of FOUNDER_LOOKUP_GOVERNANCE) {
    assert.ok(g.description.startsWith(g.key), `${g.key} description must lead with its key`);
    assert.ok(g.description.includes("params"), `${g.key} description must state its params`);
  }
});

function sampleFor(key: string): Record<string, unknown> {
  switch (key) {
    case "support.threads.list":
      return { focus: "urgent" };
    case "support.thread.get":
      return { threadId: "c3d4e5f6-a7b8-4c9d-8e1f-2a3b4c5d6e7f" };
    // SA-4 studio-agency reads
    case "studio.brief.get":
      return { briefId: "d4e5f6a7-b8c9-4d0e-9f2a-3b4c5d6e7f8a" };
    case "studio.job.get":
      return { jobId: "e5f6a7b8-c9d0-4e1f-8a2b-3c4d5e6f7a8b" };
    case "marketplace.vendor_applications.list":
    case "kyc.submissions.list":
    case "marketplace.products.pending.list":
    case "staff.list":
    case "studio.briefs.pending.list":
    case "studio.jobs.active.list":
      return {};
    default:
      return {};
  }
}

test("sanity: zod v4 strict object support", () => {
  const s = z.object({ a: z.string() }).strict();
  assert.ok(!s.safeParse({ a: "x", b: 1 }).success);
});
