import type { Metadata } from "next";
import PublicHubPage from "./(site)/page";
import WorkspacePage from "./workspace/[[...slug]]/page";
import { getWorkspaceRuntime } from "@/app/lib/workspace/runtime";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const runtime = await getWorkspaceRuntime();

  if (runtime.workspaceHost) {
    return {
      title: "Henry & Co. Staff Workspace",
      description:
        "Role-aware internal workspace for HenryCo staff, managers, operators, and shared division teams.",
    };
  }

  return {
    title: "Henry & Co. Company Hub",
    description: "Premium multi-division ecosystem for Henry & Co.",
  };
}

export default async function RootPage() {
  const runtime = await getWorkspaceRuntime();

  if (runtime.workspaceHost) {
    return <WorkspacePage params={Promise.resolve({})} />;
  }

  return <PublicHubPage />;
}
