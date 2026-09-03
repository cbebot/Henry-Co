"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { ButtonPendingContent } from "@henryco/ui";
import { toast } from "@henryco/ui/feedback";
import { postPropertyAction } from "@/lib/property/client-actions";

type Props = {
  criteria: {
    q?: string;
    kind?: string;
    area?: string;
    managed?: string;
    furnished?: string;
  };
  returnTo: string;
};

/**
 * V3-ACTIONS-01 — save the active search in place. Button-only action:
 * pending on the control, V3-FEEDBACK-01 toast on completion, no document
 * navigation — the result list and filter state stay exactly as they are.
 */
export function SaveSearchButton({ criteria, returnTo }: Props) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const formData = new FormData(event.currentTarget);

    setPending(true);
    try {
      const result = await postPropertyAction(formData);

      if (!result.ok) {
        if (result.loginUrl) {
          window.location.href = result.loginUrl;
          return;
        }
        toast.error(t("Search could not be saved."), {
          body: result.error || t("Check your connection and try again."),
        });
        return;
      }

      toast.success(t("Search saved."), {
        body: t("Alerts arrive daily. Manage cadence in your account."),
        chime: true,
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      action="/api/property"
      method="POST"
      onSubmit={(event) => void handleSubmit(event)}
      className="flex flex-wrap items-center gap-3"
    >
      <input type="hidden" name="intent" value="saved_search_create" />
      <input type="hidden" name="return_to" value={returnTo} />
      <input type="hidden" name="q" value={criteria.q || ""} />
      <input type="hidden" name="kind" value={criteria.kind || ""} />
      <input type="hidden" name="area" value={criteria.area || ""} />
      <input type="hidden" name="managed" value={criteria.managed || ""} />
      <input type="hidden" name="furnished" value={criteria.furnished || ""} />
      <input type="hidden" name="alert_cadence" value="daily" />
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="property-button-secondary inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--property-accent-strong)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--home-canvas)] disabled:cursor-wait disabled:opacity-80"
      >
        <ButtonPendingContent
          pending={pending}
          pendingLabel={t("Saving search")}
          spinnerLabel={t("Saving search")}
          indicatorSize="sm"
        >
          <span className="inline-flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {t("Save this search")}
          </span>
        </ButtonPendingContent>
      </button>
    </form>
  );
}
