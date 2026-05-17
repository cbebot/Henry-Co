import "server-only";

import { getDivisionConfig } from "@henryco/config";
import { viewerHasPermission } from "@/app/lib/workspace/roles";
import { workspaceHref } from "@/app/lib/workspace/runtime";
import type {
  WorkspaceNavItem,
  WorkspaceDivision,
  WorkspaceNavSection,
  WorkspaceSnapshot,
  WorkspaceViewer,
} from "@/app/lib/workspace/types";
import type { HubWorkspaceCopy } from "@henryco/i18n";

export type WorkspaceSectionKey =
  | "overview"
  | "tasks"
  | "inbox"
  | "approvals"
  | "queues"
  | "archive"
  | "reports"
  | "settings"
  | "division";

export function parseWorkspaceSlug(slug?: string[]) {
  if (!slug || slug.length === 0) {
    return { key: "overview" as const };
  }

  if (slug.length === 1) {
    const key = slug[0];
    if (["tasks", "inbox", "approvals", "queues", "archive", "reports", "settings"].includes(key)) {
      return { key: key as Exclude<WorkspaceSectionKey, "overview" | "division"> };
    }
  }

  if (slug.length === 2 && slug[0] === "division") {
    const division = slug[1] as WorkspaceDivision;
    if (["care", "marketplace", "studio", "jobs", "property", "learn", "logistics"].includes(division)) {
      return { key: "division" as const, division };
    }
  }

  return null;
}

export function canViewSection(viewer: WorkspaceViewer, key: WorkspaceSectionKey) {
  switch (key) {
    case "overview":
      return viewerHasPermission(viewer, "overview.view");
    case "tasks":
      return viewerHasPermission(viewer, "tasks.view");
    case "inbox":
      return viewerHasPermission(viewer, "inbox.view");
    case "approvals":
      return viewerHasPermission(viewer, "approvals.view");
    case "queues":
      return viewerHasPermission(viewer, "queues.view");
    case "archive":
      return viewerHasPermission(viewer, "archive.view");
    case "reports":
      return viewerHasPermission(viewer, "reports.view");
    case "settings":
      return viewerHasPermission(viewer, "settings.view");
    case "division":
      return viewerHasPermission(viewer, "division.read");
    default:
      return false;
  }
}

export function buildWorkspaceNav(
  viewer: WorkspaceViewer,
  snapshot: WorkspaceSnapshot,
  basePath: string,
  copy: HubWorkspaceCopy["workspaceNav"]
): WorkspaceNavSection[] {
  const sections: WorkspaceNavSection[] = [];
  const isNavItem = (item: WorkspaceNavItem | null): item is WorkspaceNavItem => Boolean(item);

  const workspaceItems = [
    viewerHasPermission(viewer, "overview.view")
      ? {
          href: workspaceHref(basePath, "/"),
          label: copy.navOverview,
          icon: "LayoutDashboard",
        }
      : null,
    viewerHasPermission(viewer, "tasks.view")
      ? {
          href: workspaceHref(basePath, "/tasks"),
          label: copy.navMyTasks,
          icon: "ListTodo",
          badge: snapshot.tasks.length,
        }
      : null,
    viewerHasPermission(viewer, "inbox.view")
      ? {
          href: workspaceHref(basePath, "/inbox"),
          label: copy.navInbox,
          icon: "Inbox",
          badge: snapshot.inbox.filter((item) => item.unread).length,
        }
      : null,
    viewerHasPermission(viewer, "approvals.view")
      ? {
          href: workspaceHref(basePath, "/approvals"),
          label: copy.navApprovals,
          icon: "BadgeCheck",
          badge: snapshot.approvals.length,
        }
      : null,
  ].filter(isNavItem);

  if (workspaceItems.length > 0) {
    sections.push({ label: copy.sectionWorkspace, items: workspaceItems });
  }

  const operationsItems = [
    viewerHasPermission(viewer, "queues.view")
      ? {
          href: workspaceHref(basePath, "/queues"),
          label: copy.navQueues,
          icon: "KanbanSquare",
        }
      : null,
    viewerHasPermission(viewer, "archive.view")
      ? {
          href: workspaceHref(basePath, "/archive"),
          label: copy.navHistory,
          icon: "History",
        }
      : null,
    viewerHasPermission(viewer, "reports.view")
      ? {
          href: workspaceHref(basePath, "/reports"),
          label: copy.navReports,
          icon: "ChartColumn",
        }
      : null,
    viewerHasPermission(viewer, "settings.view")
      ? {
          href: workspaceHref(basePath, "/settings"),
          label: copy.navSettings,
          icon: "Settings2",
        }
      : null,
  ].filter(isNavItem);

  if (operationsItems.length > 0) {
    sections.push({ label: copy.sectionOperations, items: operationsItems });
  }

  if (viewerHasPermission(viewer, "division.read")) {
    sections.push({
      label: copy.sectionDivisions,
      items: snapshot.modules.map((module) => ({
        href: workspaceHref(basePath, `/division/${module.division}`),
        label: getDivisionConfig(module.division).shortName,
        icon: "Building2",
        badge: module.tasks.length + module.approvals.length,
      })),
    });
  }

  return sections;
}

export function getWorkspaceSectionTitle(
  key: WorkspaceSectionKey,
  division?: WorkspaceDivision,
  copy?: HubWorkspaceCopy["workspaceNav"]
) {
  if (!copy) {
    // Fallback to English literals when copy is not provided (legacy callers)
    switch (key) {
      case "overview": return "Overview";
      case "tasks": return "My Tasks";
      case "inbox": return "Inbox";
      case "approvals": return "Approvals";
      case "queues": return "Queues";
      case "archive": return "History";
      case "reports": return "Reports";
      case "settings": return "Settings";
      case "division": return division ? `${getDivisionConfig(division).shortName} Module` : "Division";
      default: return "Workspace";
    }
  }

  switch (key) {
    case "overview":
      return copy.titleOverview;
    case "tasks":
      return copy.titleMyTasks;
    case "inbox":
      return copy.titleInbox;
    case "approvals":
      return copy.titleApprovals;
    case "queues":
      return copy.titleQueues;
    case "archive":
      return copy.titleHistory;
    case "reports":
      return copy.titleReports;
    case "settings":
      return copy.titleSettings;
    case "division":
      return division
        ? copy.titleDivisionTemplate.replace("{shortName}", getDivisionConfig(division).shortName)
        : copy.titleFallback;
    default:
      return copy.titleFallback;
  }
}
