"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThreadFontSize = "sm" | "md" | "lg";
export type ThreadDensity = "comfortable" | "compact";
export type ThreadSurfaceTone = "default" | "soft" | "warm" | "cool";

export type ThreadAppearance = {
  fontSize: ThreadFontSize;
  density: ThreadDensity;
  surfaceTone: ThreadSurfaceTone;
};

const DEFAULT_APPEARANCE: ThreadAppearance = {
  fontSize: "md",
  density: "comfortable",
  surfaceTone: "default",
};

const STORAGE_KEY = "henryco:thread-appearance";

type ThreadAppearanceContextValue = ThreadAppearance & {
  setFontSize: (value: ThreadFontSize) => void;
  setDensity: (value: ThreadDensity) => void;
  setSurfaceTone: (value: ThreadSurfaceTone) => void;
  reset: () => void;
};

const ThreadAppearanceContext = createContext<ThreadAppearanceContextValue | null>(
  null,
);

/** Per-user persisted thread display preferences, stored in localStorage
 * under a single namespaced key so the same preferences apply to every
 * support thread the user opens. SSR-safe — the provider reads from
 * storage in a layout effect so the first paint matches whatever the
 * server rendered.
 *
 * Wrap both the thread header (which renders the customization popover)
 * and the MessageThread surface (which applies the resulting tokens) in
 * a single provider so they share state. */
export function ThreadAppearanceProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearance] = useState<ThreadAppearance>(DEFAULT_APPEARANCE);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<ThreadAppearance> | null;
      if (!parsed || typeof parsed !== "object") return;
      setAppearance((prev) => ({
        fontSize: normalizeFontSize(parsed.fontSize) ?? prev.fontSize,
        density: normalizeDensity(parsed.density) ?? prev.density,
        surfaceTone: normalizeSurfaceTone(parsed.surfaceTone) ?? prev.surfaceTone,
      }));
    } catch {
      // Bad JSON — keep defaults.
    }
  }, []);

  const persist = useCallback((next: ThreadAppearance) => {
    setAppearance(next);
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage full / disabled — preference is still live in-session.
    }
  }, []);

  const value = useMemo<ThreadAppearanceContextValue>(
    () => ({
      ...appearance,
      setFontSize: (fontSize) => persist({ ...appearance, fontSize }),
      setDensity: (density) => persist({ ...appearance, density }),
      setSurfaceTone: (surfaceTone) => persist({ ...appearance, surfaceTone }),
      reset: () => persist(DEFAULT_APPEARANCE),
    }),
    [appearance, persist],
  );

  return (
    <ThreadAppearanceContext.Provider value={value}>
      {children}
    </ThreadAppearanceContext.Provider>
  );
}

export function useThreadAppearance(): ThreadAppearanceContextValue {
  const ctx = useContext(ThreadAppearanceContext);
  if (ctx) return ctx;
  // Outside a provider — return defaults + no-op setters so consumers
  // can render in isolation (eg. inside a styleguide / test harness)
  // without crashing.
  return {
    ...DEFAULT_APPEARANCE,
    setFontSize: () => undefined,
    setDensity: () => undefined,
    setSurfaceTone: () => undefined,
    reset: () => undefined,
  };
}

function normalizeFontSize(value: unknown): ThreadFontSize | null {
  return value === "sm" || value === "md" || value === "lg" ? value : null;
}
function normalizeDensity(value: unknown): ThreadDensity | null {
  return value === "compact" || value === "comfortable" ? value : null;
}
function normalizeSurfaceTone(value: unknown): ThreadSurfaceTone | null {
  return value === "default" ||
    value === "soft" ||
    value === "warm" ||
    value === "cool"
    ? value
    : null;
}
