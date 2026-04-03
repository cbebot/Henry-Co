"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Mail, X, XCircle } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export type CareToastTone = "success" | "error" | "warning" | "info";

export type CareToastInput = {
  id?: string;
  tone: CareToastTone;
  title: string;
  description?: string | null;
  durationMs?: number;
};

type CareToastItem = CareToastInput & {
  id: string;
};

const TOAST_EVENT = "care:toast";
const URL_TOAST_KEYS = ["ok", "error", "warn", "message", "info"] as const;

function randomToastId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toneCopy(tone: CareToastTone) {
  if (tone === "success") {
    return {
      icon: CheckCircle2,
      shell:
        "border-emerald-300/35 bg-emerald-500/14 text-emerald-50 shadow-[0_18px_48px_rgba(16,185,129,0.18)]",
      iconWrap: "bg-emerald-400/16 text-emerald-200",
      rail: "from-emerald-300 via-emerald-400 to-emerald-200",
    };
  }

  if (tone === "error") {
    return {
      icon: XCircle,
      shell:
        "border-red-300/35 bg-red-500/14 text-red-50 shadow-[0_18px_48px_rgba(239,68,68,0.18)]",
      iconWrap: "bg-red-400/16 text-red-200",
      rail: "from-red-300 via-red-400 to-red-200",
    };
  }

  if (tone === "warning") {
    return {
      icon: AlertTriangle,
      shell:
        "border-amber-300/35 bg-amber-500/14 text-amber-50 shadow-[0_18px_48px_rgba(245,158,11,0.18)]",
      iconWrap: "bg-amber-400/16 text-amber-100",
      rail: "from-amber-300 via-amber-400 to-amber-200",
    };
  }

  return {
    icon: Mail,
    shell:
      "border-cyan-300/35 bg-cyan-500/14 text-cyan-50 shadow-[0_18px_48px_rgba(56,189,248,0.18)]",
    iconWrap: "bg-cyan-400/16 text-cyan-100",
    rail: "from-cyan-300 via-cyan-400 to-cyan-200",
  };
}

function decodeToastValue(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function toastFromUrl(
  key: (typeof URL_TOAST_KEYS)[number],
  value: string
): CareToastInput | null {
  const message = decodeToastValue(value);
  if (!message) return null;

  if (key === "ok") {
    return { tone: "success", title: message };
  }

  if (key === "error") {
    return { tone: "error", title: message };
  }

  if (key === "warn") {
    return { tone: "warning", title: message };
  }

  return { tone: "info", title: message };
}

export function emitCareToast(input: CareToastInput) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<CareToastInput>(TOAST_EVENT, {
      detail: input,
    })
  );
}

export default function CareToaster() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<CareToastItem[]>([]);
  const consumedUrlSignature = useRef<string>("");

  useEffect(() => {
    function onToast(event: Event) {
      const custom = event as CustomEvent<CareToastInput>;
      const next = custom.detail;
      if (!next?.title) return;

      const id = next.id || randomToastId();
      const durationMs = Math.max(2200, next.durationMs ?? 4600);

      setItems((current) => {
        const filtered = current.filter((item) => item.id !== id);
        return [...filtered, { ...next, id }];
      });

      window.setTimeout(() => {
        setItems((current) => current.filter((item) => item.id !== id));
      }, durationMs);
    }

    window.addEventListener(TOAST_EVENT, onToast as EventListener);

    return () => {
      window.removeEventListener(TOAST_EVENT, onToast as EventListener);
    };
  }, []);

  useEffect(() => {
    const signature = searchParams.toString();
    if (!signature || signature === consumedUrlSignature.current) return;

    const nextUrlParams = new URLSearchParams(signature);
    const toasts = URL_TOAST_KEYS.map((key) => {
      const value = nextUrlParams.get(key);
      if (!value) return null;
      nextUrlParams.delete(key);
      return toastFromUrl(key, value);
    }).filter(Boolean) as CareToastInput[];

    if (toasts.length === 0) return;

    consumedUrlSignature.current = signature;
    toasts.forEach((toast) => emitCareToast(toast));

    const nextQuery = nextUrlParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }, [pathname, router, searchParams]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[90] flex justify-end px-4 pt-4 sm:px-6 sm:pt-6">
      <div className="flex w-full max-w-md flex-col gap-3">
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const tone = toneCopy(item.tone);
            const Icon = tone.icon;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: -16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.96 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`pointer-events-auto relative overflow-hidden rounded-[1.6rem] border backdrop-blur-2xl ${tone.shell}`}
              >
                <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r opacity-80 ${tone.rail}`} />
                <div className="flex items-start gap-3 px-4 py-4 sm:px-5">
                  <div className={`mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${tone.iconWrap}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold tracking-[-0.01em] text-white">
                      {item.title}
                    </div>
                    {item.description ? (
                      <div className="mt-1 text-sm leading-6 text-white/72">
                        {item.description}
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setItems((current) => current.filter((entry) => entry.id !== item.id))
                    }
                    className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-white/68 transition hover:bg-white/[0.10] hover:text-white"
                    aria-label="Dismiss notification"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
