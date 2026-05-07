"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CheckCircle2, Info, MessageSquare, Sparkles, X } from "lucide-react";

type ToastTone = "info" | "success" | "message";

type Toast = {
  id: string;
  tone: ToastTone;
  title: string;
  body?: string;
  href?: string;
};

type ToastContextValue = {
  push: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function PortalToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const handle = timersRef.current.get(id);
    if (handle) {
      window.clearTimeout(handle);
      timersRef.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { ...toast, id }]);
      const handle = window.setTimeout(() => dismiss(id), 6000);
      timersRef.current.set(id, handle);
    },
    [dismiss]
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((handle) => window.clearTimeout(handle));
      timers.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="portal-toast-stack" role="region" aria-live="polite">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const Icon =
    toast.tone === "message" ? MessageSquare : toast.tone === "success" ? CheckCircle2 : Info;
  const accent =
    toast.tone === "success"
      ? "text-[#8de8b3]"
      : toast.tone === "message"
      ? "text-[var(--studio-signal)]"
      : "text-[#bcd6ff]";

  return (
    <div className="portal-toast">
      <div className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-full border border-[var(--studio-line-strong)] bg-[rgba(255,255,255,0.04)] ${accent}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-[var(--studio-ink)]">{toast.title}</div>
        {toast.body ? (
          <div className="mt-0.5 text-[12px] leading-5 text-[var(--studio-ink-soft)]">
            {toast.body}
          </div>
        ) : null}
        {toast.href ? (
          <a
            href={toast.href}
            className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--studio-signal)] hover:underline"
          >
            <Sparkles className="h-3 w-3" />
            View
          </a>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-full p-1 text-[var(--studio-ink-soft)] transition hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--studio-ink)]"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function usePortalToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      push: () => {
        // No-op when used outside provider — keeps server components safe.
      },
    } as ToastContextValue;
  }
  return ctx;
}
