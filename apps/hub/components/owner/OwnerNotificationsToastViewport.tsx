"use client";

/**
 * OwnerNotificationsToastViewport — V3 PASS 21 / H2.
 *
 * Mounts the shell-wide `<NotificationsToastViewport>` for the owner
 * workspace (Track B). Receives signals via the realtime spine so
 * cross-division alerts surface as transient toasts above the
 * command-center surfaces.
 */

import { NotificationsToastViewport } from "@henryco/dashboard-shell/components";
import { STAFF_NOTIFICATION_TOKENS } from "@henryco/notifications-ui/tokens";

export default function OwnerNotificationsToastViewport() {
  return (
    <NotificationsToastViewport
      audience="staff"
      tokens={STAFF_NOTIFICATION_TOKENS}
    />
  );
}
