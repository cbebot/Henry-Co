import { ArrowRight, ArrowUpRight } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import {
  Body,
  DisplayHeading,
  Eyebrow,
  Lede,
  PublicCTA,
  PublicProofRail,
  Section,
} from "@henryco/ui/public-design";
import { getStudioCatalog } from "@/lib/studio/catalog";
import { getStudioPublicLocale } from "@/lib/locale-server";
import { studioCaseStudySlug } from "@/lib/studio/content";

/**
 * Work — the portfolio landing on the locked --home-* system. Editorial hero →
 * honest proof rail → case studies as a hairline list where the measurable
 * IMPACT is the teal focal line (show the real thing), not a wall of cards →
 * one invitation. Surface labels via translateSurfaceLabel; case-study row text
 * stays source-language (the /work/[slug] detail page already translates it).
 */
export default async function WorkPage() {
  const catalog = await getStudioCatalog();
  const locale = await getStudioPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const proof = (n: number) => (n > 0 ? String(n) : null);

  return (
    <main id="henryco-main" tabIndex={-1}>
      <Section rhythm="hero">
        <Eyebrow>{t("Selected work")}</Eyebrow>
        <DisplayHeading level={1} size="xl" className="mt-5 max-w-3xl">
          {t("The work")}{" "}
          <span className="italic text-[color:var(--home-accent-text)]">{t("before the conversation.")}</span>
        </DisplayHeading>
        <Lede className="mt-6 max-w-2xl">
          {t(
            "Each case study states the challenge, the build, and the measurable result — proof you can verify before you commit.",
          )}
        </Lede>
        <PublicProofRail
          className="mt-10"
          items={[
            { value: proof(catalog.caseStudies.length), label: t("Case studies") },
            { value: proof(catalog.teams.length), label: t("Specialist teams") },
            { value: proof(catalog.services.length), label: t("Capabilities") },
          ]}
        />
      </Section>

      <Section rhythm="tight">
        <ul role="list" className="divide-y divide-[color:var(--home-line)] border-t border-[color:var(--home-line)]">
          {catalog.caseStudies.map((item, i) => (
            <li key={item.id} id={item.id} className="scroll-mt-28">
              <a
                href={`/work/${studioCaseStudySlug(item)}`}
                className="home-lift home-focus group flex items-start gap-4 py-7"
              >
                <span className="home-num shrink-0 pt-1 text-sm text-[color:var(--home-accent-text)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <h2 className="home-title">{item.name}</h2>
                    <span className="home-caption">{item.type}</span>
                  </div>
                  <p className="home-body-sm mt-2 text-[color:var(--home-ink-65)]">{item.challenge}</p>
                  <p className="home-body-sm mt-2.5 font-medium text-[color:var(--home-accent-text)]">{item.impact}</p>
                  {item.metrics?.length ? (
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {item.metrics.map((metric) => (
                        <li
                          key={metric}
                          className="home-caption rounded-full border border-[color:var(--home-line-12)] px-2.5 py-1"
                        >
                          {metric}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <ArrowUpRight
                  aria-hidden
                  className="mt-1 h-4 w-4 shrink-0 text-[color:var(--home-ink-30)] transition group-hover:translate-x-0.5 group-hover:text-[color:var(--home-accent-text)] motion-reduce:transition-none"
                />
              </a>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <div className="flex flex-col gap-6 rounded-[var(--home-radius-lg)] border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-02)] p-8 sm:flex-row sm:items-center sm:justify-between sm:p-12">
          <div className="max-w-xl">
            <DisplayHeading level={2} size="headline">{t("Want results like these?")}</DisplayHeading>
            <Body className="mt-2">
              {t("Tell us what you're building. A brief takes about 8 minutes, with honest pricing before you submit.")}
            </Body>
          </div>
          <PublicCTA
            href="/request"
            variant="primary"
            size="lg"
            trailingIcon={<ArrowRight aria-hidden className="h-4 w-4" />}
          >
            {t("Start a brief")}
          </PublicCTA>
        </div>
      </Section>
    </main>
  );
}
