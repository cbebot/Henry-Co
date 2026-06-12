"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormDraft } from "@henryco/lifecycle/drafts";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { ButtonPendingContent } from "@henryco/ui";
import { toast } from "@henryco/ui/feedback";
import { postPropertyAction } from "@/lib/property/client-actions";

type InquiryDraft = {
  name: string;
  email: string;
  phone: string;
  message: string;
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
 * V3-ACTIONS-01 — in-place inquiry submission. Typed state is draft-preserved
 * (V3-01 useFormDraft) so an error, a stray navigation, or a reauth round
 * trip never discards the user's message; success acknowledges through the
 * V3-FEEDBACK-01 toast and soft-refreshes so the "Your progress" rail
 * appears without a document reload.
 */
export function PropertyInquiryForm({ listingId, slug, defaults }: Props) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const draft = useFormDraft<InquiryDraft>(`property-inquiry-${listingId}`, {
    name: defaults.fullName,
    email: defaults.email,
    phone: "",
    message: "",
  });

  function setField<K extends keyof InquiryDraft>(field: K, value: InquiryDraft[K]) {
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
        toast.error(t("Inquiry could not be submitted."), {
          body: result.error || t("Your message is preserved. Try again."),
        });
        return;
      }

      draft.discard();
      toast.success(t("Inquiry submitted."), {
        body: t("Replies and follow-up stay tied to your Henry Onyx account."),
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
      <input type="hidden" name="intent" value="inquiry_submit" />
      <input type="hidden" name="listing_id" value={listingId} />
      <input type="hidden" name="return_to" value={`/property/${slug}`} />

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-soft)]">
          {t("Name")}
        </span>
        <input
          name="name"
          required
          value={draft.value.name}
          onChange={(event) => setField("name", event.target.value)}
          className="property-input mt-2 rounded-2xl px-4 py-3"
        />
      </label>
      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-soft)]">
          {t("Email")}
        </span>
        <input
          name="email"
          type="email"
          required
          value={draft.value.email}
          onChange={(event) => setField("email", event.target.value)}
          className="property-input mt-2 rounded-2xl px-4 py-3"
        />
      </label>
      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-soft)]">
          {t("Phone")}
        </span>
        <input
          name="phone"
          value={draft.value.phone}
          onChange={(event) => setField("phone", event.target.value)}
          className="property-input mt-2 rounded-2xl px-4 py-3"
          placeholder="+234..."
        />
      </label>
      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-soft)]">
          {t("Message")}
        </span>
        <textarea
          name="message"
          required
          rows={4}
          value={draft.value.message}
          onChange={(event) => setField("message", event.target.value)}
          className="property-textarea mt-2 rounded-2xl px-4 py-3"
          placeholder={t("What would you like Henry Onyx Property to clarify for you?")}
        />
      </label>

      <p className="text-xs leading-6 text-[var(--property-ink-muted)]">
        {t(
          "Henry Onyx uses your account so replies, clarifications, and the next trust checks stay in one place.",
        )}
      </p>

      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="property-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--property-accent-strong)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--home-canvas)] disabled:cursor-wait disabled:opacity-80"
      >
        <ButtonPendingContent
          pending={pending}
          pendingLabel={t("Submitting inquiry")}
          spinnerLabel={t("Submitting inquiry")}
        >
          {t("Submit inquiry")}
        </ButtonPendingContent>
      </button>
    </form>
  );
}
