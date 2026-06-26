import { test } from "node:test";
import assert from "node:assert/strict";
import type { Conversation, Message, Participant, ContextAnchor, DeliveryState } from "../types";

test("a Conversation value can be constructed with a typed anchor and participants", () => {
  const anchor: ContextAnchor = { type: "order", id: "ord_1", division: "marketplace" };
  const buyer: Participant = { userId: "u_buyer", role: "buyer", lastReadAt: null };
  const state: DeliveryState = "sent";
  const msg: Message = {
    id: "m_1", conversationId: "c_1", senderId: "u_buyer", senderRole: "buyer",
    body: "hello", attachments: [], deliveryState: state, createdAt: "2026-06-26T00:00:00Z",
  };
  const convo: Conversation = {
    id: "c_1", anchor, division: "marketplace", subject: null, status: "open",
    participants: [buyer], createdAt: "2026-06-26T00:00:00Z", updatedAt: "2026-06-26T00:00:00Z",
  };
  assert.equal(convo.anchor.type, "order");
  assert.equal(convo.participants[0].role, "buyer");
  assert.equal(msg.deliveryState, "sent");
});
