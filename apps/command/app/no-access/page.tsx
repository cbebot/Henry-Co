import { ConsoleShell, NoAccess } from "@henryco/command-surface";

export const metadata = { title: "Access restricted — Henry Onyx Command Center" };

export default function NoAccessPage() {
  return (
    <ConsoleShell surfaceLabel="Command Center" title="Access restricted" descriptor="Owner access required.">
      <NoAccess surfaceLabel="Owner Command Center" viewerLabel="non-owner" />
    </ConsoleShell>
  );
}