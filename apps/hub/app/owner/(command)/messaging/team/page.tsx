import Link from "next/link";
import InternalTeamCommsClient from "@/components/owner/InternalTeamCommsClient";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";

export const dynamic = "force-dynamic";

export default function OwnerMessagingTeamPage() {
  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow="Internal communications"
        title="Team & leadership messaging"
        description="Secure owner-side channel for operational coordination. This is not customer support and never appears on public storefronts."
        actions={
          <>
            <Link href="/owner/messaging" className="acct-button-secondary">
              Delivery overview
            </Link>
            <Link href="/owner/ai" className="acct-button-primary">
              Owner assistant
            </Link>
          </>
        }
      />

      <OwnerPanel
        title="Live thread"
        description="Post updates, decisions, and handoffs. Apply migration 20260405120000_hq_internal_communications if this stays empty after refresh."
      >
        <InternalTeamCommsClient />
      </OwnerPanel>
    </div>
  );
}
