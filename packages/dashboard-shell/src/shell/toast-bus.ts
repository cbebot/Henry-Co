"use client";

/**
 * V3-FEEDBACK-01: the imperative toast bus (born here in PR #255) is now the
 * company-wide action-feedback bus at `@henryco/ui/feedback` — ONE bus for
 * the dashboard shell, the public surfaces, and every division flow, so a
 * toast emitted anywhere renders in the same shared language (and may carry
 * the Onyx chime via `chime: true`).
 *
 * This module re-exports it under the original `shellToast` names so every
 * existing import keeps working unchanged. New call sites should prefer
 * `import { toast } from "@henryco/ui/feedback"`.
 */

import { toast } from "@henryco/ui/feedback";

export {
  emitFeedbackToast as emitShellToast,
  resolveFeedbackToast as resolveShellToast,
  subscribeFeedbackToast as subscribeShellToast,
  TONE_DEFAULT_DURATION_MS,
  type FeedbackToast as ShellToast,
  type FeedbackToastInput as ShellToastInput,
  type FeedbackToastTone as ShellToastTone,
} from "@henryco/ui/feedback";

/**
 * Imperative singleton — import and call from anywhere:
 *   shellToast.success("Withdrawal PIN updated");
 *   shellToast.error("Couldn't update your PIN", { body: "Try again." });
 */
export const shellToast = toast;

export type ShellToastApi = typeof shellToast;
