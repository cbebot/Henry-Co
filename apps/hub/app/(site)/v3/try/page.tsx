import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { COMPANY, getAccountUrl, getDivisionUrl, type DivisionKey } from "@henryco/config";
import { getHubPublicCopy } from "@henryco/i18n/server";
import { emitEvent } from "@henryco/observability";
import { EditorialList, EditorialRow, Section, SectionHeader } from "@henryco/ui/public-design";
import { getHubPublicLocale } from "../../../../lib/locale-server";

/**
 * /v3/try — the guided journey (V3-96 S2.2, honest form).
 *
 * NOT a sandbox: every step opens the LIVE product, as a stranger, in the
 * visitor's locale and currency. The micro-commitment ladder is the plot —
 * browse without identification, see honest prices, cross divisions, and
 * only create the one account when identity is actually needed. The seeded
 * fixture sandbox of the full S2.2 spec is deferred until the fixture
 * pattern is wired; this page never pretends otherwise.
 */

export const revalidate = 60;

function stepHref(division: string): string {
  if (division === "account") return getAccountUrl("/signup");
  return getDivisionUrl(division as DivisionKey);
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getHubPublicLocale().catch(() => "en" as const);
  const copy = getHubPublicCopy(locale).v3.journey;
  return {
    title: copy.metaTitle.replace("{brand}", COMPANY.group.name),
    description: copy.metaDescription,
    alternates: { canonical: "/v3/try" },
  };
}

export default async function TryJourneyPage() {
  const locale = await getHubPublicLocale();
  const copy = getHubPublicCopy(locale).v3.journey;

  emitEvent({
    name: "henry.v3.journey.started",
    classification: "user_action",
    outcome: "started",
    payload: { entry_surface: "v3_try", sandbox: false, locale },
  });

  return (
    <>
      <Section rhythm="hero" width="prose">
        <SectionHeader eyebrow={copy.eyebrow} title={copy.title} lede={copy.lede} level={1} />
        <p className="home-caption mt-6 text-[color:var(--home-ink-50)]">{copy.noAccountNote}</p>
      </Section>

      <Section>
        <EditorialList>
          {copy.steps.map((step, i) => (
            <EditorialRow
              key={step.title}
              index={String(i + 1).padStart(2, "0")}
              title={step.title}
              body={step.body}
              href={stepHref(step.division)}
              trailing={
                <span className="home-body-sm inline-flex items-center gap-1.5 text-[color:var(--home-accent-text)]">
                  {step.linkLabel}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </span>
              }
            />
          ))}
        </EditorialList>
      </Section>

      <Section rhythm="tight" width="prose">
        <p className="home-body-sm text-[color:var(--home-ink-50)]">{copy.closing}</p>
      </Section>
    </>
  );
}
