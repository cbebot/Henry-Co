import { Cog } from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { StaffPageHeader, StaffEmptyState } from "@/components/StaffPrimitives";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  await requireStaff();

  return (
    <div className="staff-fade-in">
      <StaffPageHeader
        eyebrow="Operations"
        title="Operations Center"
        description="Cross-division operational queues, escalations, and workflow management."
      />
      <StaffEmptyState
        icon={Cog}
        title="Operations center coming soon"
        description="The operations center will aggregate cross-division task queues, escalation workflows, approval pipelines, and operational alerts into a unified command surface."
      />
    </div>
  );
}
