"use client";

import { useState } from "react";
import { contactSafety } from "@henryco/contact-safety";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";

/**
 * Quiet, reassuring inline hint shown beneath the composer when the live
 * draft looks like it carries off-platform contact details (The Onyx
 * Line, WS-4).
 *
 * It runs the same `contactSafety` verdict the server uses BEFORE persist,
 * so the buyer/seller learns up-front that phone numbers, emails, and
 * off-platform links can't be sent — turning a hard block into a calm,
 * honest nudge rather than a surprise rejection.
 *
 * Identity-safe: it renders ONLY the generic reassurance copy. It never
 * echoes the matched contact (no `maskedText`, no `patterns`) back to the
 * surface. AA: warm ink-on-paper using the marketplace tokens, never
 * white-on-gold.
 */
export function ContactSafetyHint({ text }: { text: string }) {
  const locale = useHenryCoLocale();
  const t = (label: string) => translateSurfaceLabel(locale, label);

  const verdict = contactSafety(text);
  // Dismiss is keyed to the verdict tone, so the hint re-appears if the draft
  // escalates (mask -> block). Dismissing acknowledges THIS warning; it does
  // not silence the surface for the rest of the conversation.
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);

  if (verdict.action === "allow") return null;
  if (dismissedFor === verdict.action) return null;

  const isBlock = verdict.action === "block";
  const title = isBlock
    ? t("Contact details can't be sent")
    : t("Some details will be hidden");
  const body = isBlock
    ? t(
        "This message looks like it contains a phone number, email, or off-platform link. Remove it to send.",
      )
    : t(
        "Parts of this message that look like contact details will be hidden to keep you protected.",
      );

  return (
    <div
      role="status"
      aria-live="polite"
      data-tone={verdict.action}
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "baseline",
        gap: "0.5rem",
        marginTop: "0.5rem",
        padding: "0.6rem 0.75rem",
        borderRadius: "0.6rem",
        border: "1px solid var(--market-line-strong)",
        borderLeft: "3px solid var(--market-brass)",
        background: "color-mix(in srgb, var(--market-brass) 8%, transparent)",
        color: "var(--market-ink)",
        fontSize: "0.82rem",
        lineHeight: 1.45,
      }}
    >
      <strong style={{ fontWeight: 600 }}>{title}</strong>
      <span>{body}</span>
      <span style={{ color: "var(--market-muted)", flexBasis: "100%" }}>
        {t(
          "Keep the conversation on Henry Onyx — phone numbers, emails, and off-platform links can't be sent. This is how we protect you from scammers.",
        )}
      </span>
      <button
        type="button"
        onClick={() => setDismissedFor(verdict.action)}
        aria-label={t("Dismiss")}
        style={{
          marginLeft: "auto",
          background: "transparent",
          border: "none",
          padding: "0.1rem 0.3rem",
          color: "var(--market-muted)",
          cursor: "pointer",
          fontSize: "0.78rem",
          textDecoration: "underline",
        }}
      >
        {t("Dismiss")}
      </button>
    </div>
  );
}
