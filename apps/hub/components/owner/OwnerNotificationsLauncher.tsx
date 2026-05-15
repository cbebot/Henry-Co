"use client";

/**
 * OwnerNotificationsLauncher — V3 PASS 21 / H2.
 *
 * Wraps `<NotificationsBell>` (from @henryco/dashboard-shell) with the
 * STAFF audience preset so the owner workspace (Track B) receives the
 * cross-division staff signal stream — operator-grade notifications
 * scoped to hub:support, owner-only alerts, sensitive activity, etc.
 *
 * The bell reads from the same realtime spine mounted at the layout
 * (`OwnerRealtimeBridge` → `SupabaseRealtimeProvider`) so a SINGLE
 * Supabase Realtime subscription powers the bell, popover, drawer,
 * and toast viewport.
 *
 * V3 E1 closure: owner workspace shell now exposes notifications-ui.
 */

import { NotificationsBell } from "@henryco/dashboard-shell/components";
import { STAFF_NOTIFICATION_TOKENS } from "@henryco/notifications-ui/tokens";

export type OwnerNotificationsLauncherProps = {
  className?: string;
};

export default function OwnerNotificationsLauncher({ className }: OwnerNotificationsLauncherProps) {
  return (
    <div className={className ?? "inline-flex"}>
      <NotificationsBell
        audience="staff"
        tokens={STAFF_NOTIFICATION_TOKENS}
        viewAllHref="/owner/messaging/alerts"
        recentlyDeletedHref="/owner/messaging/alerts?view=recently-deleted"
        preferencesHref="/owner/settings/comms"
      />
    </div>
  );
}
