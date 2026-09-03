import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyOutbox,
  mergeOutbox,
  outboxAck,
  outboxAppend,
  outboxFail,
  outboxRetry,
} from "../outbox";
import type { ChatThreadMessage } from "../types";

const VIEWER = { id: "viewer-1", name: "Me" };
const NOW = "2026-07-02T10:00:00.000Z";

const serverMsg = (id: string, body = `body-${id}`): ChatThreadMessage => ({
  id,
  authorId: "other-1",
  authorRole: "other",
  body,
  createdAt: NOW,
});

test("append creates a sending entry with namespaced incremental ids", () => {
  const first = outboxAppend(emptyOutbox(), { body: "hello", now: NOW });
  const second = outboxAppend(first.state, { body: "again", now: NOW });
  assert.equal(first.localId, "local-0");
  assert.equal(second.localId, "local-1");
  assert.equal(second.state.entries.length, 2);
  assert.deepEqual(
    second.state.entries.map((e) => e.state),
    ["sending", "sending"],
  );
});

test("fail marks the entry failed with a reason; retry restores sending in place", () => {
  const { state, localId } = outboxAppend(emptyOutbox(), { body: "hi", now: NOW });
  const withMore = outboxAppend(state, { body: "later", now: NOW }).state;
  const failed = outboxFail(withMore, localId, "blocked");
  assert.equal(failed.entries[0].state, "failed");
  assert.equal(failed.entries[0].failReason, "blocked");
  const retried = outboxRetry(failed, localId);
  assert.equal(retried.entries[0].state, "sending");
  assert.equal(retried.entries[0].failReason, null);
  assert.equal(retried.entries[0].localId, localId); // same position, same id
  assert.equal(retried.entries[0].createdAt, NOW); // timestamp preserved
});

test("ack removes the entry", () => {
  const { state, localId } = outboxAppend(emptyOutbox(), { body: "hi", now: NOW });
  const acked = outboxAck(state, localId);
  assert.equal(acked.entries.length, 0);
});

test("merge renders server, then confirmed (deduped by id), then outbox as viewer messages", () => {
  const { state, localId } = outboxAppend(emptyOutbox(), { body: "pending", now: NOW });
  const confirmedDup = { ...serverMsg("s2"), authorId: VIEWER.id, authorRole: "viewer" as const };
  const merged = mergeOutbox([serverMsg("s1"), serverMsg("s2")], [confirmedDup], state, VIEWER);
  assert.deepEqual(
    merged.map((m) => m.id),
    ["s1", "s2", localId], // confirmed s2 deduped against server s2
  );
  const pending = merged[2];
  assert.equal(pending.authorId, VIEWER.id);
  assert.equal(pending.authorRole, "viewer");
  assert.equal(pending.deliveryState, "sending");
});

test("failed entries surface deliveryState failed with the reason", () => {
  const { state, localId } = outboxAppend(emptyOutbox(), { body: "nope", now: NOW });
  const failed = outboxFail(state, localId, "Simulated");
  const merged = mergeOutbox([], [], failed, VIEWER);
  assert.equal(merged[0].deliveryState, "failed");
  assert.equal(merged[0].failReason, "Simulated");
});

test("confirmed messages not yet in the server list stay visible", () => {
  const confirmed = { ...serverMsg("c9"), authorId: VIEWER.id, authorRole: "viewer" as const };
  const merged = mergeOutbox([serverMsg("s1")], [confirmed], emptyOutbox(), VIEWER);
  assert.deepEqual(
    merged.map((m) => m.id),
    ["s1", "c9"],
  );
});

test("ten rapid appends keep dispatch order", () => {
  let state = emptyOutbox();
  for (let i = 0; i < 10; i += 1) {
    state = outboxAppend(state, { body: `m${i}`, now: NOW }).state;
  }
  const merged = mergeOutbox([], [], state, VIEWER);
  assert.deepEqual(
    merged.map((m) => m.id),
    Array.from({ length: 10 }, (_, i) => `local-${i}`),
  );
});
