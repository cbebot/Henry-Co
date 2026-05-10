/**
 * Layouts for Supabase Send Email Hook payloads.
 *
 * One layout per email_action_type. We render via the dark-mode-safe
 * @henryco/email layout so the message is unmistakably HenryCo across
 * Gmail / Apple Mail / Outlook.
 *
 * PASS 18C — locale-aware. The hook handler resolves the recipient's
 * preferred locale (cookie/profile) and passes it through to renderAuthEmail
 * along with an autoTranslate function. The English template strings are
 * defined here once; the localizer translates them on the fly via the cache
 * + DeepL runtime. Cache hits are sub-millisecond after the first signup of
 * each locale.
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
 * Translate the user-facing strings on a HenryCoEmailLayout in place. URLs,
 * highlight values, and section values stay untouched — this layout shape
 * for auth emails carries no embedded data fields.
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
    footnote: layout.footnote ? (out[5] || layout.footnote) : layout.footnote,
    supportLine: layout.supportLine ? (out[6] || layout.supportLine) : layout.supportLine,
    locale,
  };
}

export function renderAuthEmail(data: AuthHookEmailData, fallbackSiteUrl: string): Rendered {
  // Supabase's `data.site_url` in the hook payload is the auth API base
  // (https://<ref>.supabase.co/auth/v1), NOT the project Site URL — so we
  // never use it for the confirmation link. Use the request origin (passed
  // as `fallbackSiteUrl` by the hook handler) so the link returns to the same
  // deployment that issued the email, keeping cookie-domain semantics intact.
  const siteUrl = fallbackSiteUrl;
  const action = data.email_action_type;
  const cta = buildConfirmUrl(siteUrl, data.token_hash, action, data.redirect_to);

  if (action === "signup") {
    return render({
      purpose: "auth",
      subject: "Confirm your HenryCo account",
      eyebrow: "HenryCo Accounts",
      title: "Confirm your email to activate your HenryCo account",
      intro:
        "Confirm this email to activate the HenryCo account. The address keeps account access, bookings, and saved preferences secure across every division.",
      actionLabel: "Confirm email",
      actionHref: cta,
      footnote: "This link expires in 24 hours and can only be used once.",
      supportLine: "Didn't request this? You can safely ignore this email.",
    });
  }

  if (action === "recovery") {
    return render({
      purpose: "auth",
      subject: "Reset your HenryCo password",
      eyebrow: "HenryCo Accounts",
      title: "Reset your HenryCo password",
      intro:
        "Use the secure link below to choose a new password. The link is single-use and expires in 1 hour.",
      actionLabel: "Reset password",
      actionHref: cta,
      footnote: "If you didn't request a reset, no action is needed — your account is unchanged.",
    });
  }

  if (action === "magiclink") {
    return render({
      purpose: "auth",
      subject: "Your HenryCo sign-in link",
      eyebrow: "HenryCo Accounts",
      title: "Sign in to HenryCo",
      intro: "Tap the link below to sign in. It expires in 1 hour and can only be used once.",
      actionLabel: "Sign in",
      actionHref: cta,
      footnote: "If you didn't ask for a sign-in link, you can ignore this email.",
    });
  }

  if (action === "invite") {
    return render({
      purpose: "auth",
      subject: "You've been invited to HenryCo",
      eyebrow: "HenryCo Accounts",
      title: "Accept your HenryCo invitation",
      intro: "Set a password to activate your account and start using HenryCo.",
      actionLabel: "Accept invitation",
      actionHref: cta,
      footnote: "This invitation expires in 24 hours.",
    });
  }

  if (action === "email_change" || action === "email_change_new") {
    return render({
      purpose: "auth",
      subject: "Confirm your new HenryCo email",
      eyebrow: "HenryCo Accounts",
      title: "Confirm your new email address",
      intro:
        "A request was made to change the email on the HenryCo account. Confirm this address to complete the change.",
      actionLabel: "Confirm new email",
      actionHref: cta,
      footnote: "If you didn't request this change, contact support immediately — the old email still works for now.",
    });
  }

  if (action === "reauthentication") {
    return render({
      purpose: "auth",
      subject: "Confirm a sensitive action on your HenryCo account",
      eyebrow: "HenryCo Accounts",
      title: "Confirm a sensitive action",
      intro:
        "Re-verification is required before this action goes through. Tap the link below to confirm.",
      actionLabel: "Confirm",
      actionHref: cta,
      footnote: "This confirmation expires in 5 minutes.",
    });
  }

  return render({
    purpose: "auth",
    subject: "HenryCo account notice",
    eyebrow: "HenryCo Accounts",
    title: "HenryCo account notice",
    intro: "There's an action on your HenryCo account that needs your attention.",
    actionLabel: "Open HenryCo",
    actionHref: cta,
  });
}

/**
 * Build the HenryCoEmailLayout for an auth-hook payload without rendering it.
 * Exposed so the localized variant can mutate the layout strings before render.
 */
