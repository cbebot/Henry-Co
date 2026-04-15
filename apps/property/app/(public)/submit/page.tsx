import Link from "next/link";
import { getAccountUrl } from "@henryco/config";
import { PropertyPublicAuthGate } from "@/components/property/public-auth-gate";
import { PropertySectionIntro } from "@/components/property/ui";
import { PropertySubmissionForm } from "@/components/property/submit/PropertySubmissionForm";
import { getPropertyViewer } from "@/lib/property/auth";
import { getPropertySnapshot } from "@/lib/property/data";
import {
  getPropertyOrigin,
  getSharedAccountLoginUrl,
  getSharedAccountSignupUrl,
} from "@/lib/property/links";

export const dynamic = "force-dynamic";

export default async function SubmitListingPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; policy?: string; verification?: string }>;
}) {
  const params = await searchParams;
  const snapshot = await getPropertySnapshot();
  const viewer = await getPropertyViewer();
  const propertyOrigin = getPropertyOrigin();
  const submitLoginHref = getSharedAccountLoginUrl({ nextPath: "/submit", propertyOrigin });
  const submitSignupHref = getSharedAccountSignupUrl({ nextPath: "/submit", propertyOrigin });

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-10 sm:px-8 lg:px-10">
      <PropertySectionIntro
        kicker="Submit"
        title="Submit a property for editorial review, trust checks, and premium marketing."
        description="Owners and agents can submit listings with media, verification documents, and contact context. HenryCo Property reviews the submission before it becomes public."
      />

      {params.submitted === "1" ? (
        <div className="mt-6 rounded-[1.8rem] border border-[rgba(152,179,154,0.3)] bg-[rgba(152,179,154,0.12)] px-5 py-4 text-sm text-[var(--property-sage-soft)]">
          Listing submitted. HenryCo Property logged the record, queued moderation, and routed the
          follow-up notification flow.
          {params.policy ? (
            <span className="block pt-2 text-[var(--property-ink-soft)]">
              Current policy state: {params.policy.replaceAll("_", " ")}.
            </span>
          ) : null}
        </div>
      ) : null}
      {params.verification && params.verification !== "verified" ? (
        <div className="mt-4 rounded-[1.8rem] border border-[rgba(190,131,58,0.35)] bg-[rgba(190,131,58,0.12)] px-5 py-4 text-sm text-[var(--property-ink)]">
          Higher-risk property submissions stay in eligibility review until your HenryCo identity verification is approved.
          <div className="mt-3">
            <Link href={getAccountUrl("/verification")} className="inline-flex rounded-full bg-[var(--property-ink)] px-4 py-2 text-xs font-semibold text-white">
              Open account verification
            </Link>
          </div>
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="property-panel rounded-[2.3rem] p-6 sm:p-8">
          <div className="property-kicker">Submission standards</div>
          <div className="mt-6 space-y-4">
            {[
              ["Editorial review", "Weak copy, weak media, and unclear pricing do not go public untouched."],
              ["Trust checks", "Owner details, verification files, and readiness notes are attached before approval."],
              ["Managed upsell path", "Relevant submissions can move into HenryCo managed-property operations after review."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-5">
                <div className="text-xl font-semibold text-[var(--property-ink)]">{title}</div>
                <p className="mt-2 text-sm leading-7 text-[var(--property-ink-soft)]">{body}</p>
              </div>
            ))}
          </div>

          {viewer.user ? (
            <div className="mt-6 rounded-[1.8rem] border border-[var(--property-line)] bg-black/10 p-5 text-sm leading-7 text-[var(--property-ink-soft)]">
              Signed in as{" "}
              <span className="font-semibold text-[var(--property-ink)]">{viewer.user.email}</span>. Your submission
              will be linked to this HenryCo account for moderation and follow-up.
            </div>
          ) : (
            <div className="mt-6">
              <PropertyPublicAuthGate
                title="Sign in to submit a listing"
                description="Listing submissions require a HenryCo account so verification documents, moderation, and owner communications stay auditable and secure."
                loginHref={submitLoginHref}
                signupHref={submitSignupHref}
              />
            </div>
          )}
        </section>

        <section id="submission" className="property-panel rounded-[2.3rem] p-6 sm:p-8">
          {viewer.user ? (
            <PropertySubmissionForm
              areas={snapshot.areas.map((area) => ({ id: area.id, slug: area.slug, name: area.name }))}
              defaults={{ fullName: viewer.user.fullName || "", email: viewer.user.email || "" }}
            />
          ) : (
            <div className="rounded-[1.8rem] border border-[var(--property-line)] bg-black/10 p-6 text-sm text-[var(--property-ink-soft)]">
              The listing form unlocks after you sign in. Use the panel on the left, or{" "}
              <Link href={submitLoginHref} className="font-semibold text-[var(--property-ink)] underline-offset-4 hover:underline">
                sign in here
              </Link>
              .
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
