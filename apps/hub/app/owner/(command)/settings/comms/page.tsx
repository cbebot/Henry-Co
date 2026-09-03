import Link from "next/link";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { Megaphone, MessagesSquare, Shield, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default function OwnerCommsGovernancePage() {
  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow="Governance"
        title="Internal communication rules"
        description="Henry Onyx HQ separates customer-facing channels from owner and staff messaging. These rules define how rooms are created, who can post, and where escalation belongs. Enforcement combines database row-level security, API checks, and the room types you create under Team internal chat."
        actions={
          <>
            <Link href="/owner/messaging/team" className="acct-button-primary">
              Open team chat
            </Link>
            <Link href="/owner/staff/roles" className="acct-button-secondary">
              Roles & permissions
            </Link>
          </>
        }
      />

      <OwnerPanel
        title="Owner authority"
        description="You can open governed rooms, pin channels, and direct operational discussion without exposing internal traffic to public sites."
      >
        <ul className="space-y-3 text-sm leading-6 text-[var(--acct-muted)]">
          <li className="flex gap-3">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[var(--acct-gold)]" />
            <span>
              <span className="font-semibold text-[var(--acct-ink)]">Cross-division DMs: </span>
              Restricted by role; owners retain override to start threads with managers and leads when
              policy allows. Membership is gated by database access policies maintained with the Hub schema.
            </span>
          </li>
          <li className="flex gap-3">
            <MessagesSquare className="mt-0.5 h-4 w-4 shrink-0 text-[var(--acct-gold)]" />
            <span>
              <span className="font-semibold text-[var(--acct-ink)]">Room types: </span>
              Group, broadcast, announcement, and direct rooms carry different expectations—use
              announcement-first rooms for policy pushes; group rooms for approvals and incidents.
            </span>
          </li>
          <li className="flex gap-3">
            <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-[var(--acct-gold)]" />
            <span>
              <span className="font-semibold text-[var(--acct-ink)]">Retention & audit: </span>
              Messages are queryable for search and unread counts; destructive edits are not the default—
              prefer follow-up messages for corrections so history stays defensible.
            </span>
          </li>
          <li className="flex gap-3">
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-[var(--acct-gold)]" />
            <span>
              <span className="font-semibold text-[var(--acct-ink)]">Operators & leadership: </span>
              <span className="font-medium text-[var(--acct-ink)]">staff.</span> is the live staff
              workspace host. The older <span className="font-medium text-[var(--acct-ink)]">workspace.</span>{" "}
              hostname is now treated as a legacy alias and should not be used in new links. Use{" "}
              <span className="font-medium text-[var(--acct-ink)]">Team internal chat</span> in HQ for
              coordination, division subdomains only where those apps still expose live consoles, and HQ
              division rooms when a subdomain surface is intentionally retired.
            </span>
          </li>
        </ul>
      </OwnerPanel>

      <OwnerPanel title="Voice / live sessions" description="Not yet available.">
        <p className="text-sm leading-6 text-[var(--acct-muted)]">
          Live voice and group calls are not available in HQ yet. Keep sensitive topics in
          authenticated HQ messaging.
        </p>
      </OwnerPanel>
    </div>
  );
}
