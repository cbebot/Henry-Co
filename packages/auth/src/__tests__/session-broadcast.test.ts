/**
 * createSessionBroadcaster — typed BroadcastChannel("henryco-session")
 * wrapper. Uses the FakeBroadcastChannel from setup.mjs so two
 * broadcasters in the same node:test process talk to each other,
 * matching real browser cross-tab behaviour.
 */

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  createSessionBroadcaster,
  SESSION_CHANNEL_NAME,
  type SessionBroadcastMessage,
} from "../client/session-broadcast";

declare const __resetAuthTestState: () => void;

beforeEach(() => {
  __resetAuthTestState();
});

test("session-broadcast: channel name is the canonical 'henryco-session'", () => {
  assert.equal(SESSION_CHANNEL_NAME, "henryco-session");
});

test("session-broadcast: createSessionBroadcaster returns a broadcaster interface", () => {
  const b = createSessionBroadcaster();
  assert.equal(typeof b.publish, "function");
  assert.equal(typeof b.subscribe, "function");
  assert.equal(typeof b.close, "function");
  b.close();
});

test("session-broadcast: publishes sign-out across instances", async () => {
  const publisher = createSessionBroadcaster();
  const listener = createSessionBroadcaster();
  const received: SessionBroadcastMessage[] = [];
  listener.subscribe((m) => received.push(m));

  publisher.publish({ type: "sign-out", reason: "user" });
  await new Promise((r) => setTimeout(r, 0));

  assert.equal(received.length, 1);
  const msg = received[0]!;
  assert.equal(msg.type, "sign-out");
  if (msg.type === "sign-out") {
    assert.equal(msg.reason, "user");
    assert.equal(typeof msg.at, "number");
  }

  publisher.close();
  listener.close();
});

test("session-broadcast: publisher does NOT receive its own messages", async () => {
  const publisher = createSessionBroadcaster();
  const received: SessionBroadcastMessage[] = [];
  publisher.subscribe((m) => received.push(m));
  publisher.publish({ type: "sign-out", reason: "expired" });
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(received.length, 0);
  publisher.close();
});

test("session-broadcast: delivers user-changed and reauth-required messages", async () => {
  const publisher = createSessionBroadcaster();
  const listener = createSessionBroadcaster();
  const received: SessionBroadcastMessage[] = [];
  listener.subscribe((m) => received.push(m));

  publisher.publish({ type: "user-changed", userId: "u-42" });
  publisher.publish({ type: "reauth-required", returnPath: "/dashboard" });
  publisher.publish({ type: "draft-restored", draftKey: "support-new" });
  await new Promise((r) => setTimeout(r, 0));

  assert.equal(received.length, 3);
  assert.equal(received[0]!.type, "user-changed");
  assert.equal(received[1]!.type, "reauth-required");
  assert.equal(received[2]!.type, "draft-restored");

  publisher.close();
  listener.close();
});

test("session-broadcast: unsubscribe stops the specific listener", async () => {
  const publisher = createSessionBroadcaster();
  const listener = createSessionBroadcaster();
  const received: SessionBroadcastMessage[] = [];
  const sub = listener.subscribe((m) => received.push(m));
  sub.unsubscribe();
  publisher.publish({ type: "sign-out", reason: "user" });
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(received.length, 0);
  publisher.close();
  listener.close();
});

test("session-broadcast: close() stops delivery to all listeners on instance", async () => {
  const publisher = createSessionBroadcaster();
  const listener = createSessionBroadcaster();
  const received: SessionBroadcastMessage[] = [];
  listener.subscribe((m) => received.push(m));
  listener.close();
  publisher.publish({ type: "sign-out", reason: "server" });
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(received.length, 0);
  publisher.close();
});

test("session-broadcast: listener error does not break peer listeners", async () => {
  const publisher = createSessionBroadcaster();
  const listener = createSessionBroadcaster();
  const received: SessionBroadcastMessage[] = [];
  listener.subscribe(() => {
    throw new Error("broken listener");
  });
  listener.subscribe((m) => received.push(m));
  publisher.publish({ type: "sign-out", reason: "user" });
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(received.length, 1);
  publisher.close();
  listener.close();
});

test("session-broadcast: publish auto-stamps `at` when not provided", async () => {
  const publisher = createSessionBroadcaster();
  const listener = createSessionBroadcaster();
  const received: SessionBroadcastMessage[] = [];
  listener.subscribe((m) => received.push(m));
  const before = Date.now();
  publisher.publish({ type: "sign-out", reason: "user" });
  await new Promise((r) => setTimeout(r, 0));
  const after = Date.now();
  const msg = received[0]!;
  assert.ok(msg.at >= before && msg.at <= after);
  publisher.close();
  listener.close();
});
