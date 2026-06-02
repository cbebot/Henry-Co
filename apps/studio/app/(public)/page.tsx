import { ArrowRight, ArrowUpRight } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import {
  Body,
  DisplayHeading,
  EditorialList,
  EditorialRow,
  Eyebrow,
  Lede,
  PublicCTA,
  PublicProofRail,
  Section,
  SectionHeader,
} from "@henryco/ui/public-design";
import { getStudioCatalog } from "@/lib/studio/catalog";
import { getStudioPublicLocale } from "@/lib/locale-server";

/**
 * Studio home — the in-house build studio's own showcase, on the locked
 * --home-* public design system. Narrative arc, one breath per section, one
 * climax: Hook → Two ways in → One record (climax) → Proof → How it runs →
 * Invite. Boldness comes from Fraunces at scale, generous rhythm, and ONE
 * confident teal focal moment per beat — not teal sprinkled everywhere.
 *
 * i18n: surface labels run through translateSurfaceLabel (the Studio Pattern-B
 * runtime DeepL convention). Catalog ROW text (service.name, caseStudy.* …) is
 * Supabase-source language; per-row translation is the wave-1 follow-up that the
 * cached /work/[slug] etc. detail pages already do. No hardcoded user-facing
 * strings; no hardcoded domains.
 */
