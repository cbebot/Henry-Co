"use client";

/**
 * PaletteOpenProvider — client context that exposes `openPalette()`
 * to descendants. Wraps `<DashboardCommandPalette>` with a
 * controller ref so any descendant client component (including the
 * IdentityBar's search button) can trigger open.
 *
 * The provider also dispatches `PALETTE_CLEAR_RECENTS_EVENT` when
 * `clearRecents()` is called — used by the layout's signOut action
 * client-side bridge.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DashboardCommandPalette,
  PALETTE_CLEAR_RECENTS_EVENT,
  clearRecents,
  type DashboardCommandPaletteController,
  type ModuleJumpEntry,
} from "@henryco/search-ui";

interface PaletteContextValue {
  open: () => void;
  close: () => void;
  toggle: () => void;
  clearRecentsForViewer: () => void;
  ready: boolean;
}

const PaletteContext = createContext<PaletteContextValue | null>(null);

export function usePaletteOpen(): PaletteContextValue {
  const ctx = useContext(PaletteContext);
  if (!ctx) {
    // Failing soft — buttons that try to open the palette before
    // the provider is mounted simply no-op. Keeps the IdentityBar
    // safe in code paths where the host hasn't rendered yet.
    return {
      open: () => undefined,
      close: () => undefined,
      toggle: () => undefined,
      clearRecentsForViewer: () => undefined,
      ready: false,
    };
  }
  return ctx;
}

export interface PaletteOpenProviderProps {
  userId: string | null;
  moduleJumpEntries?: ReadonlyArray<ModuleJumpEntry>;
  children: ReactNode;
}

export default function PaletteOpenProvider({
  userId,
  moduleJumpEntries,
  children,
}: PaletteOpenProviderProps) {
  const controllerRef = useRef<DashboardCommandPaletteController>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const open = useCallback(() => controllerRef.current?.open(), []);
  const close = useCallback(() => controllerRef.current?.close(), []);
  const toggle = useCallback(() => controllerRef.current?.toggle(), []);

  const clearRecentsForViewer = useCallback(() => {
    clearRecents(userId);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(PALETTE_CLEAR_RECENTS_EVENT));
    }
  }, [userId]);

  const value = useMemo<PaletteContextValue>(
    () => ({ open, close, toggle, clearRecentsForViewer, ready }),
    [open, close, toggle, clearRecentsForViewer, ready],
  );

  return (
    <PaletteContext.Provider value={value}>
      {children}
      <DashboardCommandPalette
        ref={controllerRef}
        userId={userId}
        moduleJumpEntries={moduleJumpEntries}
      />
    </PaletteContext.Provider>
  );
}
