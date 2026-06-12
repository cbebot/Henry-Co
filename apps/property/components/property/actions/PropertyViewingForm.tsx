"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileCheck2 } from "lucide-react";
import { useFormDraft } from "@henryco/lifecycle/drafts";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { ButtonPendingContent } from "@henryco/ui";
import { toast } from "@henryco/ui/feedback";
import { postPropertyAction } from "@/lib/property/client-actions";

type ViewingDraft = {
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string;
  preferredDate: string;
  backupDate: string;
  notes: string;
};

type Props = {
  listingId: string;
  slug: string;
  defaults: {
    fullName: string;
    email: string;
  };
};

/**
 * V3-ACTIONS-01 — in-place viewing request. Same contract as the inquiry
 * form: draft-preserved typed state (V3-01), pending state on the control,
 * V3-FEEDBACK-01 toast on completion, soft refresh for the progress rail.
 */
export function PropertyViewingForm({ listingId, slug, defaults }: Props) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const draft = useFormDraft<ViewingDraft>(`property-viewing-${listingId}`, {
    attendeeName: defaults.fullName,
    attendeeEmail: defaults.email,
    attendeePhone: "",
    preferredDate: "",
    backupDate: "",
    notes: "",
  });

  function setField<K extends keyof ViewingDraft>(field: K, value: ViewingDraft[K]) {
    draft.setValue((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const formData = new FormData(event.currentTarget);

    setPending(true);
    try {
      const result = await postPropertyAction(formData);

      if (!result.ok) {
        if (result.loginUrl) {
          // The draft auto-saved as they typed — V3-01 restores it after reauth.
          window.location.href = result.loginUrl;
          return;
        }
        toast.error(t("Viewing request could not be submitted."), {
          body: result.error || t("Your details are preserved. Try again."),
        });
        return;
      }

      draft.discard();
      toast.success(t("Viewing request submitted."), {
        body: t("Scheduling and reminders stay in your account timeline."),
        chime: true,
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      action="/api/property"
      method="POST"
      onSubmit={(event) => void handleSubmit(event)}
      className="mt-6 space-y-4"
      data-live-refresh-pause="true"
    >
      <input type="hidden" name="intent" value="viewing_request" />
      <input type="hidden" name="listing_id" value={listingId} />
      <input type="hidden" name="return_to" value={`/property/${slug}`} />

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-soft)]">
          {t("Attendee name")}
        </span>
        <input
          name="attendee_name"
          required
          value={draft.value.attendeeName}
          onChange={(event) => setField("attendeeName", event.target.value)}
          className="property-input mt-2 rounded-2xl px-4 py-3"
        />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-soft)]">
            {t("Email")}
          </span>
          <input
            name="attendee_email"
            type="email"
            required
            value={draft.value.attendeeEmail}
            onChange={(event) => setField("attendeeEmail", event.target.value)}
            className="property-input mt-2 rounded-2xl px-4 py-3"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-soft)]">
            {t("Phone")}
          </span>
          <input
            name="attendee_phone"
            value={draft.value.attendeePhone}
            onChange={(event) => setField("attendeePhone", event.target.value)}
            className="property-input mt-2 rounded-2xl px-4 py-3"
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-soft)]">
            {t("Preferred time")}
          </span>
          <input
            name="preferred_date"
            type="datetime-local"
            required
            value={draft.value.preferredDate}
            onChange={(event) => setField("preferredDate", event.target.value)}
            className="property-input mt-2 rounded-2xl px-4 py-3"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-soft)]">
            {t("Backup time")}
          </span>
          <input
            name="backup_date"
            type="datetime-local"
            value={draft.value.backupDate}
            onChange={(event) => setField("backupDate", event.target.value)}
            className="property-input mt-2 rounded-2xl px-4 py-3"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-soft)]">
          {t("Notes")}
        </span>
        <textarea
          name="notes"
          rows={3}
          value={draft.value.notes}
          onChange={(event) => setField("notes", event.target.value)}
          className="property-textarea mt-2 rounded-2xl px-4 py-3"
          placeholder={t("Access, household schedule, or questions for the viewing team.")}
        />
      </label>

      <div className="border-l-2 border-[var(--property-accent-strong)]/55 pl-4 py-2">
        <div className="flex items-center gap-2">
          <FileCheck2 className="h-3.5 w-3.5 text-[var(--property-accent-strong)]" />
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink)]">
            {t("What to expect")}
          </span>
        </div>
        <p className="mt-2 text-xs leading-6 text-[var(--property-ink-muted)]">
          {t(
            "Henry Onyx may confirm access, location, or listing readiness before the appointment is fixed. If you want to move forward after the viewing, extra documents can still be requested depending on the property and next step.",
          )}
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="property-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--property-accent-strong)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--home-canvas)] disabled:cursor-wait disabled:opacity-80"
      >
        <ButtonPendingContent
          pending={pending}
          pendingLabel={t("Requesting viewing")}
          spinnerLabel={t("Requesting viewing")}
        >
          {t("Request viewing")}
        </ButtonPendingContent>
      </button>
    </form>
  );
}
