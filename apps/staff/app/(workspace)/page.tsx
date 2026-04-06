import {
  ListTodo,
  Layers,
  ClipboardCheck,
  Bell,
} from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { getFilteredNavItems } from "@/lib/navigation";
import {
  StaffPageHeader,
  StaffMetricCard,
  StaffPanel,
  StaffQuickLink,
  resolveIcon,
} from "@/components/StaffPrimitives";

export const dynamic = "force-dynamic";

export default async function StaffDashboard() {
  const viewer = await requireStaff();
  const navItems = getFilteredNavItems(viewer);
  const workspaceLinks = navItems.filter(
    (item) => item.section === "Workspaces" || item.section === "Operations"
  );

  const firstName = viewer.user?.fullName?.split(" ")[0] || "there";

  return (
    <div className="staff-fade-in">
      <StaffPageHeader
        eyebrow="Staff HQ"
        title={`Welcome back, ${firstName}`}
        description="Your unified command center for Henry & Co. operations across all divisions."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StaffMetricCard
          label="Active Tasks"
          value="--"
          subtitle="Across your divisions"
          icon={ListTodo}
        />
        <StaffMetricCard
          label="Open Queues"
          value="--"
          subtitle="Pending assignment"
          icon={Layers}
        />
        <StaffMetricCard
          label="Pending Approvals"
          value="--"
          subtitle="Awaiting review"
          icon={ClipboardCheck}
        />
        <StaffMetricCard
          label="Notifications"
          value="--"
          subtitle="Unread items"
          icon={Bell}
        />
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

      <StaffPanel title="Recent Activity">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-[var(--staff-muted)]">
            No recent activity to display. Activity from your divisions will appear here.
          </p>
        </div>
      </StaffPanel>
    </div>
  );
}
