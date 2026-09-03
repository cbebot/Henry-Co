/**
 * Surface: auth-session
 *
 * Copy for the V3-01 session-persistence user-facing surfaces:
 *   - /auth/reauth (the ReauthScreen)
 *   - cross-tab "session ended" soft toast
 *   - draft-restored toast
 *   - "continue where you left off" panel labels
 *
 * en-US is hand-populated here. Other locales (ar, de, es, fr, ha, hi,
 * ig, it, pt, yo, zh) flow through Pattern B runtime DeepL via
 * `translateSurfaceLabel` — no per-locale override blocks needed in
 * this file. (Compare with `auth-copy.ts` where each locale carries a
 * hand-translation; this namespace was greenlit for runtime DeepL only.)
 */

import type { AppLocale } from "./locales";

export type AuthSessionReauthCopy = {
  /** Top-of-card heading, e.g., "Welcome back, Jane" — {name} is replaced. */
  headingWithName: string;
  /** Heading shown when we don't know the user's first name. */
  headingFallback: string;
  /** Subline under the heading. */
  subheading: string;

  /** Yellow callout shown when a draft was preserved across the reauth round-trip. */
  draftPreservedTitle: string;
  draftPreservedBody: string;
  /** Shown when intent=form (the user was mid-typing). */
  draftPreservedFormBody: string;
  /** Shown when intent=page (a normal page-load redirect). */
  draftPreservedPageBody: string;

  /** Email field label (locked — we display the existing email, not an editable input). */
  emailLockedLabel: string;

  /** Password method block */
  passwordLabel: string;
  passwordPlaceholder: string;
  passwordShowAria: string;
  passwordHideAria: string;
  submitPassword: string;
  submitPasswordBusy: string;

  /** Magic-link method block */
  magicLinkPrompt: string;
  magicLinkButton: string;
  magicLinkBusy: string;
  magicLinkSentTitle: string;
  magicLinkSentBody: string;
  magicLinkResend: string;

  /** OAuth method block */
  oauthContinueWith: string; // "Continue with {provider}"
  oauthSilentAttempting: string;
  oauthSilentFailed: string;
  oauthBusy: string;

  /** Discard / switch-account section */
  switchAccountTitle: string;
  switchAccountBody: string;
  switchAccountButton: string;
  switchAccountConfirmTitle: string;
  switchAccountConfirmBody: string;
  switchAccountConfirmYes: string;
  switchAccountConfirmCancel: string;

  /** Error / fallback messages */
  errorTitle: string;
  errorGeneric: string;
  errorPasswordIncorrect: string;
  errorMagicLinkFailed: string;
  errorOAuthFailed: string;
};

export type AuthSessionToastsCopy = {
  /** Cross-tab "session ended" soft toast (broadcast type: sign-out). */
  signedOutTitle: string;
  signedOutBody: string;
  signedOutActionLabel: string;
  /** Cross-tab "user changed" soft toast. */
  userChangedTitle: string;
  userChangedBody: string;
  /** Draft restored toast. */
  draftRestoredTitle: string;
  draftRestoredBody: string;
};

export type AuthSessionContinueCopy = {
  /** "Continue where you left off" panel labels. */
  panelTitle: string;
  panelEmpty: string;
  continueButton: string;
  /** Format for "X minutes ago" / "X hours ago" badge on each draft. */
  agoMinutes: string; // "{n} min ago"
  agoHours: string;
  agoDays: string;
  /** Discard a single draft entry. */
  discardDraft: string;
  /** Shown when draft is older than 24h (Addendum A8). */
  staleNotice: string;
  staleKeep: string;
  staleDiscard: string;
};

export type AuthSessionCopy = {
  reauth: AuthSessionReauthCopy;
  toasts: AuthSessionToastsCopy;
  continueWhereYouLeftOff: AuthSessionContinueCopy;
};

