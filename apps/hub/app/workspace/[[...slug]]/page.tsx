import { notFound, redirect } from "next/navigation";
import WorkspaceScreen from "@/app/components/workspace/WorkspaceScreen";
import {
  buildWorkspaceNav,
  canViewSection,
  parseWorkspaceSlug,
} from "@/app/lib/workspace/navigation";
import { getWorkspaceViewer } from "@/app/lib/workspace/auth";
import { getWorkspaceSnapshot } from "@/app/lib/workspace/data";
import {
  getWorkspaceRuntime,
  workspaceHref,
  workspaceLoginHref,
} from "@/app/lib/workspace/runtime";
import type { WorkspaceDivision } from "@/app/lib/workspace/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getCurrentHref(basePath: string, key: string, division?: WorkspaceDivision) {
  switch (key) {
    case "overview":
      return workspaceHref(basePath, "/");
    case "division":
      return division ? workspaceHref(basePath, `/division/${division}`) : workspaceHref(basePath, "/");
    default:
      return workspaceHref(basePath, `/${key}`);
  }
}

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const [{ slug }, viewer, runtime] = await Promise.all([params, getWorkspaceViewer(), getWorkspaceRuntime()]);

  const parsed = parseWorkspaceSlug(slug);
  if (!parsed) {
    notFound();
  }

  const currentHref = getCurrentHref(
    runtime.basePath,
    parsed.key,
    parsed.key === "division" ? parsed.division : undefined
  );

  if (!viewer.user) {
    redirect(workspaceLoginHref(currentHref, runtime.workspaceUrl));
  }

  const hasPendingAccess = viewer.user && viewer.permissions.length === 0 && parsed.key === "overview";
  if (!hasPendingAccess && !canViewSection(viewer, parsed.key)) {
    notFound();
  }

  if (
    parsed.key === "division" &&
    (!parsed.division || !viewer.divisions.some((membership) => membership.division === parsed.division))
  ) {
    notFound();
  }

  const snapshot = await getWorkspaceSnapshot(viewer, runtime.basePath);
  const nav = buildWorkspaceNav(viewer, snapshot, runtime.basePath);

  if (
    parsed.key === "division" &&
    parsed.division &&
    !snapshot.modules.some((module) => module.division === parsed.division)
  ) {
    notFound();
  }

  const divisionHrefs = Object.fromEntries(
    snapshot.modules.map((module) => [module.division, workspaceHref(runtime.basePath, `/division/${module.division}`)])
  ) as Partial<Record<WorkspaceDivision, string>>;

  return (
    <WorkspaceScreen
      viewer={viewer}
      snapshot={snapshot}
      nav={nav}
      currentKey={parsed.key}
      currentDivision={parsed.key === "division" ? parsed.division : undefined}
      currentHref={currentHref}
      workspaceUrl={runtime.workspaceUrl}
      divisionHrefs={divisionHrefs}
    />
  );
}
