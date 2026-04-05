import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import InviteStaffForm from "@/components/owner/InviteStaffForm";

export const dynamic = "force-dynamic";

export default function InviteStaffPage() {
  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow="Invite workforce"
        title="Add managers and staff"
        description="Send a secure invitation, assign a division when the role is division-scoped, and choose permissions from the catalogue—no manual codes to type."
      />

      <OwnerPanel title="New team member" description="We record every invite in the workforce audit log when the row is available.">
        <InviteStaffForm />
      </OwnerPanel>
    </div>
  );
}
