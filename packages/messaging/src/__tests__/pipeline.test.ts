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
