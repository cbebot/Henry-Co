"use client";

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
import { cn } from "../lib/cn";

export type PublicToastTone = "info" | "success" | "warning" | "error" | "accent";

export type PublicToastInput = {
  id?: string;
  title?: ReactNode;
  description?: ReactNode;
  tone?: PublicToastTone;
  /** When provided, renders an action pill on the right side of the toast. */
  action?: { label: string; onClick: () => void } | null;
  /** Milliseconds before auto-dismiss. `null` keeps it until user dismisses. Default 5000. */
  durationMs?: number | null;
};

type PublicToastEntry = Required<Omit<PublicToastInput, "durationMs" | "action" | "tone">> & {
  tone: PublicToastTone;
  action: PublicToastInput["action"];
  durationMs: number | null;
};

type PublicToastContext = {
  show: (input: PublicToastInput) => string;
  dismiss: (id: string) => void;
  clear: () => void;
};

const PublicToastCtx = createContext<PublicToastContext | null>(null);

/** Hook — always safe to call in a tree wrapped by `PublicToastProvider`. */
export function usePublicToast(): PublicToastContext {
  const ctx = useContext(PublicToastCtx);
  if (!ctx) {
    // Return no-op so pages don't crash if a division forgets to mount the provider.
    return {
      show: () => "",
      dismiss: () => {},
      clear: () => {},
    };
  }
  return ctx;
}

/**
 * Global public toast provider.
 *
 * Renders an accessible polite region in the top-right on desktop and the
 * top-center on mobile, honouring iPhone / Android safe areas. Uses amber brand
 * accent for generic notices, semantic colours only when truly semantic.
 */
