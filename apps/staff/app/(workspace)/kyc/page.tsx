import { ShieldCheck, FileCheck, Camera, MapPin, Building2 } from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { viewerHasPermission } from "@/lib/roles";
import {
  StaffPageHeader,
  StaffEmptyState,
  StaffMetricCard,
  StaffPanel,
  StaffStatusBadge,
} from "@/components/StaffPrimitives";
import { getKycQueue } from "@/lib/kyc-data";

export const dynamic = "force-dynamic";

const DOC_TYPE_LABEL: Record<string, string> = {
  government_id: "Government ID",
  selfie: "Selfie with ID",
  address_proof: "Proof of address",
  business_cert: "Business certificate",
};

const DOC_TYPE_ICON: Record<string, typeof FileCheck> = {
  government_id: FileCheck,
  selfie: Camera,
  address_proof: MapPin,
  business_cert: Building2,
};

function formatDate(iso: string) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

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
        {queue.queue.length === 0 ? (
          <p className="text-sm text-[var(--staff-muted)]">
            No pending KYC submissions. All documents have been reviewed.
          </p>
        ) : (
          <div className="space-y-4">
            {queue.queue.map((item) => {
              const Icon = DOC_TYPE_ICON[item.documentType] || FileCheck;
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-[var(--staff-line)] bg-[var(--staff-surface)] p-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--staff-accent-soft)]">
                      <Icon className="h-5 w-5 text-[var(--staff-accent)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[var(--staff-ink)]">
                            {item.userName}
                          </p>
                          <p className="text-xs text-[var(--staff-muted)]">
                            {item.userEmail}
                          </p>
                        </div>
                        <StaffStatusBadge
                          label={DOC_TYPE_LABEL[item.documentType] || item.documentType}
                          tone="info"
                        />
                      </div>
                      <p className="mt-2 text-xs text-[var(--staff-muted)]">
                        Submitted {formatDate(item.submittedAt)} · User ID: {item.userId.slice(0, 8)}...
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.fileUrl ? (
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full bg-[var(--staff-accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--staff-accent)] hover:opacity-80"
                          >
                            View document
                          </a>
                        ) : (
                          <span className="rounded-full bg-[var(--staff-warning-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--staff-warning)]">
                            No document file
                          </span>
                        )}
                        <form action="/api/kyc/review" method="POST" className="inline-flex gap-2">
                          <input type="hidden" name="submission_id" value={item.id} />
                          <input type="hidden" name="decision" value="approved" />
                          <button
                            type="submit"
                            className="rounded-full bg-[var(--staff-success-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--staff-success)] hover:opacity-80"
                          >
                            Approve
                          </button>
                        </form>
                        <form action="/api/kyc/review" method="POST" className="inline-flex gap-2">
                          <input type="hidden" name="submission_id" value={item.id} />
                          <input type="hidden" name="decision" value="rejected" />
                          <button
                            type="submit"
                            className="rounded-full bg-[var(--staff-critical-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--staff-critical)] hover:opacity-80"
                          >
                            Reject
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </StaffPanel>
    </div>
  );
}
