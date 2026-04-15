"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  RotateCcw,
  Send,
  UserRoundCheck,
  UserRoundX,
} from "lucide-react";
import {
  assignSharedSupportThreadToSelfAction,
  clearSharedSupportThreadAssignmentAction,
  replyToSharedSupportThreadAction,
  updateSharedSupportThreadPriorityAction,
  updateSharedSupportThreadStatusAction,
} from "@/app/(workspace)/support/actions";

type FeedbackTone = "success" | "warning" | "error";

function readDraftMessage(draftKey: string) {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(draftKey) || "";
}

function feedbackClasses(tone: FeedbackTone) {
  if (tone === "success") {
    return "border-emerald-300/40 bg-emerald-500/10 text-emerald-700";
  }
  if (tone === "warning") {
    return "border-amber-300/40 bg-amber-500/10 text-amber-700";
  }
  return "border-red-300/40 bg-red-500/10 text-red-700";
}

export default function SupportThreadActions({
  threadId,
  assignedToId,
  viewerId,
  priority,
  status,
}: {
  threadId: string;
  assignedToId: string | null;
  viewerId: string;
  priority: string;
  status: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const draftKey = `henryco-staff-support-draft:${threadId}`;
  const [message, setMessage] = useState(() => readDraftMessage(draftKey));
  const [nextStatus, setNextStatus] = useState("pending_customer");
  const [feedback, setFeedback] = useState<{ tone: FeedbackTone; text: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (message.trim()) {
      window.localStorage.setItem(draftKey, message);
    } else {
      window.localStorage.removeItem(draftKey);
    }
  }, [draftKey, message]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 240)}px`;
  }, [message]);

  function runMutation(task: () => Promise<{ ok: boolean; tone: FeedbackTone; message: string }>) {
    startTransition(async () => {
      const result = await task();
      setFeedback({ tone: result.tone, text: result.message });
      if (result.ok) {
        router.refresh();
      }
    });
  }

  const isMine = assignedToId === viewerId;
  const isEscalated = priority === "high" || priority === "urgent";
  const canResolve = status !== "resolved" && status !== "closed";

  return (
    <div className="space-y-4" data-live-refresh-pause="true">
      {feedback ? (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${feedbackClasses(feedback.tone)}`}>
          {feedback.text}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            runMutation(() =>
              isMine
                ? clearSharedSupportThreadAssignmentAction({ threadId })
                : assignSharedSupportThreadToSelfAction({ threadId })
            )
          }
          className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[var(--staff-line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--staff-ink)] transition hover:bg-[var(--staff-gold-soft)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isMine ? <UserRoundX className="h-4 w-4" /> : <UserRoundCheck className="h-4 w-4" />}
          {isMine ? "Release thread" : "Assign to me"}
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            runMutation(() =>
              updateSharedSupportThreadPriorityAction({
                threadId,
                priority: isEscalated ? "normal" : "high",
              })
            )
          }
          className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[var(--staff-line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--staff-ink)] transition hover:bg-[var(--staff-warning-soft)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <AlertTriangle className="h-4 w-4" />
          {isEscalated ? "Normalize queue" : "Escalate"}
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            runMutation(() =>
              updateSharedSupportThreadStatusAction({
                threadId,
                status: canResolve ? "resolved" : "open",
              })
            )
          }
          className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[var(--staff-line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--staff-ink)] transition hover:bg-[var(--staff-info-soft)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {canResolve ? <CheckCircle2 className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
          {canResolve ? "Resolve" : "Reopen"}
        </button>
      </div>

      <div className="rounded-[1.8rem] border border-[var(--staff-line)] bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--staff-muted)]">
              Reply
            </p>
            <p className="mt-1 text-sm text-[var(--staff-muted)]">
              This posts in the shared HenryCo support room and also attempts outbound email when the customer email is available.
            </p>
          </div>

          <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--staff-muted)]">
            Next status
            <select
              value={nextStatus}
              onChange={(event) => setNextStatus(event.target.value)}
              className="h-11 rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-3 text-sm font-semibold text-[var(--staff-ink)] outline-none"
            >
              <option value="pending_customer">Pending customer</option>
              <option value="in_progress">In progress</option>
              <option value="awaiting_reply">Awaiting reply</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </label>
        </div>

        <textarea
          ref={textareaRef}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Write the next action clearly. Keep it useful, specific, and easy for the customer to act on."
          className="mt-4 min-h-[132px] w-full resize-none rounded-[1.4rem] border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3 text-[16px] leading-7 text-[var(--staff-ink)] outline-none transition focus:border-[var(--staff-accent)] sm:text-sm"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[var(--staff-muted)]">
            Drafts stay on this device while you type.
          </p>

          <button
            type="button"
            disabled={isPending || !message.trim()}
            onClick={() =>
              runMutation(async () => {
                const result = await replyToSharedSupportThreadAction({
                  threadId,
                  message,
                  nextStatus,
                });

                if (result.ok) {
                  setMessage("");
                  window.localStorage.removeItem(draftKey);
                }

                return result;
              })
            }
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[var(--staff-accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send reply
          </button>
        </div>
      </div>
    </div>
  );
}
