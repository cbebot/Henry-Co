/**
 * Layouts for Supabase Send Email Hook payloads.
 *
 * One layout per email_action_type. We render via the dark-mode-safe
 * @henryco/email layout so the message is unmistakably HenryCo across
 * Gmail / Apple Mail / Outlook.
 *
 * Final copy refinement is deferred to the post-merge copy pass; this
 * file owns *technical-foundation* copy only.
 */

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

export function renderAuthEmail(data: AuthHookEmailData, fallbackSiteUrl: string): Rendered {
  const siteUrl = (data.site_url && data.site_url.trim()) || fallbackSiteUrl;
  const action = data.email_action_type;
  const cta = buildConfirmUrl(siteUrl, data.token_hash, action, data.redirect_to);

  if (action === "signup") {
    return render({
      purpose: "auth",
      subject: "Confirm your HenryCo account",
      eyebrow: "HenryCo Accounts",
      title: "Confirm your email to activate your HenryCo account",
      intro:
        "Welcome to HenryCo. Confirm this email address so we can keep your account, bookings, and saved preferences secure.",
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
        "We received a request to change the email on your HenryCo account. Confirm this address to complete the change.",
      actionLabel: "Confirm new email",
      actionHref: cta,
      footnote: "If you didn't request this change, contact support immediately — your old email still works for now.",
    });
  }

  if (action === "reauthentication") {
    return render({
      purpose: "auth",
      subject: "Confirm a sensitive action on your HenryCo account",
      eyebrow: "HenryCo Accounts",
      title: "Confirm a sensitive action",
      intro:
        "We need to re-verify it's you before this action goes through. Tap the link below to confirm.",
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
