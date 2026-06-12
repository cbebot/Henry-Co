"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ButtonPendingContent } from "@henryco/ui";
import { toast } from "@henryco/ui/feedback";

type Props = {
  intent: string;
  /** Extra hidden fields (product_slug, return_to, …) for both submit modes. */
  hidden?: Record<string, string>;
  /** All copy arrives pre-localized from the server page (Pattern B). */
  submitLabel?: ReactNode;
  pendingLabel?: string;
  successTitle: string;
  successBody?: string;
  errorTitle: string;
  /** Onyx chime — reserve for genuine completions per the restraint policy. */
  chime?: boolean;
  /** Clear the (uncontrolled) fields after success — typed create-forms only. */
  resetOnSuccess?: boolean;
  className?: string;
  buttonClassName?: string;
  /** Wrapper class for the submit row (e.g. a bordered footer row). */
  buttonRowClassName?: string;
  /** Content rendered beside the submit button (links, hints). */
  afterButton?: ReactNode;
  /**
   * Multi-mode forms (e.g. save-draft vs submit-for-moderation): each button
   * posts its name/value like a native submitter and may override the
   * success copy. When set, `submitLabel` is ignored.
   */
  submitButtons?: Array<{
    name: string;
    value: string;
    label: ReactNode;
    pendingLabel: string;
    className?: string;
    successTitle?: string;
    successBody?: string;
    chime?: boolean;
  }>;
  /** Server-rendered fields; keep their name attributes for the native path. */
  children?: ReactNode;
};

/**
 * V3-ACTIONS-01 — the marketplace in-place action form. Progressive
 * enhancement over the legacy native post: without JS the form still 303s
 * through /api/marketplace; with JS the submission rides fetch, the pending
 * state lives on the submit control, the V3-FEEDBACK-01 toast acknowledges,
 * and data refreshes via soft revalidation — scroll, focus, and sibling
 * typed state survive. Errors preserve every typed value (no reset).
 */
export function MarketplaceActionForm({
  intent,
  hidden,
  submitLabel,
  pendingLabel,
  successTitle,
  successBody,
  errorTitle,
  chime,
  resetOnSuccess,
  className,
  buttonClassName,
  buttonRowClassName,
  afterButton,
  submitButtons,
  children,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [pendingValue, setPendingValue] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const submitter = (event.nativeEvent as SubmitEvent).submitter as
      | HTMLButtonElement
      | null;
    const formData = new FormData(form, submitter ?? undefined);
    formData.set("response_mode", "json");
    const mode = submitButtons?.find(
      (entry) => submitter?.name === entry.name && submitter?.value === entry.value
    );
    setPendingValue(mode ? mode.value : null);

    setPending(true);
    try {
      let payload: Record<string, unknown> | null = null;
      let ok = false;
      try {
        const response = await fetch("/api/marketplace", {
          method: "POST",
          headers: { Accept: "application/json" },
          body: formData,
        });
        const parsed: unknown = await response.json().catch(() => null);
        payload = (parsed ?? null) as Record<string, unknown> | null;
        ok = response.ok && payload?.ok === true;
      } catch {
        payload = null;
      }

      if (!ok) {
        const loginUrl = typeof payload?.loginUrl === "string" ? payload.loginUrl : null;
        if (loginUrl) {
          window.location.href = loginUrl;
          return;
        }
        toast.error(errorTitle, {
          body: typeof payload?.error === "string" ? payload.error : undefined,
        });
        return;
      }

      toast.success(mode?.successTitle ?? successTitle, {
        body: mode?.successBody ?? successBody,
        chime: (mode ? mode.chime : chime) === true,
      });
      if (resetOnSuccess) form.reset();
      router.refresh();
    } finally {
      setPending(false);
      setPendingValue(null);
    }
  }

  return (
    <form
      action="/api/marketplace"
      method="POST"
      onSubmit={(event) => void handleSubmit(event)}
      className={className}
      data-live-refresh-pause="true"
    >
      <input type="hidden" name="intent" value={intent} />
      {Object.entries(hidden || {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {children}
      {submitButtons ? (
        <div className={buttonRowClassName ?? "flex flex-wrap gap-3"}>
          {submitButtons.map((entry) => (
            <button
              key={entry.value}
              type="submit"
              name={entry.name}
              value={entry.value}
              disabled={pending}
              aria-busy={pending && pendingValue === entry.value}
              className={entry.className}
            >
              <ButtonPendingContent
                pending={pending && pendingValue === entry.value}
                pendingLabel={entry.pendingLabel}
                spinnerLabel={entry.pendingLabel}
              >
                {entry.label}
              </ButtonPendingContent>
            </button>
          ))}
          {afterButton}
        </div>
      ) : buttonRowClassName || afterButton ? (
        <div className={buttonRowClassName}>
          <SubmitButton
            pending={pending}
            pendingLabel={pendingLabel ?? ""}
            buttonClassName={buttonClassName}
          >
            {submitLabel}
          </SubmitButton>
          {afterButton}
        </div>
      ) : (
        <SubmitButton
          pending={pending}
          pendingLabel={pendingLabel ?? ""}
          buttonClassName={buttonClassName}
        >
          {submitLabel}
        </SubmitButton>
      )}
    </form>
  );
}

function SubmitButton({
  pending,
  pendingLabel,
  buttonClassName,
  children,
}: {
  pending: boolean;
  pendingLabel: string;
  buttonClassName?: string;
  children: ReactNode;
}) {
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={buttonClassName}>
      <ButtonPendingContent pending={pending} pendingLabel={pendingLabel} spinnerLabel={pendingLabel}>
        {children}
      </ButtonPendingContent>
    </button>
  );
}
