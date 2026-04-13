import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  CalendarRange,
  FileCheck2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  PropertyMetricGrid,
  PropertySectionIntro,
  PropertyTrustPill,
} from "@/components/property/ui";
import { getPropertySnapshot } from "@/lib/property/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Trust standards | HenryCo Property",
  description:
    "How HenryCo Property reviews listings, handles viewings, protects against false inventory, and explains managed or verified listing states.",
};

const preApprovalRails = [
  {
    title: "Serious listings only",
    body:
      "HenryCo does not treat the public property surface like an unfiltered classifieds wall. Weak copy, vague pricing, missing context, and incomplete listing identity all trigger review instead of immediate publication.",
  },
  {
    title: "Documents and ownership context",
    body:
      "Depending on the listing type, we may request proof of ownership, an agent mandate, lease authority, company paperwork, or other supporting files before a property is approved.",
  },
  {
    title: "Inspection and location review",
    body:
      "Some listings move through an inspection or guided verification path. That can include a HenryCo agent confirming the location, the access process, and whether the listing is actually ready to be shown.",
  },
];

const badgeGuide = [
  {
    title: "Managed by HenryCo",
    body:
      "HenryCo is actively involved in the listing, coordination, and follow-through. That usually means stronger viewing support, cleaner updates, and more continuity after the first contact.",
  },
  {
    title: "Verified or reviewed",
    body:
      "The listing has passed a stronger trust check than a basic submission. The exact depth can vary, but it means the record has been reviewed rather than simply uploaded.",
  },
  {
    title: "Under review or awaiting trust checks",
    body:
      "The property is still being assessed. It may be waiting on documents, a location check, or a manual decision before HenryCo makes it public or continues the next operational step.",
  },
];

const expectationColumns = [
  {
    heading: "For seekers",
    bullets: [
      "You should expect clearer trust context before you spend time on a viewing.",
      "A viewing request is treated like an operational record, not a casual message that disappears in chat.",
      "If a listing needs extra checks, HenryCo may confirm access, location, or documents before the next step moves forward.",
      "For higher-trust or higher-value properties, additional applicant documents can still be required after a viewing.",
    ],
  },
  {
    heading: "For owners and agents",
    bullets: [
      "A submission stays private until HenryCo approves it for public visibility.",
      "You may be asked for stronger media, better pricing clarity, or proof that you are authorised to market the property.",
      "Managed, verified, or inspection-sensitive listings move through stricter review rails before publication.",
      "If we request changes, the goal is a cleaner and more trustworthy listing, not administrative noise.",
    ],
  },
];

const fraudRails = [
  "False, duplicated, or misleading listings can be held back, corrected, escalated, or blocked.",
  "Shared-contact or identity inconsistencies can trigger manual review before publication.",
  "Listings are expected to describe the actual property state, access conditions, and readiness honestly.",
];

const workflowStates = [
  {
    title: "Awaiting documents",
    tone: "Documents first",
    body:
      "HenryCo still needs proof files before the listing can move forward. This usually means ownership context, marketing authority, or the kind of paperwork required for the listing type.",
  },
  {
    title: "Inspection or guided verification",
    tone: "Location check",
    body:
      "A company agent may confirm the location, access flow, or operational readiness before the property is shown more widely or moved into a stronger trust lane.",
  },
  {
    title: "Under review",
    tone: "Editorial + trust review",
    body:
      "The record is being checked for clarity, accuracy, fraud risk, and presentation quality. The goal is a serious listing that people can act on with confidence.",
  },
  {
    title: "Approved for publication",
    tone: "Public search ready",
    body:
      "The listing has cleared HenryCo's publication threshold. It can still carry managed, reviewed, or verification-sensitive notes, and major changes can send it back into review.",
  },
];

export default async function TrustPage() {
  const snapshot = await getPropertySnapshot();

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-10 sm:px-8 lg:px-10">
      <PropertySectionIntro
        kicker="Trust"
        title="A calmer trust standard for property listings, viewings, and managed follow-through."
        description="HenryCo Property is designed to feel clear before it feels fast. We review what gets published, explain what each trust state means, and keep viewing and follow-up records inside a real operating flow."
        actions={
          <>
            <Link
              href="/search"
              className="property-button-secondary inline-flex rounded-full px-5 py-3 text-sm font-semibold"
            >
              Search trust-ready listings
            </Link>
            <Link
              href="/submit"
              className="property-button-primary inline-flex rounded-full px-5 py-3 text-sm font-semibold"
            >
              Submit a property
            </Link>
          </>
        }
      />

      <div className="mt-8">
        <PropertyMetricGrid items={snapshot.metrics} />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PropertyTrustPill
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Reviewed before public release"
          body="Listings are held back when the trust context is still too weak for a serious public search."
        />
        <PropertyTrustPill
          icon={<CalendarRange className="h-5 w-5" />}
          title="Viewings tracked properly"
          body="Requests, confirmations, reminders, and updates move through a recorded workflow instead of disappearing into chat."
        />
        <PropertyTrustPill
          icon={<Building2 className="h-5 w-5" />}
          title="Managed-property continuity"
          body="Where HenryCo manages the listing, the experience continues beyond first contact into coordinated follow-through."
        />
        <PropertyTrustPill
          icon={<Sparkles className="h-5 w-5" />}
          title="Premium, human review"
          body="The trust layer is there to make the experience clearer and safer, not heavier or more intimidating."
        />
      </div>

      <section className="mt-10 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="property-panel rounded-[2rem] p-6 sm:p-8">
          <div className="property-kicker">Before a listing goes live</div>
          <div className="mt-5 space-y-4">
            {preApprovalRails.map((item) => (
              <article
                key={item.title}
                className="rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-5"
              >
                <div className="flex items-center gap-3">
                  <FileCheck2 className="h-4 w-4 text-[var(--property-accent-strong)]" />
                  <h2 className="text-lg font-semibold text-[var(--property-ink)]">{item.title}</h2>
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--property-ink-soft)]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="property-panel rounded-[2rem] p-6 sm:p-8">
          <div className="property-kicker">What the trust labels mean</div>
          <div className="mt-5 space-y-4">
            {badgeGuide.map((item) => (
              <article
                key={item.title}
                className="rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-5"
              >
                <h2 className="text-lg font-semibold text-[var(--property-ink)]">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--property-ink-soft)]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-6 xl:grid-cols-2">
        {expectationColumns.map((column) => (
          <article key={column.heading} className="property-panel rounded-[2rem] p-6 sm:p-8">
            <div className="property-kicker">{column.heading}</div>
            <div className="mt-5 space-y-3 text-sm leading-7 text-[var(--property-ink-soft)]">
              {column.bullets.map((bullet) => (
                <p key={bullet}>• {bullet}</p>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="mt-10 property-panel rounded-[2rem] p-6 sm:p-8">
        <div className="property-kicker">Operational states users may see</div>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {workflowStates.map((state) => (
            <article
              key={state.title}
              className="rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-5"
            >
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-accent-strong)]">
                {state.tone}
              </div>
              <h2 className="mt-3 text-lg font-semibold text-[var(--property-ink)]">
                {state.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--property-ink-soft)]">
                {state.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10 property-panel rounded-[2rem] p-6 sm:p-8">
        <div className="property-kicker">Fraud prevention and false-listing protection</div>
        <div className="mt-5 space-y-3 text-sm leading-7 text-[var(--property-ink-soft)]">
          {fraudRails.map((rail) => (
            <p key={rail}>• {rail}</p>
          ))}
        </div>
      </section>
    </main>
  );
}
