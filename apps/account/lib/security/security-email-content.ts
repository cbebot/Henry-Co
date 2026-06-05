/**
 * Sign-in security alert — email CONTENT (pure).
 *
 * This builds the `HenryCoEmailLayout` for the "Was this you?" email. It is a
 * pure function over plain inputs so the copy can be unit-tested in isolation,
 * including the hard guarantee that it never discloses a vendor name, internal
 * architecture, or a raw network identifier (see security-email-content.test).
 *
 * Only the layout TYPE is imported (`import type`), which is erased at compile
 * time — so this module never pulls the email package's server-only send path
 * and stays test-friendly. The runtime render+send lives in `security-email.ts`.
 */

import type { HenryCoEmailLayout, HenryCoEmailSection } from "@henryco/email";

export type SignInAlertReason = "new_device" | "new_country" | "new_device_and_country";

export type SignInSecurityEmailInput = {
  /** Brand display name, resolved by the caller from @henryco/config. */
  brandName: string;
  reason: SignInAlertReason;
  /** Human device summary, e.g. "Chrome on Windows" — never a raw UA string. */
  deviceSummary: string;
  /** Coarse place, e.g. "Lagos, Nigeria" — city/country only, never an IP. */
  locationSummary: string | null;
  /** Friendly timestamp, e.g. "5 June 2026 · 14:32 WAT". */
  whenLabel: string;
  /** Absolute URL to the authenticated review surface (/security?review=…). */
  reviewUrl: string;
};

const HEADLINE: Record<SignInAlertReason, string> = {
  new_device: "New device",
  new_country: "New location",
  new_device_and_country: "New device and location",
};

export function buildSignInSecurityLayout(
  input: SignInSecurityEmailInput,
): HenryCoEmailLayout {
  const sections: HenryCoEmailSection[] = [
    { label: "When", value: input.whenLabel },
    { label: "Device", value: input.deviceSummary },
  ];
  const place = input.locationSummary?.trim();
  if (place) {
    sections.push({ label: "Near", value: place });
  }

  // The accent "highlight" card leads with the single most relevant fact.
  const highlightValue =
    input.reason === "new_country" && place
      ? place
      : input.reason === "new_device"
        ? input.deviceSummary
        : [input.deviceSummary, place].filter(Boolean).join(" · ");

  return {
    purpose: "security",
    subject: `New sign-in to your ${input.brandName} account`,
    title: "Was this you?",
    intro:
      "We noticed a new sign-in to your account. If it was you, no action is needed. " +
      "If you don't recognise it, secure your account now.",
    highlightLabel: HEADLINE[input.reason],
    highlightValue: highlightValue || input.deviceSummary,
    sections,
    actionLabel: "Review this sign-in",
    actionHref: input.reviewUrl,
    secureNote: "Secure, single-use link · expires in 7 days",
    footnote: "If this was you, no action is needed.",
  };
}
