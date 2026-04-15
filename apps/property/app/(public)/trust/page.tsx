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
  PropertyTrustPill,
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
    title: "The public site is not an open dump",
    body:
      "A listing does not go live just because somebody filled a form. HenryCo holds every submission privately first, then decides whether the documents, authority, identity, and property reality are strong enough for public release.",
  },
  {
    title: "Documents depend on the listing path",
    body:
      "Owner-listed, agent-led, managed, commercial, land, and inspection-sensitive submissions do not carry the same evidence burden. HenryCo asks for the documents that actually explain the path instead of hiding requirements until later.",
  },
  {
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
    title: "Managed vs non-managed",
    body:
      "Managed listings imply HenryCo operational involvement after acceptance. Non-managed listings can still be reviewed and published, but the owner or agent remains responsible for the operating reality after first contact.",
  },
  {
    title: "Duplicate-contact resistance",
    body:
      "If the same email or phone appears across multiple HenryCo accounts or submissions, the listing may stay in manual review until the ownership picture is clearer.",
  },
  {
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
        title="HenryCo Property is governed before it is public."
        description="The trust layer is meant to feel calm and understandable, but it is still serious. Documents are path-specific, inspections are real workflows, and managed versus non-managed publication is not blurred together."
      />

      <div className="mt-8">
        <PropertyMetricGrid items={snapshot.metrics} />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PropertyTrustPill
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Private before publication"
          body="Every listing enters a private review state before HenryCo considers public release."
        />
        <PropertyTrustPill
          icon={<FileCheck2 className="h-5 w-5" />}
          title="Document-aware"
          body="Required evidence depends on the listing path instead of one vague upload request for everyone."
        />
        <PropertyTrustPill
          icon={<CalendarRange className="h-5 w-5" />}
          title="Inspection truth"
          body="Inspection-sensitive listings keep a visible operational status instead of a vague promise."
        />
        <PropertyTrustPill
          icon={<Building2 className="h-5 w-5" />}
          title="Managed clarity"
          body="Managed listings are handled as a real operating commitment, not just a trust label."
        />
      </div>

      <section className="mt-10 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="property-panel rounded-[2rem] p-6 sm:p-8">
          <div className="property-kicker">Core trust rails</div>
          <div className="mt-5 space-y-4">
            {trustRails.map((item) => (
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
          <div className="property-kicker">What the listing states mean</div>
          <div className="mt-5 space-y-4">
            {statusGuide.map((item) => (
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

      <section className="mt-10 grid gap-6 xl:grid-cols-3">
        {policyCards.map((card) => (
          <article key={card.title} className="property-panel rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-center gap-3 text-[var(--property-accent-strong)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-[var(--property-ink)]">{card.title}</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--property-ink-soft)]">{card.body}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 property-panel rounded-[2rem] p-6 sm:p-8">
        <div className="property-kicker">What happens next after submission</div>
        <div className="mt-5 space-y-3 text-sm leading-7 text-[var(--property-ink-soft)]">
          {nextSteps.map((item) => (
            <p key={item}>• {item}</p>
          ))}
        </div>
      </section>
    </main>
  );
}
