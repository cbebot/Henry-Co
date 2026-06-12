/**
 * @henryco/ui/feedback — the Henry Onyx action-feedback system (V3-FEEDBACK-01).
 *
 * One toast primitive + the Onyx chime for every customer surface:
 *   toast.success(t("Saved to wishlist"), { chime: true });
 *
 * See toast-bus.ts for the architecture (bus, renderer election, buffer),
 * chime-policy.ts for the sound restraint rules, sound-preference.ts for the
 * "Interface sounds" device preference.
 */

export {
  emitFeedbackToast,
  isActiveToastRenderer,
  registerToastRenderer,
  resolveFeedbackToast,
  subscribeFeedbackToast,
  subscribeToastRendererChange,
  toast,
  TONE_DEFAULT_DURATION_MS,
  type FeedbackToast,
  type FeedbackToastAction,
  type FeedbackToastApi,
  type FeedbackToastInput,
  type FeedbackToastTone,
} from "./toast-bus";

export {
  FeedbackToastViewport,
  type FeedbackToastViewportProps,
} from "./feedback-toast-viewport";

export {
  FEEDBACK_TOAST_CSS,
  FEEDBACK_TOAST_EXIT_MS,
  FeedbackToastCard,
  type FeedbackToastCardProps,
} from "./feedback-toast-card";

export {
  CHIME_MIN_GAP_MS,
  planActionChime,
  playActionChime,
  resetActionChimeLimiter,
  type ActionChimePlan,
  type ActionChimePlanInput,
} from "./chime-policy";

export {
  INTERFACE_SOUNDS_CHANGE_EVENT,
  INTERFACE_SOUNDS_DEFAULT,
  INTERFACE_SOUNDS_STORAGE_KEY,
  loadInterfaceSoundsEnabled,
  setInterfaceSoundsEnabled,
  useInterfaceSoundsEnabled,
} from "./sound-preference";

export { useToastSwipe, type ToastSwipe } from "./use-toast-swipe";
