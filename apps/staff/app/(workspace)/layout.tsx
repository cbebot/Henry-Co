import type { ReactNode } from "react";
import { requireStaff } from "@/lib/staff-auth";
import { getFilteredNavItems, getNavSections } from "@/lib/navigation";
import StaffSidebar from "@/components/StaffSidebar";
import StaffMobileNav from "@/components/StaffMobileNav";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const viewer = await requireStaff();

  const filteredItems = getFilteredNavItems(viewer);
  const sections = getNavSections(filteredItems);
  const divisionSet = viewer.divisions.map((d) => d.division);
  const hasExecutiveAccess = viewer.permissions.includes("staff.directory.view");

  const sidebarViewer = {
    fullName: viewer.user?.fullName || null,
    email: viewer.user?.email || null,
    profileRole: viewer.user?.profileRole || null,
    hasExecutiveAccess,
  };

  return (
    <div className="min-h-screen bg-[var(--staff-bg)] text-[var(--staff-ink)]">
      <StaffMobileNav viewer={sidebarViewer} sections={sections} />
      <StaffSidebar
        viewer={sidebarViewer}
        sections={sections}
        divisionSet={divisionSet}
      />
      <main className="min-h-screen pt-14 transition-[padding] duration-200 lg:pt-0 lg:pl-[var(--staff-sidebar-width)]">
        <div className="staff-backdrop pointer-events-none fixed inset-0 -z-10" />
        <div className="relative mx-auto max-w-[1680px] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
          {children}
        </div>
      </main>
    </div>
  );
}
