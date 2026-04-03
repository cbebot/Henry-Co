"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Check, CheckCircle2, Copy } from "lucide-react";
import { emitCareToast } from "@/components/feedback/CareToaster";

type BookingSuccessNoticeProps = {
  tracking: string;
};

function buildTrackingHref(tracking: string) {
  return `/track?code=${encodeURIComponent(tracking)}`;
}

export default function BookingSuccessNotice({
  tracking,
}: BookingSuccessNoticeProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  async function copyTrackingCode() {
    if (!tracking || typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      setCopyState("error");
      emitCareToast({
        tone: "error",
        title: "Clipboard copy is not available here",
        description: "Use the tracking code card to copy it manually on a supported browser.",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(tracking);
      setCopyState("copied");
      emitCareToast({
        tone: "success",
        title: "Tracking code copied",
        description: "You can paste it into tracking, support, or any payment follow-up.",
      });
    } catch {
      setCopyState("error");
      emitCareToast({
        tone: "error",
        title: "Tracking code copy failed",
        description: "Clipboard access was blocked on this device.",
      });
    }
  }

  useEffect(() => {
    let active = true;

    async function bootstrapCopy() {
      if (!tracking || typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
        return;
      }

      try {
        await navigator.clipboard.writeText(tracking);
        if (active) {
          setCopyState("copied");
          emitCareToast({
            tone: "success",
            title: "Tracking code copied automatically",
            description: "Your booking reference is ready to paste if you need it right away.",
          });
        }
      } catch {
        if (active) setCopyState("error");
      }
    }

    void bootstrapCopy();

    return () => {
      active = false;
    };
  }, [tracking]);

  return (
    <div className="mt-4 rounded-[26px] border border-[color:var(--accent)]/25 bg-[color:var(--accent)]/10 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
            Tracking code
          </div>
          <div className="mt-3 break-all text-2xl font-black tracking-[0.08em] text-zinc-950 dark:text-white sm:text-3xl">
            {tracking}
          </div>
          <div className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/65">
            Keep this code for tracking, payment follow-up, and support. If you added an email
            address while booking, the same reference is included in your confirmation message.
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-100">
          <CheckCircle2 className="h-4 w-4" />
          Request received
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            void copyTrackingCode();
          }}
          className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-[color:var(--accent)]/40 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
        >
          {copyState === "copied" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-[color:var(--accent)]" />}
          {copyState === "copied" ? "Copied to clipboard" : "Copy tracking code"}
        </button>

        <Link
          href={buildTrackingHref(tracking)}
          className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-[color:var(--accent)]/40 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
        >
          Open tracking
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-3 text-xs text-zinc-500 dark:text-white/52">
        {copyState === "copied"
          ? "The tracking code was copied automatically on supported browsers."
          : copyState === "error"
          ? "Automatic copy was blocked on this device. Use the button above to copy it manually."
          : "Automatic copy runs once when this confirmation appears."}
      </div>
    </div>
  );
}
