import { headers } from "next/headers";
import {
  BriefcaseBusiness,
  Building2,
  ChartColumnBig,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import {
  WorkspaceShell as EngineWorkspaceShell,
  type WorkspaceBrand,
  type WorkspaceDivision,
  type WorkspaceViewer,
} from "@henryco/workspace-shell";
import { NotificationsToastViewport } from "@henryco/dashboard-shell";
import { getSharedAccountJobsUrl } from "@/lib/account";
import { getJobsViewer } from "@/lib/auth";
import type { WorkspaceNavItem } from "@/lib/jobs/navigation";
import { JobsRealtimeBridge } from "./JobsRealtimeBridge";

/**
 * Jobs WorkspaceShell — Phase 7a migration.
 *
 * External API preserved (area / title / subtitle / nav / activeHref /
 * accent / rightRail / children) so all 20+ candidate / employer /
 * recruiter / admin / analytics pages keep working without edits.
 *
 * Internally now composes @henryco/workspace-shell so jobs picks up the
 * same chrome as studio /client: real desktop sidebar with token-driven
 * theming, mobile-header with notifications bell, mobile bottom-nav,
 * proper breakpoint handling, and the entire primitive vocabulary.
 *
 * The legacy area-badge (icon + title + subtitle in a coloured pill at
 * the top of the sidebar) is preserved via the engine's `sidebarTopSlot`
 * — it carries jobs-specific identity that the generic engine doesn't.
 *
 * Async server component: it self-fetches the JobsViewer rather than
 * forcing every page to pass it in. Pages remain unchanged.
 */

const AREA_META: Record<
  string,
  { icon: LucideIcon; label: string; division: WorkspaceDivision }
> = {
  candidate: { icon: UserRound, label: "Candidate hub", division: "jobs-candidate" },
  employer: { icon: Building2, label: "Employer workspace", division: "jobs-employer" },
  recruiter: { icon: BriefcaseBusiness, label: "Recruiter workspace", division: "jobs-recruiter" },
  moderation: { icon: ShieldCheck, label: "Moderation", division: "jobs-recruiter" },
  analytics: { icon: ChartColumnBig, label: "Analytics", division: "jobs-recruiter" },
};

async function currentPathname(): Promise<string> {
  try {
    const headerStore = await headers();
    return (
      headerStore.get("x-pathname") ||
      headerStore.get("x-invoke-path") ||
      headerStore.get("next-url") ||
      ""
    );
  } catch {
    return "";
  }
}

function viewerForShell(jobsViewer: Awaited<ReturnType<typeof getJobsViewer>>): WorkspaceViewer {
  if (!jobsViewer.user) {
    return { fullName: null, email: null, avatarUrl: null };
  }
  return {
    fullName: jobsViewer.user.fullName ?? null,
    email: jobsViewer.user.email ?? null,
    avatarUrl: jobsViewer.user.avatarUrl ?? null,
  };
}

export type JobsWorkspaceShellProps = {
  area: string;
  title: string;
  subtitle: string;
  nav: WorkspaceNavItem[];
  activeHref: string;
  /** Legacy gradient string used inside the area badge pill. The
   * engine's chrome inherits from --ws-* tokens, but the badge keeps
   * the per-area accent so candidate / employer / recruiter still
   * read distinct visually. */
  accent: string;
  children: React.ReactNode;
  rightRail?: React.ReactNode;
};

export async function WorkspaceShell({
  area,
  title,
  subtitle,
  nav,
  activeHref,
  accent,
  children,
  rightRail,
}: JobsWorkspaceShellProps) {
  const areaMeta = AREA_META[area] ?? AREA_META.candidate;
  const Icon = areaMeta.icon;
  const division = areaMeta.division;

  const [pathname, jobsViewer] = await Promise.all([currentPathname(), getJobsViewer()]);
  const viewer = viewerForShell(jobsViewer);
  const accountSettingsUrl = getSharedAccountJobsUrl();

  // The engine renders its own brand strip; we want jobs's distinctive
  // area-badge instead. Keep both: the brand strip stays as a tiny
  // "HenryCo / Jobs" header, and the area badge renders below it via
  // the sidebarTopSlot.
  const brand: WorkspaceBrand = {
    shortName: "HenryCo Jobs",
    kicker: areaMeta.label,
    href: nav[0]?.href ?? activeHref,
    icon: Icon,
  };

  const areaBadge = (
    <div
      className="ws-jobs-area-badge"
      style={{ background: accent }}
      data-area={area}
    >
      <div className="ws-jobs-area-badge-row">
        <span className="ws-jobs-area-badge-icon" aria-hidden>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="ws-jobs-area-badge-kicker">{areaMeta.label}</div>
          <div className="ws-jobs-area-badge-title">{title}</div>
        </div>
      </div>
      <p className="ws-jobs-area-badge-subtitle">{subtitle}</p>
    </div>
  );

  // Bridge viewer for the realtime spine (only authenticated callers
  // hit a workspace surface, but defend against the bridge mounting
  // empty by collapsing to userId:null when auth somehow returns no user).
  const bridgeViewer = {
    userId: jobsViewer.user?.id ?? null,
    email: jobsViewer.user?.email ?? null,
    fullName: jobsViewer.user?.fullName ?? null,
    avatarUrl: jobsViewer.user?.avatarUrl ?? null,
    hasStaffAccess: area === "moderation" || area === "analytics" || area === "recruiter",
  };

  return (
    <JobsRealtimeBridge viewer={bridgeViewer}>
      <EngineWorkspaceShell
        division={division}
        brand={brand}
        viewer={viewer}
        navigation={nav}
        pathname={pathname || activeHref}
        notificationsHref={nav.find((n) => /messages|alerts|notifications/i.test(n.label))?.href ?? activeHref}
        profileHref={nav.find((n) => /profile|settings/i.test(n.label))?.href ?? activeHref}
        accountSettingsUrl={accountSettingsUrl}
        sidebarTopSlot={areaBadge}
        rightRail={rightRail}
      >
        {children}
      </EngineWorkspaceShell>
      {/* Live toast pop-ups for customer_notifications rows. The
       * SupabaseRealtimeProvider above this component owns the single
       * subscription; the viewport just renders new signals as they
       * arrive. Audience auto-derives from the bridge's UnifiedViewer. */}
      <NotificationsToastViewport
        audience={bridgeViewer.hasStaffAccess ? "staff" : "customer"}
      />
    </JobsRealtimeBridge>
  );
}

/* Re-export the client-safe primitives so existing server-page imports
 * (`import { WorkspaceShell, SectionCard } from "@/components/workspace-shell"`)
 * keep working without a churn pass across 20+ pages. Client components
 * should import from `workspace-shell-primitives` directly to avoid
 * dragging the server-only auth helpers above into their bundle. */
export {
  SectionCard,
  StatTile,
  StatusPill,
} from "./workspace-shell-primitives";
