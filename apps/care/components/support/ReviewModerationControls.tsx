"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Clock3, Loader2, ShieldX } from "lucide-react";
import { useRouter } from "next/navigation";
import { moderateReviewAction } from "@/app/(staff)/support/actions";
import { emitCareToast } from "@/components/feedback/CareToaster";

type ReviewModerationControlsProps = {
  reviewId: string;
  initialNote?: string | null;
};

function buttonCls(variant: "primary" | "secondary" | "danger" = "primary") {
  if (variant === "secondary") {
    return "inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[0.05] dark:text-white disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60";
  }

  if (variant === "danger") {
    return "inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-700 shadow-sm transition hover:-translate-y-0.5 dark:text-red-100 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60";
  }

  return "care-button-primary inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60";
}

const textareaCls =
  "rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-zinc-900 outline-none transition focus:border-[color:var(--accent)]/40 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white";

export default function ReviewModerationControls({
  reviewId,
  initialNote,
}: ReviewModerationControlsProps) {
  const router = useRouter();
  const [moderationNote, setModerationNote] = useState(initialNote || "");
  const [pendingDecision, setPendingDecision] = useState<
    "approve" | "reject" | "pending" | null
  >(null);
  const [pending, startTransition] = useTransition();

  function submit(decision: "approve" | "reject" | "pending") {
    setPendingDecision(decision);
    startTransition(async () => {
      const result = await moderateReviewAction({
        reviewId,
        decision,
        moderationNote,
      });

      emitCareToast({
        tone:
          result.tone === "warning"
            ? "warning"
            : result.tone === "success"
              ? "success"
              : "error",
        title: result.message,
      });

      if (result.ok) {
        router.refresh();
      }

      setPendingDecision(null);
    });
  }

  return (
    <div className="mt-6 grid gap-4">
      <textarea
        value={moderationNote}
        onChange={(event) => setModerationNote(event.target.value)}
        rows={5}
        placeholder="Add moderation guidance, a rejection reason, or an internal note for the review record."
        className={textareaCls}
      />

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          className={buttonCls()}
          onClick={() => submit("approve")}
        >
          {pendingDecision === "approve" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          {pendingDecision === "approve" ? "Approving..." : "Approve review"}
        </button>

        <button
          type="button"
          disabled={pending}
          className={buttonCls("danger")}
          onClick={() => submit("reject")}
        >
          {pendingDecision === "reject" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldX className="h-4 w-4" />
          )}
          {pendingDecision === "reject" ? "Rejecting..." : "Reject review"}
        </button>

        <button
          type="button"
          disabled={pending}
          className={buttonCls("secondary")}
          onClick={() => submit("pending")}
        >
          {pendingDecision === "pending" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Clock3 className="h-4 w-4" />
          )}
          {pendingDecision === "pending" ? "Saving..." : "Keep pending"}
        </button>
      </div>
    </div>
  );
}