export default async function StudioHomePage() {
  const catalog = await getStudioCatalog();
  const locale = await getStudioPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  const proof = (n: number) => (n > 0 ? String(n) : null);
  const featuredCases = catalog.caseStudies.slice(0, 3);
  const featuredValues = catalog.valueComparisons.slice(0, 3);
  const featuredQuote = catalog.testimonials[0] ?? null;
  const processSteps = catalog.process.slice(0, 4);

  return (
    <main id="henryco-main" tabIndex={-1}>
      {/* ── HOOK — the credibility flex; the ecosystem is the portfolio ── */}
      <section id="top" className="relative isolate overflow-hidden home-section-hero">
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-12%] top-[-18%] h-[34rem] w-[34rem] rounded-full opacity-[0.16] blur-[2px]"
          style={{ background: "radial-gradient(circle, var(--home-accent) 0%, transparent 68%)" }}
        />
        <div className="home-shell relative">
          <Eyebrow className="home-rise">{t("Henry & Co. Studio")}</Eyebrow>
          <div className="mt-6 grid gap-x-12 gap-y-10 lg:grid-cols-[1.55fr_1fr] lg:items-end">
            <div>
              <DisplayHeading level={1} size="xl" className="home-rise home-delay-1">
                {t("The studio that builds")}{" "}
                <span className="italic text-[color:var(--home-accent-text)]">
                  {t("Henry & Co.")}
                </span>
              </DisplayHeading>
              <Lede className="mt-6 max-w-xl home-rise home-delay-2">
                {t(
                  "Websites, apps, and platforms — shipped in-house for every Henry & Co. business. Now building yours.",
                )}
              </Lede>
              <div className="mt-9 flex flex-wrap items-center gap-3 home-rise home-delay-3">
                <PublicCTA
                  href="/request"
                  variant="primary"
                  size="lg"
                  trailingIcon={<ArrowRight aria-hidden className="h-4 w-4" />}
                >
                  {t("Start a brief")}
                </PublicCTA>
                <PublicCTA href="/work" variant="secondary" size="lg">
                  {t("See our work")}
                </PublicCTA>
              </div>
            </div>
            <div className="home-rise home-delay-4">
              <PublicProofRail
                label={t("At a glance")}
                items={[
                  { value: proof(catalog.services.length), label: t("Services") },
                  { value: proof(catalog.packages.length), label: t("Packages") },
                  { value: proof(catalog.teams.length), label: t("Specialist teams") },
                  { value: proof(catalog.caseStudies.length), label: t("Case studies") },
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT IT IS — two ways in, a hairline list (not two cards) ── */}
      <Section>
        <SectionHeader
          level={2}
          size="display"
          eyebrow={t("Where to start")}
          title={t("Two ways in.")}
          lede={t("Pick a ready scope, or shape a custom build. Both land in one brief with honest pricing.")}
        />
        <EditorialList className="mt-10">
          <EditorialRow
            index="01"
            href="/pricing"
            title={t("Package path")}
            body={t("Premium websites, commerce, and dashboards — repeatable scopes with clear price bands.")}
            trailing={<ArrowUpRight aria-hidden className="h-4 w-4 text-[color:var(--home-accent-text)]" />}
          />
          <EditorialRow
            index="02"
            href="/request"
            title={t("Custom project path")}
            body={t("Bespoke software, portals, and multi-role products with specific feature architecture.")}
            trailing={<ArrowUpRight aria-hidden className="h-4 w-4 text-[color:var(--home-accent-text)]" />}
          />
        </EditorialList>
      </Section>

      {/* ── THE ONE REASON — the climax: one record, brief to launch ── */}
      <Section rhythm="hero" tone="sunken">
        <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div>
            <Eyebrow>{t("Why Studio")}</Eyebrow>
            <DisplayHeading level={2} size="display" className="mt-4">
              {t("One record, from")}{" "}
              <span className="italic text-[color:var(--home-accent-text)]">{t("brief to launch.")}</span>
            </DisplayHeading>
            <Lede className="mt-5 max-w-lg">
              {t(
                "Scope, pricing, milestones, payments, and reviews live on one project record in your Henry & Co. account — nothing about your build in a back-channel.",
              )}
            </Lede>
          </div>
          {featuredValues.length > 0 ? (
            <EditorialList>
              {featuredValues.map((value, i) => (
                <EditorialRow
                  key={value.title}
                  index={String(i + 1).padStart(2, "0")}
                  title={value.title}
                  body={value.points[0]}
                />
              ))}
            </EditorialList>
          ) : null}
        </div>
      </Section>

      {/* ── REAL PROOF — selected work as hairline rows + one quiet quote ── */}
      <Section>
        <SectionHeader
          level={2}
          size="display"
          eyebrow={t("Selected work")}
          title={t("Proof, before the conversation.")}
          lede={t("Every case study states the challenge, the build, and the measurable result.")}
        />
        <PublicProofRail
          className="mt-8"
          items={[
            { value: proof(catalog.caseStudies.length), label: t("Case studies") },
            { value: proof(catalog.teams.length), label: t("Specialist teams") },
            { value: proof(catalog.services.length), label: t("Capabilities") },
          ]}
        />
        {featuredCases.length > 0 ? (
          <EditorialList className="mt-10">
            {featuredCases.map((item, i) => (
              <EditorialRow
                key={item.id}
                index={String(i + 1).padStart(2, "0")}
                href={`/work#${item.id}`}
                title={
                  <span className="flex flex-wrap items-baseline gap-x-3">
                    {item.name}
                    <span className="home-caption">{item.type}</span>
                  </span>
                }
                body={item.challenge}
                trailing={
                  <span className="home-num hidden text-sm font-medium text-[color:var(--home-accent-text)] sm:inline">
                    {item.impact}
                  </span>
                }
              />
            ))}
          </EditorialList>
        ) : null}

        {featuredQuote ? (
          <figure className="mt-12 max-w-2xl">
            <blockquote
              className="home-headline text-[color:var(--home-ink-85)]"
              style={{ fontFamily: "var(--home-font-display)" }}
            >
              <span className="text-[color:var(--home-accent-text)]">&ldquo;</span>
              {featuredQuote.quote}
              <span className="text-[color:var(--home-accent-text)]">&rdquo;</span>
            </blockquote>
            <figcaption className="home-caption mt-4">{featuredQuote.name}</figcaption>
          </figure>
        ) : null}

        <div className="mt-10">
          <PublicCTA href="/work" variant="ghost" trailingIcon={<ArrowRight aria-hidden className="h-4 w-4" />}>
            {t("See all work")}
          </PublicCTA>
        </div>
      </Section>

      {/* ── HOW IT RUNS — tight, one rhythm step down ── */}
      {processSteps.length > 0 ? (
        <Section rhythm="tight">
          <SectionHeader
            level={2}
            size="headline"
            eyebrow={t("How an engagement runs")}
            title={t("From first call to launch.")}
          />
          <ol className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step, index) => (
              <li key={step} className="flex flex-col gap-3">
                <span className="home-num text-sm font-semibold text-[color:var(--home-accent-text)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span aria-hidden className="h-px w-full bg-[color:var(--home-line)]" />
                <Body size="sm" className="text-[color:var(--home-ink-65)]">
                  {step}
                </Body>
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      {/* ── INVITATION — one dominant primary ── */}
      <Section>
        <div className="flex flex-col gap-6 rounded-[var(--home-radius-lg)] border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-02)] p-8 sm:flex-row sm:items-center sm:justify-between sm:p-12">
          <div className="max-w-xl">
            <DisplayHeading level={2} size="headline">
              {t("Ready to scope a project?")}
            </DisplayHeading>
            <Body className="mt-2">
              {t("A brief takes about 8 minutes — and you see honest pricing before you submit.")}
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
