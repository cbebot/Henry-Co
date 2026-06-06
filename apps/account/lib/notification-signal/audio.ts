/**
 * Notification chime — re-exported from the shared notification design system
 * (`@henryco/notifications-ui/chime`) so the settings "test sound" control and
 * the live toast viewport play the ONE canonical chime. Kept as a thin
 * re-export to preserve the existing import path (`@/lib/notification-signal/audio`).
 */

export { signalAudio, type ChimeVariant } from "@henryco/notifications-ui/chime";
