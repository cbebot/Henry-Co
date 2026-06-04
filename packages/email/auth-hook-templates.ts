/**
 * Layouts for Supabase Send Email Hook payloads — Henry Onyx auth emails.
 *
 * One layout per email_action_type, rendered through the premium,
 * theme-aware @henryco/email layout so every message is unmistakably
 * Henry Onyx across Gmail / Apple Mail / Outlook.
 *
 * Locale-aware: the hook handler resolves the recipient's preferred locale
 * (cookie/profile) and passes it with an autoTranslate function. English
 * strings are defined once here; the localizer translates them on the fly
 * via the cache + DeepL runtime (sub-millisecond after the first send of
 * each locale).
 */

import { translateStrings, type LocalizableTranslator } from "./localize-layout";
import { renderHenryCoEmail, renderHenryCoEmailText } from "./layout";
import type { HenryCoEmailLayout } from "./layout";

export type SupabaseEmailActionType =
  | "signup"
  | "recovery"
  | "magiclink"
  | "invite"
  | "email_change"
  | "email_change_new"
  | "reauthentication";

export type AuthHookEmailData = {
  token: string;
  token_hash: string;
  redirect_to?: string | null;
  email_action_type: SupabaseEmailActionType | string;
  site_url?: string | null;
  token_new?: string | null;
  token_hash_new?: string | null;
};

type Rendered = { subject: string; html: string; text: string };

function buildConfirmUrl(siteUrl: string, tokenHash: string, type: string, redirectTo: string | null | undefined) {
  const base = siteUrl.replace(/\/+$/, "");
  const next = redirectTo && redirectTo.trim() ? redirectTo : "/";
  const params = new URLSearchParams({ token_hash: tokenHash, type, next });
  return `${base}/auth/confirm?${params.toString()}`;
}

function render(layout: HenryCoEmailLayout): Rendered {
  return {
    subject: layout.subject,
    html: renderHenryCoEmail(layout),
    text: renderHenryCoEmailText(layout),
  };
}

/**
 * Translate the user-facing strings on an auth layout in place. URLs and
 * structural fields stay untouched — auth layouts carry no embedded data.
 */
async function localizeAuthLayout(
  layout: HenryCoEmailLayout,
  locale: string,
  translator: LocalizableTranslator,
): Promise<HenryCoEmailLayout> {
  if (!locale || locale === "en") return { ...layout, locale };

  const sources = [
    layout.subject,
    layout.eyebrow || "",
    layout.title,
    layout.intro,
    layout.actionLabel || "",
    layout.secureNote || "",
    layout.footnote || "",
    layout.supportLine || "",
  ];
  const out = await translateStrings(sources, translator, locale);

  return {
    ...layout,
    subject: out[0] || layout.subject,
    eyebrow: layout.eyebrow ? (out[1] || layout.eyebrow) : layout.eyebrow,
    title: out[2] || layout.title,
    intro: out[3] || layout.intro,
    actionLabel: layout.actionLabel ? (out[4] || layout.actionLabel) : layout.actionLabel,
    secureNote: layout.secureNote ? (out[5] || layout.secureNote) : layout.secureNote,
    footnote: layout.footnote ? (out[6] || layout.footnote) : layout.footnote,
    supportLine: layout.supportLine ? (out[7] || layout.supportLine) : layout.supportLine,
    locale,
  };
}

/**
 * Build the auth layout for a hook payload without rendering it. The single
 * source of truth for every auth email's copy — both `renderAuthEmail` and
 * the localized variant route through here.
 */
