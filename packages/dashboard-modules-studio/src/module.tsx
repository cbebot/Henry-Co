import { Palette } from "lucide-react";
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

import { ProjectsPulseCard, PaymentsDueCard } from "./widgets";
import {
  STUDIO_HOME_HREF,
  loadStudioSnapshot,
  hasStudioFootprint,
} from "./data";

/** Deep-links into the payments section the studio landing renders. */
const STUDIO_PAYMENTS_HREF = `${STUDIO_HOME_HREF}#studio-payments`;
/** Deep-links into the projects section the studio landing renders. */
const STUDIO_PROJECTS_HREF = `${STUDIO_HOME_HREF}#studio-projects`;

/**
 * The studio module — slug `studio`. Division "Henry Onyx Studio".
 *
 * Eligibility mirrors the live `/studio` page, which gates on nothing
 * more than `requireAccountUser()` (any authenticated viewer using the
 * customer surface) — so the role gate returns `allow` for every
 * `viewerCanUseCustomerSurface(viewer)`, matching the marketplace and
 * wallet modules. The data-layer gate in `data.ts` narrows to
 * `kind === "customer"` because the studio rows are customer-scoped.
 *
 * The real surface is the live top-level `/studio` route, so `homeHref`
 * sends the rail / mobile drawer / Cmd-jump straight there in one tap.
 *
 * `getHomeWidgets` surfaces real per-viewer metrics — active projects +
 * deliverables and live payment confirmations — read through
 * `loadStudioSnapshot` (the read-only port of
 * `getStudioDashboardData().metrics`). No fabricated numbers.
 */
export const studioModule: DashboardModule = {
  slug: "studio",
  title: "Studio",
  description: "Active projects, pending payments, live confirmations, and deliverables.",
  icon: () => <Palette size={18} aria-hidden />,
  railSlot: "secondary",
  homeHref: STUDIO_HOME_HREF,

  getEligibleViewer(viewer) {
    return viewerCanUseCustomerSurface(viewer) ? "allowed" : "hidden";
  },

  getRoleGate(viewer): RoleDecision | null {
    if (!viewerCanUseCustomerSurface(viewer)) return null;
    return { kind: "allow", role: viewer.role };
  },

  async getHomeWidgets(viewer): Promise<ReadonlyArray<HomeWidget>> {
    const snapshot = await loadStudioSnapshot(viewer);
    if (!snapshot) return [];

    return [
      {
        id: "studio.projects-pulse",
        source: "studio",
        title: "Studio projects",
        size: "lg",
        weight: 70,
        href: STUDIO_PROJECTS_HREF,
        render: async () => <ProjectsPulseCard snapshot={snapshot} />,
      },
      {
        id: "studio.payments-due",
        source: "studio",
        title: "Studio payments",
        size: "md",
        // Slightly heavier than the projects pulse — an open payment is a
        // concrete next action for the viewer.
        weight: 75,
        href: STUDIO_PAYMENTS_HREF,
        render: async () => <PaymentsDueCard snapshot={snapshot} />,
      },
    ];
  },

  getRoutes(): ReadonlyArray<RouteEntry> {
    return [
      { path: "", kind: "home", label: "Studio" },
      { path: "projects", kind: "detail", label: "My projects" },
      {
        path: "projects/[projectId]",
        kind: "detail",
        label: "Project",
        params: ["projectId"],
      },
      { path: "payments", kind: "detail", label: "Payments" },
      {
        path: "payments/[paymentId]",
        kind: "detail",
        label: "Payment detail",
        params: ["paymentId"],
      },
    ];
  },

  async getCommandPaletteEntries(): Promise<ReadonlyArray<PaletteEntry>> {
    // Every entry lands on a live surface: the `/studio` landing renders
    // both the projects and payments sections (anchors), so no entry can
    // 404 before the per-feature `/modules/studio/*` pages ship.
    return [
      {
        id: "studio.projects",
        source: "studio",
        label: "View projects",
        kicker: "Studio",
        groupLabel: "Open",
        href: STUDIO_PROJECTS_HREF,
        keywords: ["projects", "studio", "design", "creative", "milestones"],
      },
      {
        id: "studio.payments",
        source: "studio",
        label: "View payments",
        kicker: "Studio",
        groupLabel: "Open",
        href: STUDIO_PAYMENTS_HREF,
        keywords: ["payments", "invoice", "billing", "checkout", "studio"],
      },
      {
        id: "studio.open",
        source: "studio",
        label: "Open Studio",
        kicker: "Studio",
        groupLabel: "Open",
        href: STUDIO_HOME_HREF,
        keywords: ["studio", "henry onyx studio", "deliverables", "brief"],
      },
    ];
  },

  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    // Deep-link templates land on the live `/studio` surface (or its
    // section anchors) until the per-feature `/modules/studio/*` pages
    // ship, so a clicked notification never 404s.
    return [
      {
        slug: "studio.project",
        label: "Projects",
        source: "studio",
        deepLinkTemplate: STUDIO_PROJECTS_HREF,
      },
      {
        slug: "studio.revision",
        label: "Revisions",
        source: "studio",
        deepLinkTemplate: STUDIO_PROJECTS_HREF,
      },
      {
        slug: "studio.payment",
        label: "Payments",
        source: "studio",
        deepLinkTemplate: STUDIO_PAYMENTS_HREF,
        urgentAccent: "#C04A1F",
      },
      {
        slug: "studio.delivery",
        label: "Deliveries",
        source: "studio",
        deepLinkTemplate: STUDIO_HOME_HREF,
      },
    ];
  },

  async getEmptyTeaching(viewer): Promise<EmptyTeaching | null> {
    const snapshot = await loadStudioSnapshot(viewer);
    // Only teach when the viewer has no studio footprint at all; once any
    // project / payment / deliverable exists, the live widgets carry the
    // surface and the teaching would be noise.
    if (snapshot && hasStudioFootprint(snapshot)) return null;
    return {
      kicker: "Henry Onyx Studio",
      headline: "Start your first project",
      body: "Brief the studio, follow each milestone and revision, and approve deliverables — all in one place.",
      action: { label: "Open Studio", href: STUDIO_HOME_HREF },
    };
  },

  getDeepLinkTemplate(eventType: string): string | null {
    switch (eventType) {
      case "studio.project_updated":
      case "studio.revision_requested":
      case "studio.revision_ready":
        return STUDIO_PROJECTS_HREF;
      case "studio.payment_due":
      case "studio.payment_received":
        return STUDIO_PAYMENTS_HREF;
      case "studio.delivery_ready":
        return STUDIO_HOME_HREF;
      default:
        return null;
    }
  },
};
