import { test } from "node:test";
import assert from "node:assert/strict";

import { dispatchPushWith } from "../dispatch";
import type {
  DispatchDeps,
  StoredSubscription,
  PushPayload,
  DeliveryLogEntry,
  SendResult,
} from "../types";

function sub(
  partial: Partial<StoredSubscription> & { id: string; channel: "web" | "expo" },
): StoredSubscription {
  return {
    userId: "u1",
    endpoint: null,
    p256dh: null,
    auth: null,
    expoToken: null,
    deviceId: null,
    ...partial,
  };
}

function makeDeps(over: {
  subs: StoredSubscription[];
  sendWeb?: (sub: StoredSubscription, payload: PushPayload) => Promise<SendResult>;
  sendExpo?: (sub: StoredSubscription, payload: PushPayload) => Promise<SendResult>;
}) {
  const logged: DeliveryLogEntry[] = [];
  const pruned: string[] = [];
  const failed: string[] = [];
  const deps: DispatchDeps = {
    listActiveSubscriptions: async () => over.subs,
    sendWeb: over.sendWeb ?? (async () => ({ ok: true })),
    sendExpo: over.sendExpo ?? (async () => ({ ok: true })),
    logDelivery: async (e) => {
      logged.push(e);
    },
    pruneSubscription: async (id) => {
      pruned.push(id);
    },
    recordFailure: async (id) => {
      failed.push(id);
    },
  };
  return { deps, logged, pruned, failed };
}

const payload: PushPayload = { title: "New sign-in", url: "/security" };

test("fans out to every active subscription and counts delivered", async () => {
  const subs = [
    sub({ id: "a", channel: "web", endpoint: "e1", p256dh: "k", auth: "s" }),
    sub({ id: "b", channel: "web", endpoint: "e2", p256dh: "k", auth: "s" }),
    sub({ id: "c", channel: "expo", expoToken: "ExpoTok" }),
  ];
  const { deps, logged } = makeDeps({ subs });
  const summary = await dispatchPushWith(deps, "u1", payload);

  assert.equal(summary.attempted, 3);
  assert.equal(summary.delivered, 3);
  assert.equal(summary.dead, 0);
  assert.equal(summary.failed, 0);
  assert.equal(logged.length, 3);
  assert.ok(logged.every((l) => l.channel === "push" && l.status === "delivered"));
  assert.deepEqual(new Set(logged.map((l) => l.provider)), new Set(["web-push", "expo"]));
});

test("routes web subs to sendWeb and expo subs to sendExpo", async () => {
  const seenWeb: string[] = [];
  const seenExpo: string[] = [];
  const subs = [
    sub({ id: "a", channel: "web", endpoint: "e1", p256dh: "k", auth: "s" }),
    sub({ id: "c", channel: "expo", expoToken: "ExpoTok" }),
  ];
  const { deps } = makeDeps({
    subs,
    sendWeb: async (s) => {
      seenWeb.push(s.id);
      return { ok: true };
    },
    sendExpo: async (s) => {
      seenExpo.push(s.id);
      return { ok: true };
    },
  });
  await dispatchPushWith(deps, "u1", payload);
  assert.deepEqual(seenWeb, ["a"]);
  assert.deepEqual(seenExpo, ["c"]);
});

test("prunes a subscription the provider reports dead (404/410/DeviceNotRegistered)", async () => {
  const subs = [
    sub({ id: "a", channel: "web", endpoint: "e1", p256dh: "k", auth: "s" }),
    sub({ id: "b", channel: "web", endpoint: "e2", p256dh: "k", auth: "s" }),
  ];
  const { deps, pruned, logged } = makeDeps({
    subs,
    sendWeb: async (s) => (s.id === "b" ? { ok: false, dead: true, error: "410 Gone" } : { ok: true }),
  });
  const summary = await dispatchPushWith(deps, "u1", payload);

  assert.equal(summary.delivered, 1);
  assert.equal(summary.dead, 1);
  assert.deepEqual(pruned, ["b"]);
  assert.equal(logged.find((l) => l.status === "dead")?.provider, "web-push");
});

test("records a transient failure WITHOUT pruning the credential", async () => {
  const subs = [sub({ id: "a", channel: "expo", expoToken: "ExpoTok" })];
  const { deps, pruned, failed, logged } = makeDeps({
    subs,
    sendExpo: async () => ({ ok: false, dead: false, error: "network timeout" }),
  });
  const summary = await dispatchPushWith(deps, "u1", payload);

  assert.equal(summary.failed, 1);
  assert.equal(summary.delivered, 0);
  assert.equal(summary.dead, 0);
  assert.deepEqual(pruned, []);
  assert.deepEqual(failed, ["a"]);
  assert.equal(logged.find((l) => l.status === "failed")?.errorMessage, "network timeout");
});

test("one dead/failed credential never blocks delivery to the others (money-grade redundancy)", async () => {
  const subs = [
    sub({ id: "a", channel: "web", endpoint: "e1", p256dh: "k", auth: "s" }),
    sub({ id: "b", channel: "web", endpoint: "e2", p256dh: "k", auth: "s" }),
    sub({ id: "c", channel: "expo", expoToken: "ExpoTok" }),
  ];
  const { deps } = makeDeps({
    subs,
    sendWeb: async (s) => (s.id === "a" ? { ok: false, dead: true, error: "410" } : { ok: true }),
    sendExpo: async () => {
      throw new Error("provider exploded");
    },
  });
  const summary = await dispatchPushWith(deps, "u1", payload);
  // b delivered; a dead; c threw -> counted as failed, not fatal.
  assert.equal(summary.delivered, 1);
  assert.equal(summary.dead, 1);
  assert.equal(summary.failed, 1);
});

test("threads notificationId + division from options into every delivery log entry", async () => {
  const subs = [
    sub({ id: "a", channel: "web", endpoint: "e1", p256dh: "k", auth: "s" }),
    sub({ id: "c", channel: "expo", expoToken: "ExpoTok" }),
  ];
  const { deps, logged } = makeDeps({ subs });
  await dispatchPushWith(deps, "u1", payload, {
    notificationId: "notif-123",
    division: "security",
  });
  assert.equal(logged.length, 2);
  assert.ok(logged.every((l) => l.notificationId === "notif-123" && l.division === "security"));
});

test("no subscriptions → clean no-op summary, nothing logged", async () => {
  const { deps, logged, pruned } = makeDeps({ subs: [] });
  const summary = await dispatchPushWith(deps, "u1", payload);
  assert.deepEqual(summary, { attempted: 0, delivered: 0, dead: 0, failed: 0 });
  assert.equal(logged.length, 0);
  assert.equal(pruned.length, 0);
});
