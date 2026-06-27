import { test } from "node:test";
import assert from "node:assert/strict";
import { createOfflineQueue } from "../resilience/offline-queue";

function memStorage() {
  let v: string | null = null;
  return { read: () => v, write: (x: string) => { v = x; }, dump: () => v };
}

test("enqueue persists to storage and survives a fresh queue (simulated tab close)", () => {
  const s = memStorage();
  const q1 = createOfflineQueue(s);
  q1.enqueue({ conversationId: "c1", body: "hi", attachments: [] });
  const q2 = createOfflineQueue(s); // new instance reads the same storage
  assert.equal(q2.pending().length, 1);
  assert.equal(q2.pending()[0].body, "hi");
});

test("flush replays queued messages and clears them on success", async () => {
  const s = memStorage();
  const q = createOfflineQueue(s);
  q.enqueue({ conversationId: "c1", body: "a", attachments: [] });
  q.enqueue({ conversationId: "c1", body: "b", attachments: [] });
  const sent: string[] = [];
  await q.flush(async (m) => { sent.push(m.body); return { ok: true }; });
  assert.deepEqual(sent, ["a", "b"]);
  assert.equal(q.pending().length, 0);
});

test("flush STOPS on a retryable server error (backpressure, no retry-storm) and keeps the item", async () => {
  const s = memStorage();
  const q = createOfflineQueue(s);
  q.enqueue({ conversationId: "c1", body: "a", attachments: [] });
  q.enqueue({ conversationId: "c1", body: "b", attachments: [] });
  let calls = 0;
  await q.flush(async () => { calls++; return { ok: false, retryable: true }; });
  assert.equal(calls, 1);              // stopped after the first failure
  assert.equal(q.pending().length, 2); // nothing dropped
});

test("flush DROPS a non-retryable (poison) message and continues to the next", async () => {
  const s = memStorage();
  const q = createOfflineQueue(s);
  q.enqueue({ conversationId: "c1", body: "poison", attachments: [] });
  q.enqueue({ conversationId: "c1", body: "good", attachments: [] });
  const sent: string[] = [];
  await q.flush(async (m) => {
    if (m.body === "poison") return { ok: false, retryable: false };
    sent.push(m.body);
    return { ok: true };
  });
  assert.deepEqual(sent, ["good"]);     // poison dropped, good still sent
  assert.equal(q.pending().length, 0);  // both cleared (poison dropped, good sent)
});
