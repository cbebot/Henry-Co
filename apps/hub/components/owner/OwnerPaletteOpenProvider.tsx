"use client";

/**
 * OwnerPaletteOpenProvider — V3 PASS 21 / H3.
 *
 * Owner-shell client context that exposes `openPalette()` to descendants.
 * Wraps `<DashboardCommandPalette>` with a controller ref so any
 * descendant client component (the OwnerSidebar / OwnerMobileNav search
 * button via OwnerPaletteBridge) can trigger the open without a
 * navigation.
 *
 * Mirrors `apps/account/.../PaletteOpenProvider.tsx` but scoped to the
 * owner shell. The recents-clear bridge dispatches
 * `PALETTE_CLEAR_RECENTS_EVENT` on sign-out so per-viewer recents stay
 * scoped to the active session.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
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
}

const PaletteContext = createContext<PaletteContextValue | null>(null);

export function useOwnerPaletteOpen(): PaletteContextValue {
  const ctx = useContext(PaletteContext);
  if (!ctx) {
    return {
      open: () => undefined,
      close: () => undefined,
      toggle: () => undefined,
      clearRecentsForViewer: () => undefined,
    };
  }
  return ctx;
}

export interface OwnerPaletteOpenProviderProps {
  userId: string | null;
  moduleJumpEntries?: ReadonlyArray<ModuleJumpEntry>;
  children: ReactNode;
}

export default function OwnerPaletteOpenProvider({
  userId,
  moduleJumpEntries,
  children,
}: OwnerPaletteOpenProviderProps) {
  const controllerRef = useRef<DashboardCommandPaletteController>(null);

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
    () => ({ open, close, toggle, clearRecentsForViewer }),
    [open, close, toggle, clearRecentsForViewer],
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
