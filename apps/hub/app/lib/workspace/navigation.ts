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
  basePath: string
): WorkspaceNavSection[] {
  const sections: WorkspaceNavSection[] = [];
  const isNavItem = (item: WorkspaceNavItem | null): item is WorkspaceNavItem => Boolean(item);

  const workspaceItems = [
    viewerHasPermission(viewer, "overview.view")
      ? {
          href: workspaceHref(basePath, "/"),
          label: "Overview",
          icon: "LayoutDashboard",
        }
      : null,
    viewerHasPermission(viewer, "tasks.view")
      ? {
          href: workspaceHref(basePath, "/tasks"),
          label: "My Tasks",
          icon: "ListTodo",
          badge: snapshot.tasks.length,
        }
      : null,
    viewerHasPermission(viewer, "inbox.view")
      ? {
          href: workspaceHref(basePath, "/inbox"),
          label: "Inbox",
          icon: "Inbox",
          badge: snapshot.inbox.filter((item) => item.unread).length,
        }
      : null,
    viewerHasPermission(viewer, "approvals.view")
      ? {
          href: workspaceHref(basePath, "/approvals"),
          label: "Approvals",
          icon: "BadgeCheck",
          badge: snapshot.approvals.length,
        }
      : null,
  ].filter(isNavItem);

  if (workspaceItems.length > 0) {
    sections.push({ label: "Workspace", items: workspaceItems });
  }

  const operationsItems = [
    viewerHasPermission(viewer, "queues.view")
      ? {
          href: workspaceHref(basePath, "/queues"),
          label: "Queues",
          icon: "KanbanSquare",
        }
      : null,
    viewerHasPermission(viewer, "archive.view")
      ? {
          href: workspaceHref(basePath, "/archive"),
          label: "History",
          icon: "History",
        }
      : null,
    viewerHasPermission(viewer, "reports.view")
      ? {
          href: workspaceHref(basePath, "/reports"),
          label: "Reports",
          icon: "ChartColumn",
        }
      : null,
    viewerHasPermission(viewer, "settings.view")
      ? {
          href: workspaceHref(basePath, "/settings"),
          label: "Settings",
          icon: "Settings2",
        }
      : null,
  ].filter(isNavItem);

  if (operationsItems.length > 0) {
    sections.push({ label: "Operations", items: operationsItems });
  }

  if (viewerHasPermission(viewer, "division.read")) {
    sections.push({
      label: "Divisions",
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
  division?: WorkspaceDivision
) {
  switch (key) {
    case "overview":
      return "Overview";
    case "tasks":
      return "My Tasks";
    case "inbox":
      return "Inbox";
    case "approvals":
      return "Approvals";
    case "queues":
      return "Queues";
    case "archive":
      return "History";
    case "reports":
      return "Reports";
    case "settings":
      return "Settings";
    case "division":
      return division ? `${getDivisionConfig(division).shortName} Module` : "Division";
    default:
      return "Workspace";
  }
}
