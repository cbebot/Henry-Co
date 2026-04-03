"use client";

import { useMemo, useState, useTransition } from "react";
import { BadgeCheck, Clock3, MailQuestion, ShieldX } from "lucide-react";
import { useRouter } from "next/navigation";
import { reviewPaymentProofAction } from "@/app/(staff)/support/actions";
import { emitCareToast } from "@/components/feedback/CareToaster";
import { CareLoadingGlyph } from "@/components/ui/CareLoading";

type PaymentReviewControlsProps = {
  requestId: string;
  amountDue: number;
  latestAmountPaid?: number | null;
  latestReference?: string | null;
  latestReviewReason?: string | null;
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

function asMoneyInput(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return "";
  return String(value);
}

function normalizeAmount(value: string) {
  const normalized = Number(value.trim());
  return Number.isFinite(normalized) ? normalized : null;
}

const inputCls =
  "h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 outline-none transition focus:border-[color:var(--accent)]/40 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white";

const textareaCls =
  "rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-zinc-900 outline-none transition focus:border-[color:var(--accent)]/40 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white";

export default function PaymentReviewControls({
  requestId,
  amountDue,
  latestAmountPaid,
  latestReference,
  latestReviewReason,
}: PaymentReviewControlsProps) {
  const router = useRouter();
  const [reason, setReason] = useState(latestReviewReason || "");
  const [amountApproved, setAmountApproved] = useState(
    asMoneyInput(latestAmountPaid ?? amountDue)
  );
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [pendingDecision, setPendingDecision] = useState<
    "approve" | "reject" | "request_more" | "under_review" | null
  >(null);
  const [pending, startTransition] = useTransition();

  const helperText = useMemo(() => {
    if (!latestReference) return null;
    return `Latest reference: ${latestReference}`;
  }, [latestReference]);

  function submit(decision: "approve" | "reject" | "request_more" | "under_review") {
    setPendingDecision(decision);

    startTransition(async () => {
      const result = await reviewPaymentProofAction({
        requestId,
        decision,
        reason,
        amountApproved: decision === "approve" ? normalizeAmount(amountApproved) : null,
        paymentMethod: decision === "approve" ? paymentMethod : null,
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
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-[0.92fr_1.08fr]">
        <label className="grid gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
            Amount to approve
          </span>
          <input
            value={amountApproved}
            onChange={(event) => setAmountApproved(event.target.value)}
            inputMode="decimal"
            placeholder="0.00"
            className={inputCls}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
            Payment method
          </span>
          <select
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
            className={inputCls}
          >
            <option value="bank_transfer">Bank transfer</option>
            <option value="card">Card</option>
            <option value="cash">Cash</option>
            <option value="pos">POS</option>
            <option value="other">Other</option>
          </select>
        </label>
      </div>

      <label className="grid gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
          Review note
        </span>
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={4}
          placeholder="Add the approval note, the mismatch found, or the exact proof you still need from the customer."
          className={textareaCls}
        />
        {helperText ? (
          <span className="text-xs leading-6 text-zinc-500 dark:text-white/45">{helperText}</span>
        ) : null}
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          className={buttonCls()}
          onClick={() => submit("approve")}
        >
          {pendingDecision === "approve" ? (
            <CareLoadingGlyph size="sm" className="text-[#07111F]" />
          ) : (
            <BadgeCheck className="h-4 w-4" />
          )}
          {pendingDecision === "approve" ? "Approving..." : "Approve payment"}
        </button>

        <button
          type="button"
          disabled={pending}
          className={buttonCls("secondary")}
          onClick={() => submit("under_review")}
        >
          {pendingDecision === "under_review" ? (
            <CareLoadingGlyph size="sm" className="text-current" />
          ) : (
            <Clock3 className="h-4 w-4" />
          )}
          {pendingDecision === "under_review" ? "Updating..." : "Mark under review"}
        </button>

        <button
          type="button"
          disabled={pending}
          className={buttonCls("secondary")}
          onClick={() => submit("request_more")}
        >
          {pendingDecision === "request_more" ? (
            <CareLoadingGlyph size="sm" className="text-current" />
          ) : (
            <MailQuestion className="h-4 w-4" />
          )}
          {pendingDecision === "request_more" ? "Sending..." : "Request more proof"}
        </button>

        <button
          type="button"
          disabled={pending}
          className={buttonCls("danger")}
          onClick={() => submit("reject")}
        >
          {pendingDecision === "reject" ? (
            <CareLoadingGlyph size="sm" className="text-current" />
          ) : (
            <ShieldX className="h-4 w-4" />
          )}
          {pendingDecision === "reject" ? "Rejecting..." : "Reject proof"}
        </button>
      </div>
    </div>
  );
}