function buildAuthEmailLayout(
  data: AuthHookEmailData,
  fallbackSiteUrl: string,
): HenryCoEmailLayout {
  // Supabase's `data.site_url` is the auth API base, not the project Site
  // URL — never use it for the link. `fallbackSiteUrl` is the request
  // origin (the deployment that issued the email), so the confirmation
  // returns to the same host and the `.<baseDomain>` cookie stays intact.
  const siteUrl = fallbackSiteUrl;
  const action = data.email_action_type;
  const cta = buildConfirmUrl(siteUrl, data.token_hash, action, data.redirect_to);
  const eyebrow = "Henry Onyx Accounts";

  if (action === "signup") {
    return {
      purpose: "auth",
      subject: "Confirm your email · Henry Onyx",
      eyebrow,
      title: "Confirm your email to open Henry Onyx",
      intro:
        "Welcome. Confirm this address to activate your account — one secure identity across Care, Marketplace, Property, Logistics, Studio, Jobs and Learn.",
      actionLabel: "Confirm email",
      actionHref: cta,
      secureNote: "Secure, single-use link · expires in 24 hours",
      footnote:
        "Didn't create a Henry Onyx account? You can safely ignore this email — nothing is activated until it's confirmed.",
    };
  }
  if (action === "recovery") {
    return {
      purpose: "auth",
      subject: "Reset your password · Henry Onyx",
      eyebrow,
      title: "Reset your Henry Onyx password",
      intro:
        "Choose a new password using the secure link below. For your protection it can be used once and expires in 60 minutes.",
      actionLabel: "Reset password",
      actionHref: cta,
      secureNote: "Secure, single-use link · expires in 60 minutes",
      footnote:
        "Didn't request this? No action is needed — your password stays exactly as it is.",
    };
  }
  if (action === "magiclink") {
    return {
      purpose: "auth",
      subject: "Your sign-in link · Henry Onyx",
      eyebrow,
      title: "Sign in to Henry Onyx",
      intro:
        "Tap below to sign in — no password required. The link is single-use and expires in 60 minutes.",
      actionLabel: "Sign in",
      actionHref: cta,
      secureNote: "Secure, single-use link · expires in 60 minutes",
      footnote: "Didn't ask to sign in? You can safely ignore this email.",
    };
  }
  if (action === "invite") {
    return {
      purpose: "auth",
      subject: "You're invited to Henry Onyx",
      eyebrow,
      title: "Accept your invitation",
      intro:
        "You've been invited to Henry Onyx. Set a password to activate your account and get started.",
      actionLabel: "Accept invitation",
      actionHref: cta,
      secureNote: "Secure invitation link · expires in 24 hours",
    };
  }
  if (action === "email_change" || action === "email_change_new") {
    return {
      purpose: "auth",
      subject: "Confirm your new email · Henry Onyx",
      eyebrow,
      title: "Confirm your new email address",
      intro:
        "A request was made to update the email on your Henry Onyx account. Confirm this address to complete the change.",
      actionLabel: "Confirm new email",
      actionHref: cta,
      secureNote: "Secure, single-use link",
      footnote:
        "Didn't request this? Contact us right away — your current email keeps working until the change is confirmed.",
    };
  }
  if (action === "reauthentication") {
    return {
      purpose: "auth",
      subject: "Confirm it's you · Henry Onyx",
      eyebrow,
      title: "Confirm a sensitive action",
      intro:
        "For your security, re-verification is required before this action goes through. Tap the link below to confirm.",
      actionLabel: "Confirm",
      actionHref: cta,
      secureNote: "Expires in 5 minutes",
    };
  }
  return {
    purpose: "auth",
    subject: "Henry Onyx account notice",
    eyebrow,
    title: "A note about your account",
    intro: "There's an action on your Henry Onyx account that needs your attention.",
    actionLabel: "Open Henry Onyx",
    actionHref: cta,
  };
}

export function renderAuthEmail(data: AuthHookEmailData, fallbackSiteUrl: string): Rendered {
  return render(buildAuthEmailLayout(data, fallbackSiteUrl));
}

/**
 * Locale-aware variant of `renderAuthEmail`. Falls back to English when the
 * locale is "en" or no translator is provided. Never throws — translation
 * failures degrade to English.
 */
export async function renderLocalizedAuthEmail(
  data: AuthHookEmailData,
  fallbackSiteUrl: string,
  locale: string,
  translator: LocalizableTranslator | null,
): Promise<Rendered> {
  const baseLayout = buildAuthEmailLayout(data, fallbackSiteUrl);
  if (!locale || locale === "en" || !translator) {
    return render({ ...baseLayout, locale: locale || "en" });
  }
  const localized = await localizeAuthLayout(baseLayout, locale, translator);
  return render(localized);
}
