import { ConsoleShell, NoAccess } from "@henryco/command-surface";

export const metadata = { title: "Access restricted — Henry Onyx Staff Workspace" };

export default function NoAccessPage() {
  return (
    <ConsoleShell surfaceLabel="Staff Workspace" title="Access restricted" descriptor="Staff access required.">
      <NoAccess surfaceLabel="Staff Workspace" viewerLabel="non-staff" />
    </ConsoleShell>
  );
}