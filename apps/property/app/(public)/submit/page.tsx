import Link from "next/link";
import { ArrowRight, FileCheck2, ShieldCheck, Sparkles } from "lucide-react";
import { BRAND_EMAILS, getAccountUrl } from "@henryco/config";
import { translateSurfaceLabel } from "@henryco/i18n";
import { PropertyPublicAuthGate } from "@/components/property/public-auth-gate";
import { PropertySectionIntro } from "@/components/property/ui";
import { PropertySubmissionForm } from "@/components/property/submit/PropertySubmissionForm";
import { isAiSurfaceEnabled } from "@henryco/ai-gateway";
import { DraftListingPanel } from "@/components/property/ai/DraftListingPanel";
import { VerifyListingPanel } from "@/components/property/ai/VerifyListingPanel";
import { getPropertyViewer } from "@/lib/property/auth";
import { getPropertySnapshot } from "@/lib/property/data";
import { getPropertyPublicLocale } from "@/lib/locale-server";
import {
  getPropertyOrigin,
  getSharedAccountLoginUrl,
  getSharedAccountSignupUrl,
} from "@/lib/property/links";

export const dynamic = "force-dynamic";

// Flag-dark: the metered "Draft with Henry Onyx Intelligence" assist renders only when the
// company turns it on (and the global AI kill switch is enabled — the gateway enforces that).
const PROPERTY_AI_LISTING_ASSIST = isAiSurfaceEnabled(process.env.PROPERTY_AI_LISTING_ASSIST, process.env);
const PROPERTY_AI_LISTING_VERIFY = isAiSurfaceEnabled(process.env.PROPERTY_AI_LISTING_VERIFY, process.env);

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
    body: "Managed submissions imply Henry Onyx operational involvement after acceptance. Non-managed listings can still be reviewed without pretending Henry Onyx is running them.",
  },
];