const EN: AuthSessionCopy = {
  reauth: {
    headingWithName: "Welcome back, {name}",
    headingFallback: "Welcome back",
    subheading: "Sign back in to pick up exactly where you were.",

    draftPreservedTitle: "Your work is safe",
    draftPreservedBody: "We saved your draft and we'll restore it as soon as you sign in.",
    draftPreservedFormBody: "Your in-progress form is preserved. Sign in to continue editing.",
    draftPreservedPageBody: "We'll return you to the page you were on after you sign in.",

    emailLockedLabel: "Signed in as",

    passwordLabel: "Password",
    passwordPlaceholder: "Enter your password",
    passwordShowAria: "Show password",
    passwordHideAria: "Hide password",
    submitPassword: "Sign in",
    submitPasswordBusy: "Signing in…",

    magicLinkPrompt: "Or send a sign-in link to your inbox.",
    magicLinkButton: "Email me a sign-in link",
    magicLinkBusy: "Sending link…",
    magicLinkSentTitle: "Check your inbox",
    magicLinkSentBody:
      "We just sent a sign-in link. Open it on this device to return to your draft.",
    magicLinkResend: "Resend link",

    oauthContinueWith: "Continue with {provider}",
    oauthSilentAttempting: "Restoring your session…",
    oauthSilentFailed: "Your provider needs you to confirm. Tap below to continue.",
    oauthBusy: "Opening provider…",

    switchAccountTitle: "Need a different account?",
    switchAccountBody:
      "Switching accounts discards your saved draft. Continue only if you no longer need it.",
    switchAccountButton: "Discard draft and switch accounts",
    switchAccountConfirmTitle: "Discard your saved draft?",
    switchAccountConfirmBody:
      "Your saved draft will be permanently removed. This can't be undone.",
    switchAccountConfirmYes: "Yes, discard and switch",
    switchAccountConfirmCancel: "Keep my draft",

    errorTitle: "Couldn't sign you back in",
    errorGeneric: "Something went wrong. Please try again.",
    errorPasswordIncorrect: "Your password is incorrect. Try again or use a sign-in link.",
    errorMagicLinkFailed: "We couldn't send the sign-in link. Please try again.",
    errorOAuthFailed: "Your provider didn't return a confirmation. Please try again.",
  },
  toasts: {
    signedOutTitle: "Your session ended",
    signedOutBody: "You were signed out in another tab.",
    signedOutActionLabel: "Sign in",
    userChangedTitle: "Account switched",
    userChangedBody: "Another tab signed in as a different user.",
    draftRestoredTitle: "Draft restored",
    draftRestoredBody: "We picked up your in-progress form where you left off.",
  },
  continueWhereYouLeftOff: {
    panelTitle: "Continue where you left off",
    panelEmpty: "No saved drafts.",
    continueButton: "Continue",
    agoMinutes: "{n} min ago",
    agoHours: "{n} hr ago",
    agoDays: "{n} day ago",
    discardDraft: "Discard",
    staleNotice: "We saved this draft {when} ago. Keep it, or start fresh?",
    staleKeep: "Keep my draft",
    staleDiscard: "Start fresh",
  },
};

/**
 * Return the auth-session copy for the requested locale. Non-EN locales
 * are routed through runtime DeepL (`translateSurfaceLabel`) — the
 * returned object is the EN baseline at compile time; the consuming
 * client renders each leaf string through the surface-label translator
 * before display.
 *
 * The shape is identical across locales because Pattern B mutates leaf
 * strings only, not structure.
 */
export function getAuthSessionCopy(_locale: AppLocale): AuthSessionCopy {
  // Locale parameter is accepted for API symmetry with other surfaces
  // (so callers can pass locale uniformly). Pattern B kicks in at the
  // call site when the consumer renders individual labels.
  return EN;
}

/** Internal — exposed for tests that compare against the canonical baseline. */
export const AUTH_SESSION_COPY_EN: AuthSessionCopy = EN;
