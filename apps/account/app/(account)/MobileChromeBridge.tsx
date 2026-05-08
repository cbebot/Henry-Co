import type { ReactNode } from "react";
import {
  BottomActionBar,
  NotificationsDrawerBody,
  type ModuleNavEntry,
} from "@henryco/dashboard-shell";

/**
 * MobileChromeBridge — server → client boundary for the bottom action
 * bar.
 *
 * Computes the role-eligible module list server-side (no client role
 * re-derivation; anti-pattern #7) and hands it to the client
 * `<BottomActionBar>`. Also embeds the same `<NotificationsDrawerBody>`
 * the IdentityBar bell uses, so the bar's Inbox anchor opens a drawer
 * with identical content.
 *
 * The bar renders only at `< 768px` via the `hc-bottom-action-bar`
 * class hook (see `MOBILE_SHELL_CSS`); on tablet/desktop the rail +
 * sidebar take over.
 */
export type MobileChromeBridgeProps = {
  modules: ReadonlyArray<ModuleNavEntry>;
  onSignOut?: () => void;
  inboxBody?: ReactNode;
};

export function MobileChromeBridge({
  modules,
  onSignOut,
  inboxBody,
}: MobileChromeBridgeProps) {
  return (
    <BottomActionBar
      homeHref="/"
      modules={modules}
      inboxBody={
        inboxBody ?? (
          <NotificationsDrawerBody
            inboxHref="/notifications"
            recentlyDeletedHref="/notifications/recently-deleted"
            preferencesEndpoint="/api/notifications/preferences"
          />
        )
      }
      settingsHref="/settings"
      helpHref="/support"
      onSignOut={onSignOut}
    />
  );
}
