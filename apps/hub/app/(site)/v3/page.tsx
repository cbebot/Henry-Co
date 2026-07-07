import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { COMPANY, getDivisionUrl, type DivisionKey } from "@henryco/config";
import { getHubPublicCopy } from "@henryco/i18n/server";
import { emitEvent } from "@henryco/observability";
import {
  EditorialList,
  EditorialRow,
  Hairline,
  PublicCTA,
  Section,
  SectionHeader,
} from "@henryco/ui/public-design";
import { getHubPublicLocale } from "../../../lib/locale-server";

/**
 * /v3 — the ecosystem story page (V3-96 S2.1, honest present-tense form).
 *
 * SELF-VERIFYING CLAIMS: no screenshots, no testimonials, no pillar
 * marketing — every division row deep-links to the LIVE surface that
 * proves it. 8-second comprehension target; capability evidence over
 * headline size; exactly ONE primary action above the fold (Principle 9).
 * Composed entirely from @henryco/ui/public-design primitives + typed
 * copy — zero hardcoded brand strings, domains, or user-facing English.
 */

export const revalidate = 60;

/** The divisions the story tells — each must have a live public surface. */
const STORY_DIVISIONS: DivisionKey[] = [
  "care",
  "marketplace",
  "jobs",
  "learn",
  "logistics",
  "studio",
  "property",
];

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getHubPublicLocale().catch(() => "en" as const);
  const copy = getHubPublicCopy(locale).v3.story;
  return {
    title: copy.metaTitle.replace("{brand}", COMPANY.group.name),
    description: copy.metaDescription,
    alternates: { canonical: "/v3" },
  };
}

export default async function V3StoryPage() {
  const locale = await getHubPublicLocale();
  const copy = getHubPublicCopy(locale).v3.story;

  emitEvent({
    name: "henry.v3.showcase.viewed",
    classification: "user_action",
    outcome: "completed",
    payload: { surface: "v3_story", locale },
  });

  return (
    <>
      <Section rhythm="hero">
        <SectionHeader eyebrow={copy.eyebrow} title={copy.title} lede={copy.lede} level={1} />
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <PublicCTA href="#divisions" size="lg" trailingIcon={<ArrowRight className="h-4 w-4" aria-hidden />}>
            {copy.primaryCta}
          </PublicCTA>
          <PublicCTA href="/v3/how-we-earn" variant="ghost">
            {copy.earnLink}
          </PublicCTA>
        </div>
      </Section>

      <Section id="divisions">
        <SectionHeader title={copy.divisionsTitle} lede={copy.divisionsLede} size="headline" />
        <EditorialList className="mt-6">
          {STORY_DIVISIONS.map((key, i) => {
            const division = COMPANY.divisions[key];
            const body = copy.divisionBodies[key];
            return (
              <EditorialRow
                key={key}
                index={String(i + 1).padStart(2, "0")}
                title={division.name}
                body={body ?? division.tagline}
                href={getDivisionUrl(key)}
                trailing={
                  <span className="home-body-sm inline-flex items-center gap-1.5 text-[color:var(--home-accent-text)]">
                    {copy.seeLive}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </span>
                }
              />
            );
          })}
        </EditorialList>
        <p className="home-caption mt-6 text-[color:var(--home-ink-50)]">{copy.roadmapNote}</p>
      </Section>

      <Section>
        <Hairline className="mb-10" />
        <SectionHeader title={copy.spineTitle} lede={copy.spineLede} size="headline" />
        <div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {copy.spine.map((item) => (
            <div key={item.title}>
              <h3 className="home-title">{item.title}</h3>
              <p className="home-body-sm mt-2 text-[color:var(--home-ink-60)]">{item.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section rhythm="tight">
        <p className="home-body-sm max-w-2xl text-[color:var(--home-ink-50)]">{copy.honestyNote}</p>
      </Section>
    </>
  );
}
