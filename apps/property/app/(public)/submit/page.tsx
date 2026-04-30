import Link from "next/link";
import { ArrowRight, FileCheck2, ShieldCheck, Sparkles } from "lucide-react";
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

const standards = [
  {
    icon: Sparkles,
    title: "Service-aware routing",
    body: "Residential, commercial, managed, agent-assisted, and inspection-led submissions do not all face the same evidence or review path.",
  },
  {
    icon: FileCheck2,
    title: "Direct trust uploads",
    body: "Authority proof, ownership evidence, management instructions, and supporting files upload directly into the review record.",
  },
  {
    icon: ShieldCheck,
    title: "Managed vs non-managed clarity",
    body: "Managed submissions imply HenryCo operational involvement after acceptance. Non-managed listings can still be reviewed without pretending HenryCo is running them.",
  },
];

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
        title="Submit through the right trust path."
        description="Each submission is routed by service type, authority reality, inspection sensitivity, and account trust. The form adapts to the path; documents upload directly; the listing stays private until governance clears it."
      />

      {params.submitted === "1" ? (
        <div className="mt-8 border-l-2 border-[rgba(152,179,154,0.55)] pl-5">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--property-sage-soft)]">
            Submitted
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--property-ink-soft)]">
            HenryCo Property logged the record, queued moderation, and routed the follow-up
            notification flow.
            {params.policy ? (
              <span className="block pt-2">
                Current policy state: {params.policy.replaceAll("_", " ")}.
              </span>
            ) : null}
          </p>
        </div>
      ) : null}
      {params.verification && params.verification !== "verified" ? (
        <div className="mt-4 border-l-2 border-[rgba(190,131,58,0.6)] pl-5">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--property-accent-strong)]">
            Verification pending
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--property-ink-soft)]">
            Higher-risk property submissions stay in eligibility review until your HenryCo identity
            verification is approved.
          </p>
          <Link
            href={getAccountUrl("/verification")}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--property-ink)] px-4 py-2 text-xs font-semibold text-white"
          >
            Open account verification
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      ) : null}

      <section className="mt-12">
        <p className="property-kicker text-[10.5px] uppercase tracking-[0.28em]">
          Submission standards
        </p>
        <ul className="mt-6 grid gap-10 lg:grid-cols-3 lg:divide-x lg:divide-[var(--property-line)]">
          {standards.map((item, i) => {
            const Icon = item.icon;
            return (
              <li key={item.title} className={i > 0 ? "lg:pl-10" : ""}>
                <Icon
                  className="h-5 w-5 text-[var(--property-accent-strong)]"
                  aria-hidden
                />
                <h3 className="mt-4 text-base font-semibold tracking-tight text-[var(--property-ink)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-[var(--property-ink-soft)]">{item.body}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section id="submission" className="mt-14 grid gap-12 xl:grid-cols-[0.95fr_1.05fr] xl:divide-x xl:divide-[var(--property-line)]">
        <div>
          <p className="property-kicker text-[10.5px] uppercase tracking-[0.28em]">
            Account context
          </p>
          {viewer.user ? (
            <div className="mt-5 border-l-2 border-[var(--property-accent-strong)]/55 pl-5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--property-accent-strong)]">
                Signed in
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--property-ink-soft)]">
                Signed in as{" "}
                <span className="font-semibold text-[var(--property-ink)]">
                  {viewer.user.email}
                </span>
                . Your submission will be linked to this HenryCo account for moderation,
                identity-aware trust review, and follow-up.
              </p>
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

          <div className="mt-8 border-l-2 border-[var(--property-accent-strong)]/55 pl-5">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--property-accent-strong)]">
              What happens next
            </p>
            <ol className="mt-3 space-y-2 text-sm leading-7 text-[var(--property-ink-soft)]">
              <li>1. Submission saved privately and routed to the right trust path.</li>
              <li>2. Documents read; eligibility and authority assessed.</li>
              <li>3. Inspection scheduled if the path requires it.</li>
              <li>4. Editorial review, approval, then publication if quality holds.</li>
            </ol>
          </div>
        </div>

        <div className="xl:pl-12">
          <p className="property-kicker text-[10.5px] uppercase tracking-[0.28em]">
            Listing form
          </p>
          {viewer.user ? (
            <div className="mt-6">
              <PropertySubmissionForm
                areas={snapshot.areas.map((area) => ({
                  id: area.id,
                  slug: area.slug,
                  name: area.name,
                }))}
                defaults={{
                  fullName: viewer.user.fullName || "",
                  email: viewer.user.email || "",
                }}
              />
            </div>
          ) : (
            <p className="mt-6 border-l-2 border-[var(--property-line)] pl-5 text-sm leading-7 text-[var(--property-ink-soft)]">
              The listing form unlocks after you sign in. Use the panel on the left, or{" "}
              <Link
                href={submitLoginHref}
                className="font-semibold text-[var(--property-ink)] underline-offset-4 hover:underline"
              >
                sign in here
              </Link>
              .
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