export function PublicToastProvider({
  children,
  placement = "auto",
  maxVisible = 4,
  toneDefault = "accent",
}: {
  children: ReactNode;
  /** `auto` = top-right desktop / top-center mobile. */
  placement?: "auto" | "top-right" | "top-center" | "bottom-right" | "bottom-center";
  maxVisible?: number;
  toneDefault?: PublicToastTone;
}) {
  const [items, setItems] = useState<PublicToastEntry[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
    const handle = timers.current.get(id);
    if (handle) {
      clearTimeout(handle);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (input: PublicToastInput): string => {
      const id =
        input.id ??
        (typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
      const entry: PublicToastEntry = {
        id,
        title: input.title ?? "",
        description: input.description ?? "",
        tone: input.tone ?? toneDefault,
        action: input.action ?? null,
        durationMs: input.durationMs === null ? null : input.durationMs ?? 5000,
      };
      setItems((prev) => {
        const next = [...prev, entry];
        if (next.length > maxVisible) next.splice(0, next.length - maxVisible);
        return next;
      });
      if (entry.durationMs !== null && entry.durationMs > 0) {
        const handle = setTimeout(() => dismiss(id), entry.durationMs);
        timers.current.set(id, handle);
      }
      return id;
    },
    [dismiss, maxVisible, toneDefault]
  );

  const clear = useCallback(() => {
    timers.current.forEach((handle) => clearTimeout(handle));
    timers.current.clear();
    setItems([]);
  }, []);

  useEffect(() => {
    return () => {
      timers.current.forEach((handle) => clearTimeout(handle));
      timers.current.clear();
    };
  }, []);

  const value = useMemo<PublicToastContext>(
    () => ({ show, dismiss, clear }),
    [show, dismiss, clear]
  );

  const positionClass =
    placement === "top-right"
      ? "top-[max(env(safe-area-inset-top,0px),0.75rem)] right-[max(env(safe-area-inset-right,0px),0.75rem)] items-end"
      : placement === "top-center"
        ? "top-[max(env(safe-area-inset-top,0px),0.75rem)] left-1/2 -translate-x-1/2 items-center"
        : placement === "bottom-right"
          ? "bottom-[max(env(safe-area-inset-bottom,0px),1rem)] right-[max(env(safe-area-inset-right,0px),1rem)] items-end"
          : placement === "bottom-center"
            ? "bottom-[max(env(safe-area-inset-bottom,0px),1rem)] left-1/2 -translate-x-1/2 items-center"
            : // auto: top-right on sm+, top-center on mobile
              "top-[max(env(safe-area-inset-top,0px),0.75rem)] left-1/2 -translate-x-1/2 items-center sm:left-auto sm:right-[max(env(safe-area-inset-right,0px),0.75rem)] sm:translate-x-0 sm:items-end";

  return (
    <PublicToastCtx.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className={cn(
          "pointer-events-none fixed z-[120] flex w-[min(26rem,calc(100vw-1.5rem))] flex-col gap-2 sm:w-[22rem]",
          positionClass
        )}
      >
        {items.map((toast) => (
          <PublicToastCard key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </PublicToastCtx.Provider>
  );
}

const TONE_STYLE: Record<PublicToastTone, string> = {
  info:
    "border-sky-200/60 bg-white/96 text-zinc-900 shadow-[0_22px_60px_-30px_rgba(15,23,42,0.42)] dark:border-sky-500/25 dark:bg-[#0b1018]/95 dark:text-white",
  success:
    "border-emerald-300/60 bg-white/96 text-zinc-900 shadow-[0_22px_60px_-30px_rgba(16,140,77,0.32)] dark:border-emerald-400/25 dark:bg-[#0b1018]/95 dark:text-white",
  warning:
    "border-amber-300/70 bg-white/96 text-zinc-900 shadow-[0_22px_60px_-30px_rgba(180,120,20,0.32)] dark:border-amber-400/30 dark:bg-[#0b1018]/95 dark:text-white",
  error:
    "border-rose-300/60 bg-white/96 text-zinc-900 shadow-[0_22px_60px_-30px_rgba(200,50,40,0.32)] dark:border-rose-400/30 dark:bg-[#0b1018]/95 dark:text-white",
  accent:
    "border-amber-300/60 bg-white/96 text-zinc-900 shadow-[0_22px_60px_-30px_rgba(201,162,39,0.36)] dark:border-amber-400/25 dark:bg-[#0b1018]/95 dark:text-white",
};

const TONE_MARK: Record<PublicToastTone, string> = {
  info: "bg-sky-500/90 dark:bg-sky-400/90",
  success: "bg-emerald-500/90 dark:bg-emerald-400/90",
  warning: "bg-amber-500/95 dark:bg-amber-400/90",
  error: "bg-rose-500/90 dark:bg-rose-400/90",
  accent: "bg-amber-500/95 dark:bg-amber-300/90",
};

function PublicToastCard({
  toast,
  onDismiss,
}: {
  toast: PublicToastEntry;
  onDismiss: () => void;
}) {
  return (
    <div
      role={toast.tone === "error" ? "alert" : "status"}
      className={cn(
        "pointer-events-auto relative flex gap-3 overflow-hidden rounded-2xl border px-4 py-3 pr-10 backdrop-blur-xl",
        TONE_STYLE[toast.tone]
      )}
    >
      <span
        aria-hidden
        className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", TONE_MARK[toast.tone])}
      />
      <div className="min-w-0 flex-1">
        {toast.title ? (
          <p className="truncate text-sm font-semibold tracking-[-0.01em]">{toast.title}</p>
        ) : null}
        {toast.description ? (
          <p className="mt-0.5 text-sm leading-6 text-zinc-600 dark:text-white/70">
            {toast.description}
          </p>
        ) : null}
        {toast.action ? (
          <div className="mt-2 flex">
            <button
              type="button"
              onClick={() => {
                toast.action?.onClick();
                onDismiss();
              }}
              className="rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-500/25 dark:border-amber-400/30 dark:text-amber-200"
            >
              {toast.action.label}
            </button>
          </div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-zinc-500 transition hover:bg-black/5 hover:text-zinc-900 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
      >
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
          <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

/** Convenience helpers so callers don't have to spread `tone: "success"` themselves. */
export function makePublicToastApi(show: PublicToastContext["show"]) {
  return {
    info: (input: Omit<PublicToastInput, "tone">) => show({ ...input, tone: "info" }),
    success: (input: Omit<PublicToastInput, "tone">) => show({ ...input, tone: "success" }),
    warning: (input: Omit<PublicToastInput, "tone">) => show({ ...input, tone: "warning" }),
    error: (input: Omit<PublicToastInput, "tone">) => show({ ...input, tone: "error" }),
    accent: (input: Omit<PublicToastInput, "tone">) => show({ ...input, tone: "accent" }),
  };
}
