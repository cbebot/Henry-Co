import { getDivisionUrl } from "@henryco/config";
import {
  AlertTriangle,
  Building2,
  Globe2,
  MapPinned,
  MessageCircleMore,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { getPropertyOpsSummary } from "@/lib/property-ops";
import {
  StaffEmptyState,
  StaffMetricCard,
  StaffPageHeader,
  StaffPanel,
  StaffStatusBadge,
} from "@/components/StaffPrimitives";
import { StaffWorkspaceLaunchpad } from "@/components/StaffWorkspaceLaunchpad";

export const dynamic = "force-dynamic";

export default async function PropertyPage() {
  const viewer = await requireStaff();
  const hasProperty = viewer.divisions.some((d) => d.division === "property");

  if (!hasProperty) {
    return (
      <div className="staff-fade-in">
        <StaffPageHeader eyebrow="Workspace" title="Property Operations" />
        <StaffEmptyState
          icon={Building2}
          title="Access restricted"
          description="You do not have access to the Property division. Contact your manager if you believe this is an error."
        />
      </div>
    );
  }

  const summary = await getPropertyOpsSummary();

  return (
    <div className="staff-fade-in">
      <StaffPageHeader
        eyebrow="Workspace"
        title="Property Operations"
        description="Manage property listings, inquiries, viewings, agent relationships, and the trust signals that should never stay hidden from operators."
      />
      <div className="mb-6 grid gap-4 xl:grid-cols-4">
        <StaffMetricCard
          label="Live listings"
          value={String(summary.liveListings)}
          subtitle="Listings currently discoverable on the public property surface."
          icon={Building2}
        />
        <StaffMetricCard
          label="Pending trust review"
          value={String(summary.pendingListings)}
          subtitle="Listings still waiting on documents, review, or inspection-sensitive clearance."
          icon={ShieldCheck}
        />
        <StaffMetricCard
          label="Open inquiries"
          value={String(summary.openInquiries)}
          subtitle="Active lead records that still require follow-through."
          icon={MessageCircleMore}
        />
        <StaffMetricCard
          label="Open viewings"
          value={String(summary.openViewings)}
          subtitle="Viewing requests currently being scheduled, confirmed, or completed."
          icon={MapPinned}
        />
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <StaffPanel title="Trust watchlist">
          {summary.riskRows.length ? (
            <div className="space-y-3">
              {summary.riskRows.map((row) => (
                <div
                  key={`${row.label}-${row.detail}`}
                  className="rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--staff-ink)]">{row.label}</p>
                    <StaffStatusBadge
                      label={row.tone === "critical" ? "Manual review" : "Check defaults"}
                      tone={row.tone === "critical" ? "critical" : "warning"}
                    />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--staff-muted)]">
                    {row.detail}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <StaffEmptyState
              icon={ShieldCheck}
              title="No visible trust watchlist items"
              description="Duplicate-contact signals and regional-default mismatches will surface here when they need operator review."
            />
          )}
        </StaffPanel>

        <StaffPanel title="Shared-account checks">
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-[var(--staff-warning)]" />
                <div>
                  <p className="text-sm font-semibold text-[var(--staff-ink)]">
                    Duplicate email groups
                  </p>
                  <p className="text-xs text-[var(--staff-muted)]">
                    {summary.duplicateEmailCount} masked groups currently need manual trust review.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] p-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-[var(--staff-warning)]" />
                <div>
                  <p className="text-sm font-semibold text-[var(--staff-ink)]">
                    Duplicate phone groups
                  </p>
                  <p className="text-xs text-[var(--staff-muted)]">
                    {summary.duplicatePhoneCount} masked groups can affect payouts, property trust, and seller escalation.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] p-4">
              <div className="flex items-center gap-3">
                <Globe2 className="h-5 w-5 text-[var(--staff-accent)]" />
                <div>
                  <p className="text-sm font-semibold text-[var(--staff-ink)]">
                    Regional default mismatches
                  </p>
                  <p className="text-xs text-[var(--staff-muted)]">
                    {summary.regionalMismatchCount} non-Nigerian profiles still carry stale NGN or Lagos defaults and should be corrected.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </StaffPanel>
      </div>

      <StaffWorkspaceLaunchpad
        overview="HenryCo Property already exposes owner, admin, operations, moderation, and agent routes. This staff surface now adds the missing trust and regional watchlist so operators can see duplicate-contact and profile-default issues before they spill into listings, payouts, or approvals."
        links={[
          {
            href: `${getDivisionUrl("property")}/owner`,
            label: "Owner overview",
            description: "Inspect listing readiness, trust posture, and platform signals.",
            icon: Building2,
            readiness: "live",
          },
          {
            href: `${getDivisionUrl("property")}/operations`,
            label: "Operations",
            description: "Run viewing coordination, inquiry handling, and property ops.",
            icon: MapPinned,
            readiness: "live",
          },
          {
            href: `${getDivisionUrl("property")}/moderation`,
            label: "Moderation",
            description: "Review listing trust and moderation-sensitive workflow actions.",
            icon: ShieldCheck,
            readiness: "live",
          },
          {
            href: `${getDivisionUrl("property")}/agent`,
            label: "Agent surface",
            description: "Verify what agents can actually see and action on the live site.",
            icon: UserRound,
            readiness: "live",
          },
        ]}
      />
    </div>
  );
}
