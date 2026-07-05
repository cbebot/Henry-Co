// Multi-brief conversation store for the "Talk it through" copilot — pure
// (no React/DOM imports) so every transition is unit-testable. The client
// persists ONE draft envelope (key "studio-copilot-chats") holding every
// conversation, WhatsApp-style: each brief is its own thread, headed by the
// buyer's own words (the first user message).

import type { BriefChatMessage } from "@/lib/studio/brief-chat";

export const BRIEF_STORE_KEY = "studio-copilot-chats";
export const BRIEF_STORE_VERSION = 1;

/** Local-storage hygiene cap — oldest non-active conversations are pruned. */
export const MAX_STORED_CONVERSATIONS = 30;

const TITLE_MAX_CHARS = 60;

export type StoredBriefChat = {
  id: string;
  /** The brief itself — first user message, collapsed + clamped. */
  title: string;
  messages: BriefChatMessage[];
  createdAt: number;
  updatedAt: number;
  /** Model declared the brief complete. */
  ready: boolean;
  /** Last model-reported completeness (0-100). */
  progress: number;
  /**
   * Discovery areas landed so far (validated coach tokens) — drives the ✓/pending
   * checklist. Optional so drafts stored before this field existed load unchanged.
   */
  covered?: string[];
  /** Set when the conversation was handed off to /request/build. */
  finalizedAt: number | null;
};

export type BriefChatStore = {
  conversations: StoredBriefChat[];
  activeId: string | null;
};

export function emptyBriefStore(): BriefChatStore {
  return { conversations: [], activeId: null };
}

export function getActiveConversation(store: BriefChatStore): StoredBriefChat | null {
  if (!store.activeId) return null;
  return store.conversations.find((c) => c.id === store.activeId) ?? null;
}

export function sortedConversations(store: BriefChatStore): StoredBriefChat[] {
  return [...store.conversations].sort((a, b) => b.updatedAt - a.updatedAt);
}

/** First user message, whitespace-collapsed and clamped, as the heading. */
export function deriveBriefTitle(messages: BriefChatMessage[]): string {
  const first = messages.find((m) => m.role === "user")?.content ?? "";
  const collapsed = first.replace(/\s+/g, " ").trim();
  if (collapsed.length <= TITLE_MAX_CHARS) return collapsed;
  return `${collapsed.slice(0, TITLE_MAX_CHARS).trimEnd()}…`;
}

const makeId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `brief-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

function prune(store: BriefChatStore): BriefChatStore {
  if (store.conversations.length <= MAX_STORED_CONVERSATIONS) return store;
  const keep = new Set(
    sortedConversations(store)
      .slice(0, MAX_STORED_CONVERSATIONS)
      .map((c) => c.id),
  );
  if (store.activeId) keep.add(store.activeId);
  const conversations = store.conversations.filter((c) => keep.has(c.id));
  // If keeping the active pushed us over, drop the oldest non-active.
  while (conversations.length > MAX_STORED_CONVERSATIONS) {
    const oldest = [...conversations]
      .filter((c) => c.id !== store.activeId)
      .sort((a, b) => a.updatedAt - b.updatedAt)[0];
    if (!oldest) break;
    conversations.splice(conversations.indexOf(oldest), 1);
  }
  return { ...store, conversations };
}

/**
 * Start (and activate) a new brief. If the active conversation is still
 * empty, it is reused — tapping "New brief" repeatedly never farms empty
 * threads.
 */
export function createConversation(
  store: BriefChatStore,
  opts: { now: number },
): { store: BriefChatStore; id: string } {
  const active = getActiveConversation(store);
  if (active && active.messages.length === 0) {
    return { store, id: active.id };
  }
  const id = makeId();
  const conversation: StoredBriefChat = {
    id,
    title: "",
    messages: [],
    createdAt: opts.now,
    updatedAt: opts.now,
    ready: false,
    progress: 0,
    finalizedAt: null,
  };
  return {
    store: prune({
      conversations: [...store.conversations, conversation],
      activeId: id,
    }),
    id,
  };
}

export function setActiveConversation(
  store: BriefChatStore,
  id: string | null,
): BriefChatStore {
  if (id !== null && !store.conversations.some((c) => c.id === id)) return store;
  if (store.activeId === id) return store;
  return { ...store, activeId: id };
}

export function updateConversation(
  store: BriefChatStore,
  id: string,
  patch: {
    messages?: BriefChatMessage[];
    ready?: boolean;
    progress?: number;
    covered?: string[];
    finalizedAt?: number | null;
    now: number;
  },
): BriefChatStore {
  const conversations = store.conversations.map((c) => {
    if (c.id !== id) return c;
    const messages = patch.messages ?? c.messages;
    return {
      ...c,
      messages,
      title: deriveBriefTitle(messages) || c.title,
      ready: patch.ready ?? c.ready,
      progress: patch.progress ?? c.progress,
      covered: patch.covered ?? c.covered,
      finalizedAt: patch.finalizedAt !== undefined ? patch.finalizedAt : c.finalizedAt,
      updatedAt: patch.now,
    };
  });
  return { ...store, conversations };
}

export function deleteConversation(store: BriefChatStore, id: string): BriefChatStore {
  const conversations = store.conversations.filter((c) => c.id !== id);
  const activeId =
    store.activeId === id
      ? (sortedConversations({ conversations, activeId: null })[0]?.id ?? null)
      : store.activeId;
  return { conversations, activeId };
}

/**
 * One-time upgrade from the single-transcript era (draft key
 * "studio-copilot-chat" v1): an in-flight brief becomes the first
 * conversation. Returns null when there is nothing to migrate — including
 * when the new store already has content (never migrate twice).
 */
export function migrateLegacyTranscript(
  store: BriefChatStore,
  legacyMessages: BriefChatMessage[] | null | undefined,
  opts: { now: number },
): BriefChatStore | null {
  if (!legacyMessages || legacyMessages.length === 0) return null;
  if (store.conversations.length > 0) return null;
  const id = makeId();
  const conversation: StoredBriefChat = {
    id,
    title: deriveBriefTitle(legacyMessages),
    messages: legacyMessages,
    createdAt: opts.now,
    updatedAt: opts.now,
    ready: false,
    progress: 0,
    finalizedAt: null,
  };
  return { conversations: [conversation], activeId: id };
}
