"use client";

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import type { ComposerLabels, ComposerTone } from "../types";

export type ChatComposerSurfaceConfig = {
  tone: ComposerTone;
  labels: ComposerLabels;
};

const ChatComposerSurfaceContext = createContext<ChatComposerSurfaceConfig | null>(
  null
);

export type ChatComposerProviderProps = {
  tone?: ComposerTone;
  labels?: ComposerLabels;
  children: ReactNode;
};

export function ChatComposerProvider({
  tone = "neutral",
  labels,
  children,
}: ChatComposerProviderProps) {
  const value = useMemo<ChatComposerSurfaceConfig>(
    () => ({ tone, labels: labels || {} }),
    [tone, labels]
  );
  return (
    <ChatComposerSurfaceContext.Provider value={value}>
      {children}
    </ChatComposerSurfaceContext.Provider>
  );
}

export function useChatComposerSurface(): ChatComposerSurfaceConfig | null {
  return useContext(ChatComposerSurfaceContext);
}
