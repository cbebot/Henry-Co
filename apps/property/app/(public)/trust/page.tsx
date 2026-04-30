import type { Metadata } from "next";
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
} from "@/components/property/ui";
import { getPropertySnapshot } from "@/lib/property/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Trust standards | HenryCo Property",
  description:
    "How HenryCo Property governs listing submissions, documents, inspections, managed operations, and publication safety.",
};

const trustRails = [
  {
    icon: ShieldCheck,
    title: "The public site is not an open dump",
    body:
      "A listing does not go live just because somebody filled a form. HenryCo holds every submission privately first, then decides whether the documents, authority, identity, and property reality are strong enough for public release.",
  },
  {
    icon: FileCheck2,
    title: "Documents depend on the listing path",
    body:
      "Owner-listed, agent-led, managed, commercial, land, and inspection-sensitive submissions do not carry the same evidence burden. HenryCo asks for the documents that actually explain the path instead of hiding requirements until later.",
  },
  {
    icon: CalendarRange,
    title: "Inspection is operational, not decorative",
    body:
      "If a listing needs an inspection, that becomes a tracked workflow. It can be requested, scheduled, completed, waived, failed, or cancelled, and publication should not pretend the check is done when it is not.",
  },
];

const statusGuide = [
  {
    title: "Awaiting documents",
    body:
      "HenryCo still needs stronger authority, ownership, management, or supporting evidence before the listing can move deeper into review.",
  },
  {
    title: "Awaiting eligibility",
    body:
      "Identity, duplicate-contact review, or another trust prerequisite is still unresolved. The listing is held privately until that is cleared.",
  },
  {
    title: "Inspection requested or scheduled",
    body:
      "HenryCo has decided that a site check matters for this listing path. The listing is not treated as fully trusted until that inspection rail is closed properly.",
  },
  {
    title: "Under review, approved, or published",
    body:
      "Once the trust gates are satisfied, the listing can move into editorial review, approval, and then public visibility if the remaining quality checks pass.",
  },
];

const expectationColumns = [
  {
    heading: "What HenryCo checks",
    bullets: [
      "Whether the submitter appears authorised to market, manage, or request inspection for the property.",
      "Whether the media, pricing, occupancy reality, and location context are serious enough for a premium platform.",
      "Whether the account trust posture is strong enough for higher-risk listing paths.",
      "Whether a managed listing is truly asking for HenryCo operations, not just a badge.",
    ],
  },
  {
    heading: "What owners and agents should expect",
    bullets: [
      "Direct uploads are better than pasted document links because staff need a reviewable file trail.",
      "If a listing is weak, HenryCo may request better proof, stronger copy, or clearer readiness details before it moves.",
      "Managed and non-managed listings are different paths; approval for one should not silently imply the other.",
      "If a listing gets held or escalated, the goal is cleaner publication truth, not bureaucratic noise.",
    ],
  },
];

const policyCards = [
  {
    icon: Building2,
    title: "Managed vs non-managed",
    body:
      "Managed listings imply HenryCo operational involvement after acceptance. Non-managed listings can still be reviewed and published, but the owner or agent remains responsible for the operating reality after first contact.",
  },
  {
    icon: ShieldCheck,
    title: "Duplicate-contact resistance",
    body:
      "If the same email or phone appears across multiple HenryCo accounts or submissions, the listing may stay in manual review until the ownership picture is clearer.",
  },
  {
    icon: CalendarRange,
    title: "Inspection and viewing continuity",
    body:
      "HenryCo treats inspections and viewings as tracked workflows. Requests, schedules, and follow-up should remain visible to staff and to the account history instead of vanishing into chat.",
  },
];

const nextSteps = [
  "Submitters see a private listing record first, not instant publication.",
  "HenryCo reviews the evidence, the trust posture, and whether the listing belongs on a managed, non-managed, or inspection-sensitive rail.",
  "If more information is needed, the listing can move into corrections, document hold, eligibility hold, or escalation before publication.",
  "Only after those checks are coherent should the listing move toward approval and public release.",
];

export default async function TrustPage() {
  const snapshot = await getPropertySnapshot();

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-10 sm:px-8 lg:px-10">
      <PropertySectionIntro
        kicker="Trust"
        title="Governed before it is public."
        description="Documents are path-specific, inspections are real workflows, and managed vs non-managed publication is not blurred together. Calm, but serious."
      />

      <div className="mt-10">
        <PropertyMetricGrid items={snapshot.metrics} />
      </div>

      <section className="mt-14">
        <p className="property-kicker text-[10.5px] uppercase tracking-[0.28em]">Core trust rails</p>
        <ul className="mt-6 divide-y divide-[var(--property-line)] border-y border-[var(--property-line)]">
          {trustRails.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.title}
                className="grid gap-3 py-6 sm:grid-cols-[auto,1fr] sm:items-start sm:gap-6"
              >
                <Icon
                  className="h-5 w-5 text-[var(--property-accent-strong)]"
                  aria-hidden
                />
                <div>
                  <h3 className="text-base font-semibold tracking-tight text-[var(--property-ink)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--property-ink-soft)]">
                    {item.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-14 grid gap-12 xl:grid-cols-[1.05fr_0.95fr] xl:divide-x xl:divide-[var(--property-line)]">
        <div>
          <p className="property-kicker text-[10.5px] uppercase tracking-[0.28em]">
            What the listing states mean
          </p>
          <ul className="mt-6 divide-y divide-[var(--property-line)] border-y border-[var(--property-line)]">
            {statusGuide.map((item) => (
              <li key={item.title} className="py-5">
                <h3 className="text-base font-semibold tracking-tight text-[var(--property-ink)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-[var(--property-ink-soft)]">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="xl:pl-12">
          <p className="property-kicker text-[10.5px] uppercase tracking-[0.28em]">
            Two-sided expectations
          </p>
          <div className="mt-6 grid gap-10 md:grid-cols-2 md:divide-x md:divide-[var(--property-line)]">
            {expectationColumns.map((column, i) => (
              <div key={column.heading} className={i > 0 ? "md:pl-8" : ""}>
                <h3 className="text-sm font-semibold tracking-tight text-[var(--property-ink)]">
                  {column.heading}
                </h3>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--property-ink-soft)]">
                  {column.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--property-accent-strong)]" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-14">
        <p className="property-kicker text-[10.5px] uppercase tracking-[0.28em]">
          Policy clarifications
        </p>
        <ul className="mt-8 grid gap-10 md:grid-cols-2 xl:grid-cols-3 xl:divide-x xl:divide-[var(--property-line)]">
          {policyCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <li key={card.title} className={i > 0 && i < 3 ? "xl:pl-8" : ""}>
                <Icon
                  className="h-5 w-5 text-[var(--property-accent-strong)]"
                  aria-hidden
                />
                <h3 className="mt-4 text-base font-semibold tracking-tight text-[var(--property-ink)]">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-[var(--property-ink-soft)]">
                  {card.body}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-14 border-l-2 border-[var(--property-accent-strong)]/55 pl-5">
        <p className="property-kicker text-[10.5px] uppercase tracking-[0.22em]">
          <Sparkles className="mr-1 inline h-3.5 w-3.5 align-[-2px]" />
          What happens next after submission
        </p>
        <ol className="mt-4 space-y-3 text-sm leading-7 text-[var(--property-ink-soft)]">
          {nextSteps.map((item, i) => (
            <li key={item} className="flex gap-3">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--property-accent-strong)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
