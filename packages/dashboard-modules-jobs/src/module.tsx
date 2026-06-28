import { Briefcase } from "lucide-react";
import {
  viewerCanUseCustomerSurface,
  type DashboardModule,
  type HomeWidget,
  type PaletteEntry,
  type NotificationCategory,
  type RoleDecision,
  type RouteEntry,
  type EmptyTeaching,
} from "@henryco/dashboard-shell";

import {
  ApplicationsInMotionCard,
  ProfileReadinessCard,
  SavedRolesCard,
} from "./widgets";
import { JOBS_HOME_HREF, getJobsQuickActions, loadJobsSnapshot } from "./data";
import { toPaletteGroup } from "./format";

/**
 * The jobs module — slug `jobs`. Division "Henry Onyx Jobs".
 *
 * Eligibility mirrors the other customer-surface modules: every viewer
 * who can use the customer surface (`apps/account`) is allowed — the
 * live `/jobs` page itself only calls `requireAccountUser()` with no
 * further gating, and `navigation.ts` lists Jobs under "Services"
 * un-gated. The data-layer gate in `data.ts` stays `kind === "customer"`
 * because the snapshot loads customer-context rows only.
 *
 * The real surface is the live top-level `/jobs` route, so `homeHref`
 * sends the rail / mobile drawer / Cmd-jump straight there.
 *
 * `getHomeWidgets` surfaces three widgets backed by REAL data read from
 * the live jobs tables (the same computation the `/jobs` page runs) —
 * applications in motion + recruiter updates, profile readiness, and the
 * saved-roles shortlist. Every figure is read, never fabricated; each
 * widget deep-links into `/jobs`.
 */
export const jobsModule: DashboardModule = {
  slug: "jobs",
  title: "Jobs",
  description:
    "Applications in motion, saved roles, recruiter updates, and profile readiness.",
  icon: () => <Briefcase size={18} aria-hidden />,
  railSlot: "secondary",
  homeHref: JOBS_HOME_HREF,

  getEligibleViewer(viewer) {
    return viewerCanUseCustomerSurface(viewer) ? "allowed" : "hidden";
  },

  getRoleGate(viewer): RoleDecision | null {
    if (!viewerCanUseCustomerSurface(viewer)) return null;
    return { kind: "allow", role: viewer.role };
  },

  async getHomeWidgets(viewer): Promise<ReadonlyArray<HomeWidget>> {
    const snapshot = await loadJobsSnapshot(viewer);
    if (!snapshot) return [];

    return [
      {
        id: "jobs.applications",
        source: "jobs",
        title: "Applications in motion",
        size: "lg",
        weight: 78,
        href: JOBS_HOME_HREF,
        render: async () => <ApplicationsInMotionCard snapshot={snapshot} />,
      },
      {
        id: "jobs.readiness",
        source: "jobs",
        title: "Profile readiness",
        size: "md",
        weight: 64,
        href: JOBS_HOME_HREF,
        render: async () => <ProfileReadinessCard snapshot={snapshot} />,
      },
      {
        id: "jobs.saved",
        source: "jobs",
        title: "Saved roles",
        size: "md",
        weight: 52,
        href: JOBS_HOME_HREF,
        render: async () => <SavedRolesCard snapshot={snapshot} />,
      },
    ];
  },

  getRoutes(): ReadonlyArray<RouteEntry> {
    return [
      { path: "", kind: "home", label: "Jobs" },
      { path: "browse", kind: "detail", label: "Browse jobs" },
      { path: "applications", kind: "detail", label: "My applications" },
      { path: "interviews", kind: "detail", label: "Interviews" },
      {
        path: "interviews/[sessionId]",
        kind: "detail",
        label: "Interview",
        params: ["sessionId"],
      },
    ];
  },

  async getCommandPaletteEntries(): Promise<ReadonlyArray<PaletteEntry>> {
    return getJobsQuickActions().map((action) => ({
      id: action.id,
      source: "jobs",
      label: action.label,
      kicker: "Jobs",
      groupLabel: toPaletteGroup(action.group),
      href: action.href,
      keywords: action.keywords,
    }));
  },

  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    return [
      {
        slug: "jobs.application",
        label: "Applications",
        source: "jobs",
        deepLinkTemplate: JOBS_HOME_HREF,
      },
      {
        slug: "jobs.interview",
        label: "Interviews",
        source: "jobs",
        deepLinkTemplate: JOBS_HOME_HREF,
      },
      {
        slug: "jobs.message",
        label: "Messages",
        source: "jobs",
        deepLinkTemplate: JOBS_HOME_HREF,
      },
      {
        slug: "jobs.offer",
        label: "Offers",
        source: "jobs",
        deepLinkTemplate: JOBS_HOME_HREF,
        urgentAccent: "#0E7C86",
      },
    ];
  },

  async getEmptyTeaching(): Promise<EmptyTeaching | null> {
    return {
      kicker: "Henry Onyx Jobs",
      headline: "Find your next role",
      body: "Browse roles across the network, apply in a few taps, and track every interview from one place.",
      action: { label: "Browse jobs", href: JOBS_HOME_HREF },
    };
  },

  getDeepLinkTemplate(eventType: string): string | null {
    switch (eventType) {
      case "jobs.application_received":
      case "jobs.application_status":
      case "jobs.interview_scheduled":
      case "jobs.interview_updated":
      case "jobs.message_received":
      case "jobs.offer_extended":
        return JOBS_HOME_HREF;
      default:
        return null;
    }
  },
};
