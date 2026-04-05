import { Users } from "lucide-react";
import MetricCard from "@/components/owner/MetricCard";
import StaffMemberCard from "@/components/owner/StaffMemberCard";
import { OwnerNotice, OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { getWorkforceCenterData } from "@/lib/owner-data";

export const dynamic = "force-dynamic";

export default async function WorkforceCenterPage() {
  const data = await getWorkforceCenterData();

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow="Staff & Workforce Center"
        title="Central workforce control"
        description="Invite people, assign division-scoped roles, set permissions, and suspend access from one workforce console."
      />

      <OwnerNotice tone="info" title="How updates are saved" body={data.dataHealthNote} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Total members" value={data.metrics.total} subtitle="Accounts linked to HenryCo" icon={Users} />
        <MetricCard label="Active" value={data.metrics.active} subtitle="Recently active staff" icon={Users} />
        <MetricCard label="Pending" value={data.metrics.pending} subtitle="Invited or unactivated" icon={Users} />
        <MetricCard label="Suspended" value={data.metrics.suspended} subtitle="Access currently blocked" icon={Users} />
        <MetricCard label="Owners" value={data.metrics.owners} subtitle="Owner profiles with active access" icon={Users} />
        <MetricCard label="Managers" value={data.metrics.managers} subtitle="Management layer currently assigned" icon={Users} />
      </div>

      <OwnerPanel title="Workforce distribution" description="Division-level headcount and onboarding pressure.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {data.divisionSummary.map((division) => (
            <div key={division.slug} className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
              <div className="text-sm font-semibold text-[var(--acct-ink)]">{division.label}</div>
              <p className="mt-2 text-xs text-[var(--acct-muted)]">Active {division.active} · Pending {division.pending} · Suspended {division.suspended}</p>
            </div>
          ))}
        </div>
      </OwnerPanel>

      <OwnerPanel title="Staff records" description="Choose a division-scoped role, then tick the permissions that apply. Division managers only apply to the division you select.">
        <div className="space-y-4">
          {data.members.map((member) => (
            <StaffMemberCard key={member.id} member={member} />
          ))}
        </div>
      </OwnerPanel>
    </div>
  );
}
