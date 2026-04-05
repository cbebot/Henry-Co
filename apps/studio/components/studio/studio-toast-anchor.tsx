"use client";

import { CheckCircle2, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";

const TOAST_COPY: Record<string, { title: string; body: string }> = {
  brief_submitted: {
    title: "Brief received",
    body: "Your Studio record is open. Complete any deposit step below so we can start calmly and on schedule.",
  },
  proof_uploaded: {
    title: "Proof uploaded",
    body: "Finance will verify your transfer. You will see the workspace update as soon as it is confirmed.",
  },
  proof_required: {
    title: "Add a proof file",
    body: "Choose a screenshot, PDF, or receipt showing the transfer, then try again.",
  },
  message_sent: {
    title: "Message sent",
    body: "Your project thread is updated. We will reply from this same workspace.",
  },
  update_logged: {
    title: "Update saved",
    body: "The project log now includes this note.",
  },
  revision_logged: {
    title: "Revision recorded",
    body: "The team will track this as a formal delivery item.",
  },
  review_published: {
    title: "Thank you",
    body: "Your review is published and helps other buyers choose with confidence.",
  },
  deliverable_shared: {
    title: "Delivery shared",
    body: "Files are attached to this project for the client to review.",
  },
  milestone_advanced: {
    title: "Milestone updated",
    body: "Project status has moved forward.",
  },
  payment_marked: {
    title: "Payment status saved",
    body: "The workspace reflects this change.",
  },
};

export function StudioToastAnchor() {
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
    const t = window.setTimeout(() => stripToastFromUrl(), 7000);
    return () => window.clearTimeout(t);
  }, [copy, stripToastFromUrl]);

  if (!copy) return null;

  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-[100] w-[min(100%-2rem,28rem)] -translate-x-1/2"
    >
      <div className="rounded-[1.35rem] border border-[rgba(151,244,243,0.35)] bg-[linear-gradient(180deg,rgba(11,42,52,0.97),rgba(6,18,26,0.99))] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
        <div className="flex gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--studio-signal)]" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-[var(--studio-ink)]">{copy.title}</div>
            <p className="mt-1 text-sm leading-6 text-[var(--studio-ink-soft)]">{copy.body}</p>
          </div>
          <button
            type="button"
            onClick={() => stripToastFromUrl()}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--studio-line)] text-[var(--studio-ink-soft)] transition hover:text-[var(--studio-ink)]"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
