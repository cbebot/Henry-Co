import { test } from "node:test";
import assert from "node:assert/strict";

import { RetentionEngine } from "../retention/engine";
import type { RetentionPolicy } from "../retention/policy";
import { makeVaultKit } from "./_fakes";

const NOW = new Date("2026-06-20T00:00:00.000Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();
const utf8 = (s: string) => new TextEncoder().encode(s);

const policy = (over: Partial<RetentionPolicy> = {}): RetentionPolicy => ({
  retentionDays: 365,
  amlFloorDays: 180,
  destructiveShredAllowed: true,
  ...over,
});

async function seed(kit: ReturnType<typeof makeVaultKit>, userId: string, createdAt: string) {
  const { id } = await kit.vault.storeEncryptedArtifact({
    userId,
    documentType: "nin",
    content: utf8(`doc-${userId}-${createdAt}`),
    contentType: "image/jpeg",
  });
  // backdate the row
  const row = kit.repo.rows.get(id)!;
  row.createdAt = createdAt;
  return id;
}

test("scheduled run is a no-op when retention is not configured", async () => {
  const kit = makeVaultKit({ now: () => NOW });
  await seed(kit, "u1", daysAgo(2000));
  const engine = new RetentionEngine({
    vault: kit.vault,
    repo: kit.repo,
    audit: kit.audit,
    policy: policy({ retentionDays: null }),
    now: () => NOW,
  });
  const summary = await engine.runScheduledShred();
  assert.equal(summary.shredded, 0);
  assert.equal(summary.kept, 1);
});

test("scheduled run shreds records past the window, keeps recent ones", async () => {
  const kit = makeVaultKit({ now: () => NOW });
  const old = await seed(kit, "u1", daysAgo(400));
  const recent = await seed(kit, "u1", daysAgo(10));
  const engine = new RetentionEngine({ vault: kit.vault, repo: kit.repo, audit: kit.audit, policy: policy(), now: () => NOW });
  const summary = await engine.runScheduledShred();
  assert.equal(summary.shredded, 1);
  assert.equal(summary.kept, 1);
  assert.equal(kit.repo.rows.get(old)!.wrappedDataKey, null, "old record crypto-shredded");
  assert.ok(kit.repo.rows.get(recent)!.wrappedDataKey, "recent record intact");
});

test("scheduled run respects an active legal hold", async () => {
  const kit = makeVaultKit({ now: () => NOW });
  const held = await seed(kit, "u1", daysAgo(2000));
  kit.repo.rows.get(held)!.legalHoldReason = "litigation";
  const engine = new RetentionEngine({ vault: kit.vault, repo: kit.repo, audit: kit.audit, policy: policy(), now: () => NOW });
  const summary = await engine.runScheduledShred();
  assert.equal(summary.shredded, 0);
  assert.ok(kit.repo.rows.get(held)!.wrappedDataKey, "held record not shredded");
});

test("on-request erasure shreds the user's eligible records, respecting the AML floor", async () => {
  const kit = makeVaultKit({ now: () => NOW });
  const eligible = await seed(kit, "u1", daysAgo(300)); // > 180d floor
  const tooRecent = await seed(kit, "u1", daysAgo(30)); // < 180d floor
  const otherUser = await seed(kit, "u2", daysAgo(300));
  const engine = new RetentionEngine({ vault: kit.vault, repo: kit.repo, audit: kit.audit, policy: policy(), now: () => NOW });
  const summary = await engine.eraseUserOnRequest("u1", { actorUserId: "u1" });
  assert.equal(summary.shredded, 1);
  assert.equal(summary.kept, 1);
  assert.equal(kit.repo.rows.get(eligible)!.wrappedDataKey, null);
  assert.ok(kit.repo.rows.get(tooRecent)!.wrappedDataKey, "under-floor record retained");
  assert.ok(kit.repo.rows.get(otherUser)!.wrappedDataKey, "other user's record untouched");
});

test("on-request erasure records an audit trail for the request", async () => {
  const kit = makeVaultKit({ now: () => NOW });
  await seed(kit, "u1", daysAgo(300));
  const engine = new RetentionEngine({ vault: kit.vault, repo: kit.repo, audit: kit.audit, policy: policy(), now: () => NOW });
  await engine.eraseUserOnRequest("u1", { actorUserId: "u1" });
  const actions = kit.audit.entries.map((e) => e.action);
  assert.ok(actions.some((a) => a.includes("erasure")), "an erasure-request audit row is written");
});
