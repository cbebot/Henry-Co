"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ButtonPendingContent } from "@henryco/ui";
import { toast } from "@henryco/ui/feedback";

export type PayoutRequestOutcome =
  | { kind: "success" }
  | { kind: "error"; detail?: string };

/**
 * The payout request form — the one vendor mutation that stays on the native
 * POST → 303 → GET contract, because the `payout_request` money path in
 * /api/marketplace is out of bounds for presentation work and answers with
 * redirects only. Feedback is still first-class: the submit control carries a
 * pending state until the redirect lands, and the `?requested=1` /
 * `?error=<code>` the intent redirects back with arrives here (resolved by
 * the server page) as a translated toast. All copy is pre-localized by the
 * server page (Pattern B); fields render server-side as children so the
 * posted names stay the legacy contract exactly.
 */
export function PayoutRequestForm({
  outcome,
  labels,
  className,
  buttonClassName,
  children,
}: {
  /** Resolved server-side from the redirect's query params; null = plain visit. */
  outcome: PayoutRequestOutcome | null;
  labels: {
    submit: string;
    pending: string;
    successTitle: string;
    successBody?: string;
    errorTitle: string;
  };
  className?: string;
  buttonClassName?: string;
  children?: ReactNode;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const announced = useRef(false);

  useEffect(() => {
    if (!outcome || announced.current) return;
    announced.current = true;
    if (outcome.kind === "success") {
      toast.success(labels.successTitle, { body: labels.successBody });
    } else {
      toast.error(labels.errorTitle, { body: outcome.detail });
    }
    // Drop the outcome params so refresh or back never re-announces.
    router.replace("/vendor/payouts", { scroll: false });
  }, [outcome, labels.successTitle, labels.successBody, labels.errorTitle, router]);

  return (
    <form
      action="/api/marketplace"
      method="POST"
      className={className}
      onSubmit={() => setPending(true)}
    >
      <input type="hidden" name="intent" value="payout_request" />
      <input type="hidden" name="return_to" value="/vendor/payouts" />
      {children}
      <button type="submit" disabled={pending} aria-busy={pending} className={buttonClassName}>
        <ButtonPendingContent
          pending={pending}
          pendingLabel={labels.pending}
          spinnerLabel={labels.pending}
        >
          {labels.submit}
        </ButtonPendingContent>
      </button>
    </form>
  );
}
