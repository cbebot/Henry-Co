"use client";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { getMessagingCopy } from "@henryco/i18n";
import { contactSafetyHintState } from "./contact-safety-hint";

export function ContactSafetyHint({ text }: { text: string }) {
  const locale = useHenryCoLocale();
  const copy = getMessagingCopy(locale).contactSafety;
  const state = contactSafetyHintState(text, copy);
  if (!state) return null;
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
    </div>
  );
}
