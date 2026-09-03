import { test } from "node:test";
import assert from "node:assert/strict";
import type { MessagingAdapter, PersistInput } from "../adapter";

test("an adapter implementation satisfies the interface shape", async () => {
  const fake: MessagingAdapter = {
    async persistMessage(i: PersistInput) {
      return {
        id: "m1", conversationId: i.conversationId, senderId: i.senderId, senderRole: i.senderRole,
        body: i.body, attachments: i.attachments, deliveryState: "sent" as const, createdAt: "2026-06-26T00:00:00Z",
      };
    },
    async getParticipants() { return [{ userId: "u_seller", role: "seller" }]; },
  };
  const m = await fake.persistMessage({ conversationId: "c1", senderId: "u", senderRole: "buyer", body: "hi", attachments: [], safetySeverity: "low" });
  assert.equal(m.conversationId, "c1");
});
