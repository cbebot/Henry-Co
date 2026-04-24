import { Mail } from "lucide-react";
import {
  NEWSLETTER_CAMPAIGN_CLASSES,
  NEWSLETTER_DIVISIONS,
  describeTopicGroupings,
} from "@henryco/newsletter";
import { requireStaff } from "@/lib/staff-auth";
import { viewerHasAnyFamily, viewerHasPermission } from "@/lib/roles";
import {
  StaffEmptyState,
  StaffPageHeader,
  StaffPanel,
} from "@/components/StaffPrimitives";
import NewsletterDraftEditor from "../NewsletterDraftEditor";

export const dynamic = "force-dynamic";

export default async function NewsletterNewDraftPage() {
  const viewer = await requireStaff();
  const canEdit =
    viewerHasAnyFamily(viewer, [
      "content_staff",
      "division_manager",
      "supervisor",
      "system_admin",
    ]) && viewerHasPermission(viewer, "division.write");

  if (!canEdit) {
    return (
      <div className="staff-fade-in">
        <StaffPageHeader eyebrow="Newsletter" title="New draft" />
        <StaffEmptyState
          icon={Mail}
          title="Editing restricted"
          description="Only content staff, division managers, supervisors, and system admins can create newsletter drafts."
        />
      </div>
    );
  }

  const groups = describeTopicGroupings();

  return (
    <div className="staff-fade-in">
      <StaffPageHeader
        eyebrow="Newsletter"
        title="New draft"
        description="Write the brief. The voice guard flags banned phrases, fabricated trust claims, and missing unsubscribe footers in real time."
      />

      <StaffPanel title="Draft editor">
        <NewsletterDraftEditor
          mode="create"
          campaignId={null}
          initialDivision="hub"
          initialCampaignClass="division_digest"
          initialTopicKeys={["company_digest"]}
          initialContent={null}
          initialStatus="draft"
          divisions={Array.from(NEWSLETTER_DIVISIONS)}
          campaignClasses={Array.from(NEWSLETTER_CAMPAIGN_CLASSES)}
          topicGroups={groups}
          canApprove={viewerHasAnyFamily(viewer, [
            "division_manager",
            "supervisor",
            "system_admin",
          ])}
        />
      </StaffPanel>
    </div>
  );
}
