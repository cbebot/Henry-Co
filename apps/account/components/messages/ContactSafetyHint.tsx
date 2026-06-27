"use client";
import { useState } from "react";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { getMessagingCopy } from "@henryco/i18n";
import { contactSafetyHintState } from "./contact-safety-hint";

export function ContactSafetyHint({ text }: { text: string }) {
  const locale = useHenryCoLocale();
  const copy = getMessagingCopy(locale).contactSafety;
  const state = contactSafetyHintState(text, copy);
  // Dismiss is keyed to the current hint text, so the warning re-appears if the
  // draft changes to a different offending message — dismissing acknowledges
  // THIS warning, it doesn't silence the surface.
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  if (!state) return null;
  if (dismissedFor === state.body) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="acct-contact-safety-hint"
      data-tone={state.tone}
    >
      <strong className="acct-contact-safety-hint__title">{state.title}</strong>
      <span className="acct-contact-safety-hint__body">{state.body}</span>
      <span className="acct-contact-safety-hint__reassure">{copy.reassurance}</span>
      <button
        type="button"
        className="acct-contact-safety-hint__dismiss"
        aria-label={copy.dismiss}
        onClick={() => setDismissedFor(state.body)}
      >
        {copy.dismiss}
      </button>
    </div>
  );
}
