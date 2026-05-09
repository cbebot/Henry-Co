import { Shield } from "lucide-react";
import type { OwnerDashboardModule } from "@henryco/dashboard-shell/owner-register";
import type {
  PaletteEntry,
  NotificationCategory,
  RouteEntry,
} from "@henryco/dashboard-shell";

/**
 * owner-settings — Track B settings module.
 *
 * Audit log, comms preferences, security. The audit subsurface is the
 * canonical display of all owner-action audit_log rows (V14 gate
 * verifies bulk-correlation grouping here).
 */
export const ownerSettingsModule: OwnerDashboardModule = {
  slug: "owner-settings",
  title: "Settings",
  description: "Audit log, comms preferences, security — owner trust surfaces.",
  icon: () => <Shield size={18} aria-hidden />,

  getEligibleViewer() {
    return "allowed";
  },

  getRoleGate(viewer) {
    return { kind: "allow", role: viewer.role };
  },

  getRoutes(): ReadonlyArray<RouteEntry> {
    return [
      { path: "settings", kind: "home", label: "Settings" },
      { path: "settings/audit", kind: "detail", label: "Audit log" },
      { path: "settings/comms", kind: "detail", label: "Comms" },
      { path: "settings/security", kind: "detail", label: "Security" },
    ];
  },

  async getCommandPaletteEntries(): Promise<ReadonlyArray<PaletteEntry>> {
    return [
      {
        id: "owner-settings.home",
        source: "owner-settings",
        groupLabel: "Open" as const,
        label: "Open owner settings",
        kicker: "Owner",
        href: "/owner/settings",
        keywords: ["settings", "config"],
      },
      {
        id: "owner-settings.audit",
        source: "owner-settings",
        groupLabel: "Open" as const,
        label: "Audit log",
        kicker: "Owner",
        href: "/owner/settings/audit",
        keywords: ["audit", "log", "trail", "compliance"],
      },
      {
        id: "owner-settings.security",
        source: "owner-settings",
        groupLabel: "Open" as const,
        label: "Security",
        kicker: "Owner",
        href: "/owner/settings/security",
        keywords: ["security", "auth"],
      },
    ];
  },

  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    return [
      { slug: "owner.security-alert", label: "Security alerts", accent: "#B91C1C", source: "owner-settings" },
    ];
  },
};