export default async function SubmitListingPage({
  searchParams,
}: {
  searchParams: Promise<{
    submitted?: string;
    policy?: string;
    verification?: string;
    ref?: string;
  }>;
}) {
  const params = await searchParams;
  const snapshot = await getPropertySnapshot();
  const viewer = await getPropertyViewer();
  const locale = await getPropertyPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const propertyOrigin = getPropertyOrigin();
  const submitLoginHref = getSharedAccountLoginUrl({ nextPath: "/submit", propertyOrigin });
  const submitSignupHref = getSharedAccountSignupUrl({ nextPath: "/submit", propertyOrigin });

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-10 sm:px-8 lg:px-10">
      <PropertySectionIntro
        kicker={t("Submit")}
        title={t("Submit through the right trust path.")}
        description={t(
          "Each submission is routed by service type, authority reality, inspection sensitivity, and account trust. The form adapts to the path; documents upload directly; the listing stays private until governance clears it.",
        )}
      />

      {params.submitted === "1" ? (
        // Submission confirmation — refined editorial treatment.
        // Governance info preserved (reference + stage + expected window
        // + contact path) per CHROME-02 contract; only the visual
        // treatment is restated. Three-column ledger on desktop, single
        // column on mobile, hairline divides instead of nested cards.
        <div
          className="
            mt-8 overflow-hidden rounded-[1.4rem]
            border border-[color:color-mix(in_srgb,var(--property-sage)_36%,transparent)]
            bg-gradient-to-br from-[color:color-mix(in_srgb,var(--property-sage)_12%,transparent)] via-transparent to-[color:var(--home-accent-soft)]
          "
        >
          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:justify-between sm:gap-10 sm:p-8">
            <div className="max-w-xl">
              <p className="inline-flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.24em] text-[var(--property-sage-soft)]">
                <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--property-sage-soft)]" />
                {t("Submission received")}
              </p>
              <h2 className="mt-3 text-balance text-[1.25rem] font-semibold leading-[1.2] tracking-[-0.014em] text-[var(--property-ink)] sm:text-[1.5rem]">
                {t("Your listing is under review and stays private until governance clears it.")}
              </h2>
              <p className="mt-3 max-w-md text-[13.5px] leading-7 text-[var(--property-ink-soft)]">
                {t(
                  "Quote the reference when you write in. Edits and additional evidence land directly on the same record.",
                )}
              </p>
            </div>

            {/* Ledger column — three rows on a hairline rail. No nested
                cards. Tabular numerals, accent-strong reference. */}
            <dl className="w-full max-w-md divide-y divide-[var(--property-line)] border-y border-[var(--property-line)] sm:w-auto">
              {params.ref ? (
                <div className="flex items-baseline justify-between gap-6 py-3">
                  <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-muted)]">
                    {t("Reference")}
                  </dt>
                  <dd className="break-all text-right text-[13px] font-semibold tracking-[-0.005em] tabular-nums text-[var(--property-accent-strong)]">
                    {params.ref}
                  </dd>
                </div>
              ) : null}
              <div className="flex items-baseline justify-between gap-6 py-3">
                <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-muted)]">
                  {t("Stage")}
                </dt>
                <dd className="text-right text-[13px] font-semibold tracking-tight text-[var(--property-ink)]">
                  {params.policy ? params.policy.replaceAll("_", " ") : t("Queued for review")}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-6 py-3">
                <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-muted)]">
                  {t("Expected response")}
                </dt>
                <dd className="text-right text-[13px] font-semibold tracking-tight text-[var(--property-ink)]">
                  {t("Within 2 business days")}
                </dd>
              </div>
            </dl>
          </div>
          <div className="border-t border-[color:color-mix(in_srgb,var(--property-sage)_22%,transparent)] bg-[color:color-mix(in_srgb,var(--property-sage)_6%,transparent)] px-6 py-4 sm:px-8">
            <p className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px] text-[var(--property-ink-soft)]">
              <span>{t("Need to amend the submission?")}</span>
              <Link
                href={getAccountUrl("/property")}
                className="font-semibold text-[var(--property-accent-strong)] underline-offset-4 transition hover:underline"
              >
                {t("Open your property workspace")}
              </Link>
              <span aria-hidden className="hidden h-1 w-1 rounded-full bg-[var(--property-line)] sm:inline-block" />
              <a
                href={`mailto:${BRAND_EMAILS.property}`}
                className="font-semibold text-[var(--property-ink)] underline-offset-4 transition hover:text-[var(--property-accent-strong)] hover:underline"
              >
                {BRAND_EMAILS.property}
              </a>
            </p>
          </div>
        </div>
      ) : null}
      {params.verification && params.verification !== "verified" ? (
        <div className="mt-4 border-l-2 border-[var(--property-accent-strong)]/55 pl-5">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--property-accent-strong)]">
            {t("Verification pending")}
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--property-ink-soft)]">
            {t(
              "Higher-risk property submissions stay in eligibility review until your Henry Onyx identity verification is approved.",
            )}
          </p>
          <Link
            href={getAccountUrl("/verification")}
            className="property-button-primary mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
          >
            {t("Open account verification")}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      ) : null}

      <section className="mt-12">
        <p className="property-kicker text-[10.5px] uppercase tracking-[0.28em]">
          {t("Submission standards")}
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
                  {t(item.title)}
                </h3>
                <p className="mt-2 text-sm leading-7 text-[var(--property-ink-soft)]">{t(item.body)}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section id="submission" className="mt-14 grid gap-12 xl:grid-cols-[0.95fr_1.05fr] xl:divide-x xl:divide-[var(--property-line)]">
        <div>
          <p className="property-kicker text-[10.5px] uppercase tracking-[0.28em]">
            {t("Account context")}
          </p>
          {viewer.user ? (
            <div className="mt-5 border-l-2 border-[var(--property-accent-strong)]/55 pl-5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--property-accent-strong)]">
                {t("Signed in")}
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--property-ink-soft)]">
                {t("Signed in as")}{" "}
                <span className="font-semibold text-[var(--property-ink)]">
                  {viewer.user.email}
                </span>
                . {t(
                  "Your submission will be linked to this Henry Onyx account for moderation, identity-aware trust review, and follow-up.",
                )}
              </p>
            </div>
          ) : (
            <div className="mt-6">
              <PropertyPublicAuthGate
                title={t("Sign in to submit a listing")}
                description={t(
                  "Listing submissions require a Henry Onyx account so verification documents, moderation, and owner communications stay auditable and secure.",
                )}
                loginHref={submitLoginHref}
                signupHref={submitSignupHref}
              />
            </div>
          )}

          <div className="mt-8 border-l-2 border-[var(--property-accent-strong)]/55 pl-5">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--property-accent-strong)]">
              {t("What happens next")}
            </p>
            <ol className="mt-3 space-y-2 text-sm leading-7 text-[var(--property-ink-soft)]">
              <li>1. {t("Submission saved privately and routed to the right trust path.")}</li>
              <li>2. {t("Documents read; eligibility and authority assessed.")}</li>
              <li>3. {t("Inspection scheduled if the path requires it.")}</li>
              <li>4. {t("Editorial review, approval, then publication if quality holds.")}</li>
            </ol>
          </div>
        </div>

        <div className="xl:pl-12">
          <p className="property-kicker text-[10.5px] uppercase tracking-[0.28em]">
            {t("Listing form")}
          </p>
          {viewer.user ? (
            <div className="mt-6">
              {PROPERTY_AI_LISTING_ASSIST ? (
                <div className="mb-4">
                  <DraftListingPanel
                    copy={{
                      heading: t("Draft with Henry Onyx Intelligence"),
                      intro: t("Henry Onyx Intelligence drafts a starting point from your idea — review and edit every field before you publish."),
                      draftButton: t("Draft with Henry Onyx Intelligence"),
                      drafting: t("Drafting…"),
                      needTitle: t("Add a title first, then let Henry Onyx Intelligence draft the rest."),
                      errorFallback: t("Henry Onyx Intelligence is unavailable right now."),
                      priceTemplate: t("Henry Onyx Intelligence · {price} (incl. {vat} VAT) · {tier}"),
                    }}
                  />
                </div>
              ) : null}
              {PROPERTY_AI_LISTING_VERIFY ? (
                <div className="mb-4">
                  <VerifyListingPanel
                    copy={{
                      heading: t("Get Henry Onyx Verified"),
                      intro: t("Henry Onyx Intelligence reviews your draft for honesty and safety before it goes live."),
                      request: t("Request a trust review"),
                      reviewing: t("Reviewing…"),
                      verifiedBadge: t("Henry Onyx Verified"),
                      readyForReview: t("Ready for review by our team."),
                      needsWork: t("A few things to address before this can be verified."),
                      augmentsNote: t("This review augments our human moderation — it does not publish anything on its own."),
                      errorFallback: t("Henry Onyx Intelligence is unavailable right now."),
                      priceTemplate: t("Henry Onyx Intelligence · {price} (incl. {vat} VAT) · {tier}"),
                    }}
                  />
                </div>
              ) : null}
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
              {t("The listing form unlocks after you sign in. Use the panel on the left, or")}{" "}
              <Link
                href={submitLoginHref}
                className="font-semibold text-[var(--property-ink)] underline-offset-4 hover:underline"
              >
                {t("sign in here")}
              </Link>
              .
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
