import { ShieldCheck } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getAccountTrustProfile, getTrustTierLabel } from "@/lib/trust";
import { getVerificationState } from "@/lib/verification";
import PageHeader from "@/components/layout/PageHeader";
import VerificationWorkspaceClient from "@/components/verification/VerificationWorkspaceClient";

export default async function VerificationWorkspace() {
  const user = await requireAccountUser();
  const [trust, verification] = await Promise.all([
    getAccountTrustProfile(user.id),
    getVerificationState(user.id),
  ]);

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title="Verification"
        description="Real document review, honest trust scoring, and the exact actions that stay gated until identity truth is established."
        icon={ShieldCheck}
      />

      <VerificationWorkspaceClient
        initialVerification={verification}
        trust={{
          tierLabel: getTrustTierLabel(trust.tier),
          score: trust.score,
          nextTierLabel: trust.nextTier ? getTrustTierLabel(trust.nextTier) : null,
          requirements: trust.requirements,
        }}
      />
    </div>
  );
}
