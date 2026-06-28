import { GraduationCap } from "lucide-react";
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

import { LearnCoursesCard, LearnCredentialsCard } from "./widgets";
import { LEARN_HOME_HREF, getLearnQuickActions, loadLearnSnapshot } from "./data";
import { toPaletteGroup } from "./format";

/**
 * The learn module — slug `learn`. Division "Henry Onyx Academy".
 *
 * Eligibility mirrors the other customer-surface modules
 * (marketplace/wallet/care): every authenticated viewer of `apps/account`
 * can use it (the `/learn` page only calls `requireAccountUser()` and the
 * navigation lists Academy under Services with no gating). The real
 * surface is the live top-level `/learn` route, so `homeHref` sends the
 * rail / mobile drawer / Cmd-jump straight there.
 *
 * Home widgets render the viewer's REAL learning aggregate — active /
 * completed courses, certificates, assigned learning, and saved courses —
 * computed from `loadLearnSnapshot` (the read-only port of
 * `getLearnAccountSummary` + `learnStats` / `heroState`). Nothing is
 * fabricated; a viewer with no enrollments sees honest zeros and the
 * empty teaching.
 */
export const learnModule: DashboardModule = {
  slug: "learn",
  title: "Academy",
  description: "Active courses, certificates, assigned learning, and saved courses.",
  icon: () => <GraduationCap size={18} aria-hidden />,
  railSlot: "secondary",
  homeHref: LEARN_HOME_HREF,

  getEligibleViewer(viewer) {
    return viewerCanUseCustomerSurface(viewer) ? "allowed" : "hidden";
  },

  getRoleGate(viewer): RoleDecision | null {
    if (!viewerCanUseCustomerSurface(viewer)) return null;
    return { kind: "allow", role: viewer.role };
  },

  async getHomeWidgets(viewer): Promise<ReadonlyArray<HomeWidget>> {
    const snapshot = await loadLearnSnapshot(viewer);
    if (!snapshot) return [];

    return [
      {
        id: "learn.courses",
        source: "learn",
        title: "Academy",
        size: "lg",
        weight: 55,
        href: LEARN_HOME_HREF,
        render: async () => <LearnCoursesCard snapshot={snapshot} />,
      },
      {
        id: "learn.credentials",
        source: "learn",
        title: "Credentials & assigned",
        size: "md",
        weight: 45,
        href: LEARN_HOME_HREF,
        render: async () => <LearnCredentialsCard snapshot={snapshot} />,
      },
    ];
  },

  getRoutes(): ReadonlyArray<RouteEntry> {
    return [
      { path: "", kind: "home", label: "Academy" },
      { path: "courses", kind: "detail", label: "Browse courses" },
      {
        path: "courses/[courseId]",
        kind: "detail",
        label: "Course",
        params: ["courseId"],
      },
      { path: "certificates", kind: "detail", label: "Certificates" },
    ];
  },

  async getCommandPaletteEntries(): Promise<ReadonlyArray<PaletteEntry>> {
    return getLearnQuickActions().map((action) => ({
      id: action.id,
      source: "learn",
      label: action.label,
      kicker: "Academy",
      groupLabel: toPaletteGroup(action.group),
      href: action.href,
      keywords: action.keywords,
    }));
  },

  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    return [
      {
        slug: "learn.enrollment",
        label: "Enrollments",
        source: "learn",
        deepLinkTemplate: LEARN_HOME_HREF,
      },
      {
        slug: "learn.lesson",
        label: "Lessons",
        source: "learn",
        deepLinkTemplate: LEARN_HOME_HREF,
      },
      {
        slug: "learn.certificate",
        label: "Certificates",
        source: "learn",
        deepLinkTemplate: LEARN_HOME_HREF,
      },
    ];
  },

  async getEmptyTeaching(): Promise<EmptyTeaching | null> {
    return {
      kicker: "Henry Onyx Academy",
      headline: "Start your first course",
      body: "Explore the catalog, learn at your own pace, and earn certificates you can share.",
      action: { label: "Browse courses", href: LEARN_HOME_HREF },
    };
  },

  getDeepLinkTemplate(eventType: string): string | null {
    switch (eventType) {
      case "learn.enrollment_confirmed":
      case "learn.lesson_released":
      case "learn.lesson_completed":
      case "learn.certificate_issued":
        return LEARN_HOME_HREF;
      default:
        return null;
    }
  },
};