function buildAuthEmailLayout(
  data: AuthHookEmailData,
  fallbackSiteUrl: string,
): HenryCoEmailLayout {
  const siteUrl = fallbackSiteUrl;
  const action = data.email_action_type;
  const cta = buildConfirmUrl(siteUrl, data.token_hash, action, data.redirect_to);

  if (action === "signup") {
    return {
      purpose: "auth",
      subject: "Confirm your HenryCo account",
      eyebrow: "HenryCo Accounts",
      title: "Confirm your email to activate your HenryCo account",
      intro:
        "Confirm this email to activate the HenryCo account. The address keeps account access, bookings, and saved preferences secure across every division.",
      actionLabel: "Confirm email",
      actionHref: cta,
      footnote: "This link expires in 24 hours and can only be used once.",
      supportLine: "Didn't request this? You can safely ignore this email.",
    };
  }
  if (action === "recovery") {
    return {
      purpose: "auth",
      subject: "Reset your HenryCo password",
      eyebrow: "HenryCo Accounts",
      title: "Reset your HenryCo password",
      intro:
        "Use the secure link below to choose a new password. The link is single-use and expires in 1 hour.",
      actionLabel: "Reset password",
      actionHref: cta,
      footnote: "If you didn't request a reset, no action is needed — your account is unchanged.",
    };
  }
  if (action === "magiclink") {
    return {
      purpose: "auth",
      subject: "Your HenryCo sign-in link",
      eyebrow: "HenryCo Accounts",
      title: "Sign in to HenryCo",
      intro: "Tap the link below to sign in. It expires in 1 hour and can only be used once.",
      actionLabel: "Sign in",
      actionHref: cta,
      footnote: "If you didn't ask for a sign-in link, you can ignore this email.",
    };
  }
  if (action === "invite") {
    return {
      purpose: "auth",
      subject: "You've been invited to HenryCo",
      eyebrow: "HenryCo Accounts",
      title: "Accept your HenryCo invitation",
      intro: "Set a password to activate your account and start using HenryCo.",
      actionLabel: "Accept invitation",
      actionHref: cta,
      footnote: "This invitation expires in 24 hours.",
    };
  }
  if (action === "email_change" || action === "email_change_new") {
    return {
      purpose: "auth",
      subject: "Confirm your new HenryCo email",
      eyebrow: "HenryCo Accounts",
      title: "Confirm your new email address",
      intro:
        "A request was made to change the email on the HenryCo account. Confirm this address to complete the change.",
      actionLabel: "Confirm new email",
      actionHref: cta,
      footnote: "If you didn't request this change, contact support immediately — the old email still works for now.",
    };
  }
  if (action === "reauthentication") {
    return {
      purpose: "auth",
      subject: "Confirm a sensitive action on your HenryCo account",
      eyebrow: "HenryCo Accounts",
      title: "Confirm a sensitive action",
      intro:
        "Re-verification is required before this action goes through. Tap the link below to confirm.",
      actionLabel: "Confirm",
      actionHref: cta,
      footnote: "This confirmation expires in 5 minutes.",
    };
  }
  return {
    purpose: "auth",
    subject: "HenryCo account notice",
    eyebrow: "HenryCo Accounts",
    title: "HenryCo account notice",
    intro: "There's an action on your HenryCo account that needs your attention.",
    actionLabel: "Open HenryCo",
    actionHref: cta,
  };
}

/**
 * PASS 18C — locale-aware variant of `renderAuthEmail`.
 *
 * Resolves the recipient's preferred locale upstream (cookie/profile) and
 * passes it together with an `autoTranslateMany` translator. Returns the
 * Supabase-hook-compatible `{ subject, html, text }`.
 *
 * Falls back to English render when locale is "en" or when no translator is
 * provided. Never throws — translation failures degrade to English.
 */
export async function renderLocalizedAuthEmail(
  data: AuthHookEmailData,
  fallbackSiteUrl: string,
  locale: string,
  translator: LocalizableTranslator | null,
): Promise<Rendered> {
  const baseLayout = buildAuthEmailLayout(data, fallbackSiteUrl);
  if (!locale || locale === "en" || !translator) {
    const layout: HenryCoEmailLayout = { ...baseLayout, locale: locale || "en" };
    return render(layout);
  }
  const localized = await localizeAuthLayout(baseLayout, locale, translator);
  return render(localized);
}
