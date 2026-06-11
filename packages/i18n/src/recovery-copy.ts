/**
 * Surface: recovery  (V3-37 abandoned-journey recovery)
 *
 * Copy for the "continue where you left off" recovery surfaces:
 *   - the /continue dashboard page + home panel
 *   - the first-login resume toast nudge
 *   - per-task-type reminder titles/bodies (in-app notification)
 *   - reminder email subject/body templates (standard + day-7 final)
 *
 * Pattern B (runtime DeepL): en-US is hand-populated here; the other 11
 * locales flow through `translateSurfaceLabel` at the call site — no per-locale
 * override blocks. {placeholders} ({n}, {when}, {title}) are substituted by the
 * consumer AFTER translation. Zero hardcoded strings live in the components.
 */

import type { AppLocale } from "./locales";

/** Mirrors @henryco/data AbandonedTaskType (kept local to avoid a package dep). */
export type RecoveryTaskTypeKey = "form_draft" | "booking" | "kyc" | "proposal" | "cart";

export type RecoveryTaskTypeCopy = {
  /** Short display label, e.g. "Unfinished form". */
  label: string;
  /** In-app reminder title, e.g. "Finish your saved form". */
  reminderTitle: string;
  /** In-app reminder body. */
  reminderBody: string;
};

export type RecoveryCopy = {
  page: {
    title: string;
    subtitle: string;
    empty: string;
    /** "{n} things waiting" / handled with plural keys below. */
    countOne: string;
    countMany: string; // "{n} things to continue"
    continueButton: string;
    dismissButton: string;
    dismissAria: string; // "Dismiss {title}"
    expiredNotice: string; // "Saved {when} ago"
    sectionAttention: string;
  };
  home: {
    panelTitle: string;
    seeAll: string;
  };
  nudge: {
    titleOne: string; // "You have 1 thing to continue"
    titleMany: string; // "You have {n} things to continue"
    body: string; // "Pick up exactly where you left off."
    action: string; // "Continue"
  };
  taskTypes: Record<RecoveryTaskTypeKey, RecoveryTaskTypeCopy>;
  email: {
    subject: string; // "You left something unfinished"
    heading: string; // "Pick up where you left off"
    body: string; // "{title} is still waiting. Continue in a tap."
    cta: string; // "Continue"
    finalSubject: string; // day-7 final
    finalBody: string;
    footerNote: string; // "You can turn these reminders off in your settings."
  };
  ago: {
    minutes: string; // "{n} min ago"
    hours: string; // "{n} hr ago"
    days: string; // "{n} day ago"
  };
};

const EN: RecoveryCopy = {
  page: {
    title: "Continue where you left off",
    subtitle: "Half-finished journeys across Henry Onyx — pick any up exactly where you stopped.",
    empty: "Nothing unfinished. You're all caught up.",
    countOne: "1 thing to continue",
    countMany: "{n} things to continue",
    continueButton: "Continue",
    dismissButton: "Dismiss",
    dismissAria: "Dismiss {title}",
    expiredNotice: "Saved {when} ago",
    sectionAttention: "Waiting on you",
  },
  home: {
    panelTitle: "Continue where you left off",
    seeAll: "See all",
  },
  nudge: {
    titleOne: "You have 1 thing to continue",
    titleMany: "You have {n} things to continue",
    body: "Pick up exactly where you left off.",
    action: "Continue",
  },
  taskTypes: {
    form_draft: {
      label: "Unfinished form",
      reminderTitle: "Your saved form is waiting",
      reminderBody: "You started filling this in. Continue where you left off.",
    },
    booking: {
      label: "Incomplete booking",
      reminderTitle: "Finish your booking",
      reminderBody: "Your booking is almost done — just a few steps left.",
    },
    kyc: {
      label: "Identity verification",
      reminderTitle: "Complete your verification",
      reminderBody: "Verify your identity to unlock the rest of your account.",
    },
    proposal: {
      label: "Proposal to review",
      reminderTitle: "Your proposal is ready to review",
      reminderBody: "Take another look and continue when you're ready.",
    },
    cart: {
      label: "Cart waiting",
      reminderTitle: "Your cart is still here",
      reminderBody: "The items you chose are saved. Complete your order when you're ready.",
    },
  },
  email: {
    subject: "You left something unfinished at Henry Onyx",
    heading: "Pick up where you left off",
    body: "{title} is still waiting. Continue exactly where you stopped — nothing was lost.",
    cta: "Continue",
    finalSubject: "Last reminder: your unfinished {title}",
    finalBody:
      "This is the last nudge about {title}. It will still be here if you come back, but we won't email again.",
    footerNote: "You can turn these reminders off any time in your notification settings.",
  },
  ago: {
    minutes: "{n} min ago",
    hours: "{n} hr ago",
    days: "{n} day ago",
  },
};

/**
 * Recovery copy for the requested locale. Pattern B: the structure is identical
 * across locales; non-EN consumers render each leaf through
 * `translateSurfaceLabel(locale, value)` before display.
 */
export function getRecoveryCopy(_locale: AppLocale): RecoveryCopy {
  return EN;
}

/** Internal — exposed for tests comparing against the canonical baseline. */
export const RECOVERY_COPY_EN: RecoveryCopy = EN;
