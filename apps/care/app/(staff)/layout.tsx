/*
 * Care staff route-group layout.
 *
 * V3 Wave B1 — removed the prior 6-line redirect to a broken staffhq
 * host (audit §A.17). The redirect made every staff-side care route
 * unreachable. Track C will migrate this surface to
 * apps/staff/(workspace)/care; until then the pass-through layout keeps
 * the existing operator pages functional in-app.
 */
export default function CareStaffShellLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
