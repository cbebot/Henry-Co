import { FileCheck, ShieldCheck } from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { viewerHasPermission } from "@/lib/roles";
import {
  StaffPageHeader,
  StaffEmptyState,
  StaffMetricCard,
  StaffPanel,
} from "@/components/StaffPrimitives";
import KycReviewQueueClient from "@/components/kyc/KycReviewQueueClient";
import { getKycQueue } from "@/lib/kyc-data";

export const dynamic = "force-dynamic";

export default async function KycPage() {
  const viewer = await requireStaff();
  const hasModerate = viewerHasPermission(viewer, "division.moderate");

  if (!hasModerate) {
    return (
      <div className="staff-fade-in">
        <StaffPageHeader eyebrow="Operations" title="KYC Review" />
        <StaffEmptyState
          icon={ShieldCheck}
          title="Access restricted"
          description="You do not have moderation permissions. Contact your manager if you need access to the KYC review queue."
        />
      </div>
    );
  }

  const queue = await getKycQueue();

  return (
    <div className="staff-fade-in">
      <StaffPageHeader
        eyebrow="Operations"
        title="KYC Review Queue"
        description="Review identity documents submitted by users for verification. Approve or reject with notes to complete the review."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StaffMetricCard
          label="Pending review"
          value={String(queue.pendingCount)}
          subtitle="Documents awaiting decision"
          icon={ShieldCheck}
        />
        <StaffMetricCard
          label="Approved today"
          value={String(queue.approvedToday)}
          subtitle="Cleared for verified status"
          icon={FileCheck}
        />
        <StaffMetricCard
          label="Rejected today"
          value={String(queue.rejectedToday)}
          subtitle="Sent back for resubmission"
          icon={ShieldCheck}
        />
      </div>

      <StaffPanel title="Pending submissions">
        <KycReviewQueueClient initialQueue={queue.queue} />
      </StaffPanel>
    </div>
  );
}
