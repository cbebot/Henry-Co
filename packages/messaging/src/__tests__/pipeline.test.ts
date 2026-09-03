import { test } from "node:test";
import assert from "node:assert/strict";
import { sendMessage } from "../pipeline";
import type { MessagingAdapter, PersistInput } from "../adapter";

function makeAdapter() {
  const persisted: PersistInput[] = [];
  const adapter: MessagingAdapter = {
    async persistMessage(i) {
      persisted.push(i);
      return { id: "m1", conversationId: i.conversationId, senderId: i.senderId, senderRole: i.senderRole, body: i.body, attachments: i.attachments, deliveryState: "sent", createdAt: "2026-06-26T00:00:00Z" };
    },
    async getParticipants() { return [{ userId: "u_buyer", role: "buyer" }, { userId: "u_seller", role: "seller" }]; },
  };
  return { adapter, persisted };
}

test("a clean message persists and notifies the OTHER participant by stable userId", async () => {
  const { adapter, persisted } = makeAdapter();
  const notified: string[] = [];
  const r = await sendMessage(
    { conversationId: "c1", senderId: "u_buyer", senderRole: "buyer", body: "is it available?" },
    { adapter, notify: async (n) => { notified.push(n.recipientUserId); } },
  );
  assert.equal(r.ok, true);
  assert.equal(persisted.length, 1);
  assert.deepEqual(notified, ["u_seller"]);   // never the sender; never an email
});

test("a high-severity contact message is BLOCKED and NEVER persisted", async () => {
  const { adapter, persisted } = makeAdapter();
  const r = await sendMessage(
    { conversationId: "c1", senderId: "u_buyer", senderRole: "buyer", body: "call me 0801 234 5678" },
    { adapter },
  );
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, "contact_blocked");
  assert.equal(persisted.length, 0);          // the invariant
});

test("a medium-severity message is persisted MASKED", async () => {
  const { adapter, persisted } = makeAdapter();
  const r = await sendMessage(
    { conversationId: "c1", senderId: "u_buyer", senderRole: "buyer", body: "follow @jane_doe" },
    { adapter },
  );
  assert.equal(r.ok, true);
  assert.ok(!persisted[0].body.includes("@jane_doe"));
});

test("a notify failure does NOT reject after persist (best-effort; no duplicate-retry vector)", async () => {
  const { adapter, persisted } = makeAdapter();
  const r = await sendMessage(
    { conversationId: "c1", senderId: "u_buyer", senderRole: "buyer", body: "is it available?" },
    { adapter, notify: async () => { throw new Error("publish blip"); } },
  );
  assert.equal(r.ok, true);          // committed send resolves ok despite notify throwing
  assert.equal(persisted.length, 1); // persisted exactly once — no duplicate
});

test("pipeline branches on the injected safety action regardless of text (block)", async () => {
  const { adapter, persisted } = makeAdapter();
  const r = await sendMessage(
    { conversationId: "c1", senderId: "u_buyer", senderRole: "buyer", body: "totally clean text" },
    { adapter, safety: () => ({ action: "block", maskedText: "", severity: "high" }) },
  );
  assert.equal(r.ok, false);
  assert.equal(persisted.length, 0); // block path, independent of trust ranking
});

test("pipeline persists the EXACT masked body the safety layer returns (mask)", async () => {
  const { adapter, persisted } = makeAdapter();
  const r = await sendMessage(
    { conversationId: "c1", senderId: "u_buyer", senderRole: "buyer", body: "raw body here" },
    { adapter, safety: () => ({ action: "mask", maskedText: "MASKED-BODY", severity: "medium" }) },
  );
  assert.equal(r.ok, true);
  assert.equal(persisted[0].body, "MASKED-BODY"); // exact masked body reaches persist
});

test("notify is per-recipient: one failing recipient does not starve the others", async () => {
  const persisted: PersistInput[] = [];
  const adapter: MessagingAdapter = {
    async persistMessage(i) {
      persisted.push(i);
      return { id: "m1", conversationId: i.conversationId, senderId: i.senderId, senderRole: i.senderRole, body: i.body, attachments: i.attachments, deliveryState: "sent", createdAt: "2026-06-26T00:00:00Z" };
    },
    async getParticipants() { return [{ userId: "u_buyer", role: "buyer" }, { userId: "u_seller", role: "seller" }, { userId: "u_staff", role: "staff" }]; },
  };
  const notified: string[] = [];
  const r = await sendMessage(
    { conversationId: "c1", senderId: "u_buyer", senderRole: "buyer", body: "is it available?" },
    { adapter, notify: async (n) => { if (n.recipientUserId === "u_seller") throw new Error("blip"); notified.push(n.recipientUserId); } },
  );
  assert.equal(r.ok, true);
  assert.deepEqual(notified, ["u_staff"]); // u_seller threw but u_staff is still notified
});
