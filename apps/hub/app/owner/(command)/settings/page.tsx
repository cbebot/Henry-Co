import Link from "next/link";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { getSecurityCenterData } from "@/lib/owner-data";

export const dynamic = "force-dynamic";

export default async function OwnerSettingsPage() {
  const data = await getSecurityCenterData();

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow="Settings & Security"
        title="Privilege, audit, and system visibility"
        description="Owner-only settings now live inside the unified dashboard rather than inside separate division owner dashboards."
        actions={
          <>
            <Link href="/owner/settings/security" className="acct-button-secondary">Security</Link>
            <Link href="/owner/settings/comms" className="acct-button-secondary">Communication rules</Link>
            <Link href="/owner/settings/audit" className="acct-button-primary">Audit log</Link>
          </>
        }
      />

      <OwnerPanel title="System summary" description="High-level privilege and audit state.">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 text-sm text-[var(--acct-muted)]">
          <div className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">Active owner profiles: {data.metrics.owners}</div>
          <div className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">Suspended users: {data.metrics.suspendedUsers}</div>
          <div className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">Pending invites: {data.metrics.pendingInvites}</div>
          <div className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">Risky audit events: {data.metrics.riskyEvents}</div>
        </div>
      </OwnerPanel>
    </div>
  );
}
