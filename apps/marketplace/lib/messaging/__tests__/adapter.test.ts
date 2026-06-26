import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendMessage } from "@henryco/messaging/server";
import { createMarketplaceMessagingAdapter } from "../adapter";

// These tests drive the REAL @henryco/messaging/server `sendMessage` pipeline
// through the marketplace adapter, against a tiny fake service-role client. They
// prove the spine contract end-to-end: block-before-persist (both directions),
// mask-medium-then-persist, and notify-by-stable-userId (sender filtered out).

const CONVO_ID = "conv-1";
const VENDOR_ID = "vendor-1";
const BUYER = "user-buyer";
const VENDOR_MEMBER = "user-vendor";

type Insert = Record<string, unknown>;

function makeFakeAdmin(opts: {
  conversation: Record<string, unknown> | null;
  vendorMembers: Array<{ user_id: string | null }>;
  inserted: Insert[];
}): SupabaseClient {
  const api = {
    from(table: string) {
      const builder: Record<string, unknown> = {
        _insert: null as Insert | null,
        insert(payload: Insert) {
          (builder._insert as Insert | null) = payload;
          if (table === "marketplace_conversation_messages") opts.inserted.push(payload);
          return builder;
        },
        select() {
          return builder;
        },
        eq() {
          return builder;
        },
        order() {
          return builder;
        },
        maybeSingle() {
          if (table === "marketplace_conversations") {
            return Promise.resolve({ data: opts.conversation, error: null });
          }
          return Promise.resolve({ data: null, error: null });
        },
        single() {
          if (table === "marketplace_conversation_messages") {
            const ins = (builder._insert as Insert) || {};
            return Promise.resolve({
              data: {
                id: `msg-${opts.inserted.length}`,
                conversation_id: ins.conversation_id,
                sender_kind: ins.sender_kind,
                sender_user_id: ins.sender_user_id,
                body: ins.body,
                created_at: new Date().toISOString(),
              },
              error: null,
            });
          }
          return Promise.resolve({ data: null, error: null });
        },
        // Thenable so `await admin.from(...).select().eq()...` (the membership
        // list query, which ends without maybeSingle) resolves to rows.
        then(resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) {
          const data = table === "marketplace_role_memberships" ? opts.vendorMembers : [];
          return Promise.resolve({ data, error: null }).then(resolve, reject);
        },
      };
      return builder;
    },
  };
  return api as unknown as SupabaseClient;
}

function setup() {
  const inserted: Insert[] = [];
  const notified: { recipientUserId: string; conversationId: string }[] = [];
  const admin = makeFakeAdmin({
    conversation: { buyer_user_id: BUYER, vendor_id: VENDOR_ID },
    vendorMembers: [{ user_id: VENDOR_MEMBER }],
    inserted,
  });
  const adapter = createMarketplaceMessagingAdapter(admin);
  const notify = async (n: { recipientUserId: string; conversationId: string }) => {
    notified.push(n);
  };
  return { inserted, notified, adapter, notify };
}

test("clean buyer message persists and notifies the vendor, never the sender", async () => {
  const { inserted, notified, adapter, notify } = setup();
  const result = await sendMessage(
    { conversationId: CONVO_ID, senderId: BUYER, senderRole: "buyer", body: "Is this still available?" },
    { adapter, notify },
  );
  assert.equal(result.ok, true);
  assert.equal(inserted.length, 1);
  assert.equal(inserted[0].sender_kind, "buyer");
  assert.equal(inserted[0].sender_user_id, BUYER);
  assert.equal(inserted[0].body, "Is this still available?");
  assert.deepEqual(notified.map((n) => n.recipientUserId), [VENDOR_MEMBER]);
});

test("blocked contact (phone) is never persisted — both directions", async () => {
  for (const sender of [
    { id: BUYER, role: "buyer" as const },
    { id: VENDOR_MEMBER, role: "vendor" as const },
  ]) {
    const { inserted, notified, adapter, notify } = setup();
    const result = await sendMessage(
      { conversationId: CONVO_ID, senderId: sender.id, senderRole: sender.role, body: "call me 0801 234 5678" },
      { adapter, notify },
    );
    assert.equal(result.ok, false);
    assert.equal(inserted.length, 0);
    assert.equal(notified.length, 0);
  }
});

test("medium contact (handle) is masked, then persisted", async () => {
  const { inserted, adapter, notify } = setup();
  const result = await sendMessage(
    { conversationId: CONVO_ID, senderId: BUYER, senderRole: "buyer", body: "ping me @janestore" },
    { adapter, notify },
  );
  assert.equal(result.ok, true);
  assert.equal(inserted.length, 1);
  assert.notEqual(inserted[0].body, "ping me @janestore");
  assert.match(String(inserted[0].body), /@\*\*\*/);
});

test("vendor message notifies the buyer (direction-agnostic notify)", async () => {
  const { notified, adapter, notify } = setup();
  const result = await sendMessage(
    { conversationId: CONVO_ID, senderId: VENDOR_MEMBER, senderRole: "vendor", body: "Yes, in stock!" },
    { adapter, notify },
  );
  assert.equal(result.ok, true);
  assert.deepEqual(notified.map((n) => n.recipientUserId), [BUYER]);
});
