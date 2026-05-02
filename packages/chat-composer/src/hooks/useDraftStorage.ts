"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DB_NAME = "henryco-chat-drafts";
const DB_VERSION = 1;
const STORE_NAME = "drafts";
const PERSIST_DEBOUNCE_MS = 280;

type StoredDraft = {
  threadId: string;
  text: string;
  updatedAt: number;
};

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB unavailable"));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "threadId" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

async function readDraft(threadId: string): Promise<string> {
  try {
    const db = await openDb();
    return await new Promise<string>((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(threadId);
      request.onsuccess = () => {
        const stored = request.result as StoredDraft | undefined;
        resolve(stored?.text || "");
      };
      request.onerror = () => resolve("");
    });
  } catch {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem(legacyKey(threadId)) || "";
    }
    return "";
  }
}

async function writeDraft(threadId: string, text: string): Promise<void> {
  if (!text.trim()) {
    await deleteDraft(threadId);
    return;
  }
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put({
        threadId,
        text,
        updatedAt: Date.now(),
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  } catch {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(legacyKey(threadId), text);
      } catch {
        // storage quota — give up silently
      }
    }
  }
}

async function deleteDraft(threadId: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(threadId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  } catch {
    // ignore
  }
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.removeItem(legacyKey(threadId));
    } catch {
      // ignore
    }
  }
}

function legacyKey(threadId: string): string {
  return `henryco-chat-draft:${threadId}`;
}

export type DraftState = "idle" | "dirty" | "saving" | "saved";

export type UseDraftStorageResult = {
  hydrated: boolean;
  initialDraft: string;
  state: DraftState;
  persist: (text: string) => void;
  clear: () => Promise<void>;
};

export function useDraftStorage(
  threadId: string,
  enabled: boolean
): UseDraftStorageResult {
  const [hydrated, setHydrated] = useState(false);
  const [initialDraft, setInitialDraft] = useState("");
  const [state, setState] = useState<DraftState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    if (!enabled || !threadId) {
      setHydrated(true);
      return;
    }
    readDraft(threadId).then((stored) => {
      if (!alive) return;
      setInitialDraft(stored);
      setHydrated(true);
    });
    return () => {
      alive = false;
    };
  }, [threadId, enabled]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
    };
  }, []);

  const persist = useCallback(
    (text: string) => {
      if (!enabled || !threadId) return;
      setState("dirty");
      if (timer.current) clearTimeout(timer.current);
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
      timer.current = setTimeout(async () => {
        setState("saving");
        await writeDraft(threadId, text);
        setState("saved");
        fadeTimer.current = setTimeout(() => setState("idle"), 1600);
      }, PERSIST_DEBOUNCE_MS);
    },
    [threadId, enabled]
  );

  const clear = useCallback(async () => {
    if (!threadId) return;
    if (timer.current) clearTimeout(timer.current);
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
    setState("idle");
    await deleteDraft(threadId);
  }, [threadId]);

  return { hydrated, initialDraft, state, persist, clear };
}
