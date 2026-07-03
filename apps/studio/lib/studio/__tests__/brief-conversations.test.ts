import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_STORED_CONVERSATIONS,
  createConversation,
  deleteConversation,
  deriveBriefTitle,
  emptyBriefStore,
  getActiveConversation,
  migrateLegacyTranscript,
  sortedConversations,
  updateConversation,
} from "../brief-conversations";
import type { BriefChatMessage } from "../brief-chat";

const user = (content: string): BriefChatMessage => ({ role: "user", content });
const assistant = (content: string): BriefChatMessage => ({ role: "assistant", content });

test("empty store has no conversations and no active id", () => {
  const store = emptyBriefStore();
  assert.deepEqual(store.conversations, []);
  assert.equal(store.activeId, null);
  assert.equal(getActiveConversation(store), null);
});

test("createConversation activates a fresh empty conversation", () => {
  const { store, id } = createConversation(emptyBriefStore(), { now: 1000 });
  assert.equal(store.activeId, id);
  const active = getActiveConversation(store);
  assert.ok(active);
  assert.deepEqual(active?.messages, []);
  assert.equal(active?.ready, false);
  assert.equal(active?.progress, 0);
  assert.equal(active?.createdAt, 1000);
});

test("createConversation reuses the active conversation when it is still empty", () => {
  const first = createConversation(emptyBriefStore(), { now: 1000 });
  const second = createConversation(first.store, { now: 2000 });
  assert.equal(second.id, first.id);
  assert.equal(second.store.conversations.length, 1);
});

test("updateConversation patches messages/progress and bumps updatedAt", () => {
  const { store, id } = createConversation(emptyBriefStore(), { now: 1000 });
  const next = updateConversation(store, id, {
    messages: [user("A logo for my bakery"), assistant("Great — what style?")],
    progress: 40,
    now: 5000,
  });
  const active = getActiveConversation(next);
  assert.equal(active?.messages.length, 2);
  assert.equal(active?.progress, 40);
  assert.equal(active?.updatedAt, 5000);
  assert.equal(active?.title, "A logo for my bakery");
});

test("title derives from the FIRST user message and clamps long text", () => {
  assert.equal(deriveBriefTitle([user("Short brief")]), "Short brief");
  const long = "x".repeat(100);
  const clamped = deriveBriefTitle([user(long)]);
  assert.ok(clamped.length <= 61); // 60 + ellipsis
  assert.ok(clamped.endsWith("…"));
  assert.equal(deriveBriefTitle([]), "");
  // whitespace collapses so multi-line briefs read as one heading
  assert.equal(deriveBriefTitle([user("a  b\n\nc")]), "a b c");
});

test("sortedConversations orders by updatedAt descending", () => {
  let { store, id: a } = createConversation(emptyBriefStore(), { now: 1000 });
  store = updateConversation(store, a, { messages: [user("first")], now: 1000 });
  const created = createConversation(store, { now: 2000 });
  store = updateConversation(created.store, created.id, {
    messages: [user("second")],
    now: 2000,
  });
  store = updateConversation(store, a, { messages: [user("first"), assistant("?")], now: 3000 });
  const titles = sortedConversations(store).map((c) => c.title);
  assert.deepEqual(titles, ["first", "second"]);
});

test("deleteConversation removes and repoints activeId", () => {
  let { store, id: a } = createConversation(emptyBriefStore(), { now: 1000 });
  store = updateConversation(store, a, { messages: [user("first")], now: 1000 });
  const created = createConversation(store, { now: 2000 });
  store = updateConversation(created.store, created.id, { messages: [user("second")], now: 2000 });
  store = deleteConversation(store, created.id);
  assert.equal(store.conversations.length, 1);
  assert.equal(store.activeId, a);
  store = deleteConversation(store, a);
  assert.equal(store.conversations.length, 0);
  assert.equal(store.activeId, null);
});

test("stores are pruned to the cap, dropping the OLDEST non-active conversations", () => {
  let store = emptyBriefStore();
  let lastId = "";
  for (let i = 0; i < MAX_STORED_CONVERSATIONS + 5; i += 1) {
    const created = createConversation(store, { now: i + 1 });
    store = updateConversation(created.store, created.id, {
      messages: [user(`brief ${i}`)],
      now: i + 1,
    });
    lastId = created.id;
  }
  assert.equal(store.conversations.length, MAX_STORED_CONVERSATIONS);
  assert.equal(store.activeId, lastId);
  // the newest survives, the oldest were dropped
  const titles = sortedConversations(store).map((c) => c.title);
  assert.equal(titles[0], `brief ${MAX_STORED_CONVERSATIONS + 4}`);
  assert.ok(!titles.includes("brief 0"));
});

test("legacy single-transcript migrates into a conversation once", () => {
  const legacy = [user("my old in-flight brief"), assistant("tell me more")];
  const migrated = migrateLegacyTranscript(emptyBriefStore(), legacy, { now: 9000 });
  assert.ok(migrated);
  assert.equal(migrated.conversations.length, 1);
  const active = getActiveConversation(migrated);
  assert.equal(active?.title, "my old in-flight brief");
  assert.equal(active?.messages.length, 2);
  // empty / no legacy → no store change
  assert.equal(migrateLegacyTranscript(emptyBriefStore(), [], { now: 1 }), null);
  // a store that already has content never migrates again
  assert.equal(migrateLegacyTranscript(migrated, legacy, { now: 2 }), null);
});
