import {
  ListTodo,
  Layers,
  ClipboardCheck,
  Bell,
} from "lucide-react";
import { RouteLiveRefresh } from "@henryco/ui";
import { requireStaff } from "@/lib/staff-auth";
import { getFilteredNavItems } from "@/lib/navigation";
import {
  StaffPageHeader,
  StaffMetricCard,
  StaffPanel,
  StaffQuickLink,
  resolveIcon,
} from "@/components/StaffPrimitives";
import { getStaffIntelligenceSnapshot } from "@/lib/intelligence-data";

export const dynamic = "force-dynamic";

export default async function StaffDashboard() {
  const viewer = await requireStaff();
  const intelligence = await getStaffIntelligenceSnapshot();
  const navItems = getFilteredNavItems(viewer);
  const workspaceLinks = navItems.filter(
    (item) => item.section === "Workspaces" || item.section === "Operations"
  );
  const staleCount = intelligence.tasks.filter((task) => task.status === "stale").length;
  const riskCount = intelligence.tasks.filter((task) => task.status === "at_risk").length;

  const firstName = viewer.user?.fullName?.split(" ")[0] || "there";

  return (
    <div className="staff-fade-in">
      <RouteLiveRefresh />
      <StaffPageHeader
        eyebrow="Staff HQ"
        title={`Welcome back, ${firstName}`}
        description="Your unified command center for Henry & Co. operations across all divisions."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StaffMetricCard
          label="Active Tasks"
          value={String(intelligence.tasks.length)}
          subtitle="Across your divisions"
          icon={ListTodo}
        />
        <StaffMetricCard
          label="Open Queues"
          value={String(intelligence.metrics.openSupport)}
          subtitle="Pending assignment"
          icon={Layers}
        />
        <StaffMetricCard
          label="Pending Approvals"
          value={String(intelligence.metrics.elevatedRisk)}
          subtitle="Awaiting review"
          icon={ClipboardCheck}
        />
        <StaffMetricCard
          label="Notifications"
          value={String(intelligence.metrics.unreadNotifications)}
          subtitle="Unread items"
          icon={Bell}
        />
      </div>

      <div className="mb-8 rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--staff-muted)]">Operational focus</p>
        <p className="mt-1 text-sm text-[var(--staff-muted)]">
          Resolve stale items first ({staleCount}), then at-risk queue items ({riskCount}) to keep customer response quality calm and predictable.
        </p>
      </div>

      <div className="mb-8">
        <h2 className="staff-kicker mb-4">Your Workspaces</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {workspaceLinks.map((item) => {
            const Icon = resolveIcon(item.icon);
            return (
              <StaffQuickLink
                key={item.href}
                href={item.href}
                label={item.label}
                description={`${item.label} operations and management`}
                icon={Icon}
              />
            );
          })}
        </div>
      </div>

      <StaffPanel title="Priority activity feed">
        <div className="space-y-3">
          {intelligence.tasks.slice(0, 6).map((task) => (
            <a
              key={task.id}
              href={task.href}
              className="block rounded-xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[var(--staff-ink)]">{task.title}</p>
                <span className="text-xs text-[var(--staff-muted)]">{task.status}</span>
              </div>
              <p className="mt-1 text-xs text-[var(--staff-muted)]">{task.summary}</p>
            </a>
          ))}
        </div>
      </StaffPanel>
    </div>
  );
}
