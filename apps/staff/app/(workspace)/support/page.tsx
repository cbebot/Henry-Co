import { Headphones } from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { StaffPageHeader, StaffEmptyState } from "@/components/StaffPrimitives";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  await requireStaff();

  return (
    <div className="staff-fade-in">
      <StaffPageHeader
        eyebrow="Workspace"
        title="Support Desk"
        description="Cross-division support queue for customer and internal requests."
      />
      <StaffEmptyState
        icon={Headphones}
        title="Support desk coming soon"
        description="The support queue will connect to cross-division support threads, tickets, and escalation workflows across all Henry & Co. services."
      />
    </div>
  );
}
