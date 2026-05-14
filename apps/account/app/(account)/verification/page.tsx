import { requireAccountUser } from "@/lib/auth";
import { getAccountTrustProfile, getTrustTierLabel } from "@/lib/trust";
import { getVerificationState } from "@/lib/verification";

import "@/components/verification/styles.css";
import DocumentSubmissionsClient from "@/components/verification/DocumentSubmissionsClient";
import { IdentityHero } from "@/components/verification/IdentityHero";
import { NextMoveCard } from "@/components/verification/NextMoveCard";
import { ReviewerNoteCard } from "@/components/verification/ReviewerNoteCard";
import { UnlocksRail } from "@/components/verification/UnlocksRail";

export const dynamic = "force-dynamic";

export default async function VerificationPage() {
  const user = await requireAccountUser();
  const [trust, verification] = await Promise.all([
    getAccountTrustProfile(user.id),
    getVerificationState(user.id),
  ]);
  const downloadHref =
    verification.submissions.length > 0 ? "/api/documents/kyc-summary/me" : null;
  return (
    <div className="acct-ver acct-fade-in">
      <IdentityHero
        verification={verification}
        trust={{
          tierLabel: getTrustTierLabel(trust.tier),
          score: trust.score,
          nextTierLabel: trust.nextTier ? getTrustTierLabel(trust.nextTier) : null,
        }}
        downloadHref={downloadHref}
      />
      {verification.reviewerNote ? (
        <ReviewerNoteCard note={verification.reviewerNote} />
      ) : null}
      <section className="acct-ver__section" aria-labelledby="acct-ver-trust-head">
        <div className="acct-ver__section-head">
          <h2 id="acct-ver-trust-head" className="acct-ver__section-title hc-h3 acct-display">
            Trust journey
          </h2>
          <span className="acct-ver__section-meta">
            What approval unlocks · what advances your tier
          </span>
        </div>
        <div className="acct-ver__columns">
          <UnlocksRail approved={verification.status === "verified"} />
          <NextMoveCard requirements={trust.requirements} />
        </div>
      </section>
      <section className="acct-ver__section" aria-labelledby="acct-ver-docs-head">
        <div className="acct-ver__section-head">
          <h2 id="acct-ver-docs-head" className="acct-ver__section-title hc-h3 acct-display">
            Documents
          </h2>
          <span className="acct-ver__section-meta">
            Uploads are async — you stay on this page while we review.
          </span>
        </div>
        <DocumentSubmissionsClient initialVerification={verification} />
      </section>
    </div>
  );
}
