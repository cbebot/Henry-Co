import Link from "next/link";
import { notFound } from "next/navigation";
import { getAccountUrl } from "@henryco/config";
import StaffMemberCard from "@/components/owner/StaffMemberCard";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { getWorkforceMemberById, getWorkforceCenterData } from "@/lib/owner-data";
import { divisionLabel, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function StaffUserIntelligencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await getWorkforceMemberById(id);
  if (!member) {
    notFound();
  }

  const center = await getWorkforceCenterData();
  const recentForMember = center.audit.filter((row: Record<string, unknown>) =>
    JSON.stringify(row).includes(member.id)
  );

  const accountHome = getAccountUrl("/");

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow="Staff intelligence"
        title={member.fullName}
        description={
          member.email
            ? `${member.email} · ${member.status} · ${member.division ? divisionLabel(member.division) : "Unassigned"}`
            : `${member.status} · ${member.division ? divisionLabel(member.division) : "Unassigned"}`
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/owner/staff/directory" className="acct-button-secondary rounded-xl text-sm">
              Back to directory
            </Link>
            {member.email ? (
              <a href={`mailto:${member.email}`} className="acct-button-primary rounded-xl text-sm">
                Email
              </a>
            ) : null}
          </div>
        }
      />

      <OwnerPanel
        title="Identity & access summary"
        description="Readable identifiers first — technical IDs are secondary. Use the card below to change roles or permissions."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
            <div className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[var(--acct-muted)]">Display name</div>
            <div className="mt-1 text-lg font-semibold text-[var(--acct-ink)]">{member.fullName}</div>
          </div>
          <div className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
            <div className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[var(--acct-muted)]">Email</div>
            <div className="mt-1 text-sm font-medium text-[var(--acct-ink)]">{member.email || "—"}</div>
          </div>
          <div className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
            <div className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[var(--acct-muted)]">Division</div>
            <div className="mt-1 text-sm text-[var(--acct-ink)]">
              {member.division ? divisionLabel(member.division) : "Unassigned"}
            </div>
          </div>
          <div className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
            <div className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[var(--acct-muted)]">Activity</div>
            <div className="mt-1 text-sm text-[var(--acct-ink)]">
              {member.lastSeen ? `Last seen ${timeAgo(String(member.lastSeen))}` : "No sign-in yet"}
            </div>
          </div>
          <div className="md:col-span-2 rounded-[1.25rem] border border-dashed border-[var(--acct-line)] bg-[var(--acct-bg)] p-4">
            <div className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[var(--acct-muted)]">Technical user id</div>
            <code className="mt-1 block break-all text-xs text-[var(--acct-muted)]">{member.id}</code>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <a href={accountHome} className="acct-button-secondary rounded-xl text-sm">
            Open shared account app
          </a>
          <Link href="/owner/settings/audit" className="acct-button-ghost rounded-xl text-sm">
            View audit log
          </Link>
        </div>
      </OwnerPanel>

      {recentForMember.length > 0 ? (
        <OwnerPanel title="Recent workforce audit (this member)" description="Rows from staff_audit_logs referencing this user when available.">
          <ul className="space-y-2 text-sm text-[var(--acct-muted)]">
            {recentForMember.slice(0, 8).map((row, idx) => (
              <li key={idx} className="rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-3 py-2">
                <span className="font-medium text-[var(--acct-ink)]">{String(row.action || row.event_type || "event")}</span>
                <span className="mx-2 text-[var(--acct-muted)]">·</span>
                <span>{String(row.created_at || "")}</span>
              </li>
            ))}
          </ul>
        </OwnerPanel>
      ) : null}

      <OwnerPanel title="Role & permissions" description="Changes save to the member’s HenryCo profile and are audited.">
        <StaffMemberCard member={member} showIntelligenceLink={false} showCardIdentityHeader={false} />
      </OwnerPanel>
    </div>
  );
}
