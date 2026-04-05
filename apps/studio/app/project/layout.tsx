import { ProjectWorkspaceHeader } from "@/components/studio/project-workspace-header";

export default function ProjectRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="studio-page studio-shell min-h-screen">
      <ProjectWorkspaceHeader />
      {children}
    </div>
  );
}
