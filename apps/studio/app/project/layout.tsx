import { ProjectWorkspaceHeader } from "@/components/studio/project-workspace-header";

/**
 * V3-INNER-L-STUDIO-TAIL — the access-key project workspace runs on
 * Register L. `/project/[id]` is the no-login customer money path (authed
 * owners are redirected to /client/projects/[id] in the page); access-key
 * visitors and staff render here. Mounting `.studio-workspace-light`
 * re-grounds the studio tokens onto the shared light-primary Henry Onyx
 * dashboard register with the configured teal accent. Dark is the
 * device-preference flip, not the default. See app/globals.css.
 */
export default function ProjectRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="studio-workspace-light studio-page studio-shell min-h-screen">
      <ProjectWorkspaceHeader />
      {children}
    </div>
  );
}
