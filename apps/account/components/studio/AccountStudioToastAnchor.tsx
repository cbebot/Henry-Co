"use client";

import { CheckCircle2, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";

/** Same query key as HenryCo Studio so cross-app redirects can show confirmation. */
const TOAST_COPY: Record<string, { title: string; body: string }> = {
  proof_uploaded: {
    title: "Payment proof received",
    body: "Finance will verify your transfer. Your Studio area below updates automatically once payment is confirmed.",
  },
  proof_required: {
    title: "Add a proof file",
    body: "Choose a screenshot, PDF, or receipt that shows the transfer, then submit again from your Studio project room.",
  },
  brief_submitted: {
    title: "Studio brief received",
    body: "Your request is in the system. Complete any deposit step in Studio so the team can start on schedule.",
  },
};

export function AccountStudioToastAnchor() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const raw = searchParams.get("studioToast");
  const copy = raw && TOAST_COPY[raw] ? TOAST_COPY[raw] : null;

  const stripToastFromUrl = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("studioToast");
    const q = params.toString();
    const path = typeof window !== "undefined" ? `${window.location.pathname}${q ? `?${q}` : ""}` : "/";
    router.replace(path, { scroll: false });
  }, [router, searchParams]);

  useEffect(() => {
    if (!copy) return;
    const t = window.setTimeout(() => stripToastFromUrl(), 8000);
    return () => window.clearTimeout(t);
  }, [copy, stripToastFromUrl]);

  if (!copy) return null;

  return (
    <div
      role="status"
      className="pointer-events-none fixed bottom-6 left-1/2 z-[100] w-[min(100%-2rem,28rem)] -translate-x-1/2 px-0"
    >
      <div className="pointer-events-auto rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-4 shadow-[var(--acct-shadow-lg)]">
        <div className="flex gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--acct-green)]" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-[var(--acct-ink)]">{copy.title}</div>
            <p className="mt-1 text-sm leading-6 text-[var(--acct-muted)]">{copy.body}</p>
          </div>
          <button
            type="button"
            onClick={() => stripToastFromUrl()}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--acct-line)] text-[var(--acct-muted)] transition hover:text-[var(--acct-ink)]"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
