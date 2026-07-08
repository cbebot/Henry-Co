import type { ReactNode } from "react";
import { Clock3, Landmark, ShieldCheck, ArrowRight } from "lucide-react";
import {
  AmbientGlow,
  Card,
  CountUp,
  Hairline,
  PublicCTA,
  ScrollProgress,
  Section,
  SectionHeader,
} from "@henryco/ui/public-design";
import type { HubPublicCopy } from "@henryco/i18n";
import type { CompanyPageRecord } from "../lib/company-pages";

/**
 * CompanyPageEditorial — the SERVER renderer for the CMS-fed company pages
 * (about / privacy / terms / contact), replacing the client-side
 * CompanyPageClient (redesign 2026-07-08).
 *
 * Why server: the old client renderer crashed iOS Safari behind the error
 * boundary ("this page didn't load" on every iPhone) — its client surface
 * included a realtime CMS subscription no visitor needs. This renderer
 * ships ZERO client machinery of its own (CountUp/ScrollProgress are the
 * shared reduced-motion-safe islands); owner CMS edits arrive via ISR
 * revalidation instead of a websocket. Faster, indexable, un-crashable.
 *
 * Same data contract (CompanyPageRecord from the hosted CMS via
 * company_pages) and the same translated copy keys — zero new i18n.
 */

function formatUpdatedAt(value: string | null | undefined, locale: string, fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
}

/** CMS body text → calm paragraphs (double-newline separated). */
function BodyParagraphs({ body, className }: { body?: string | null; className?: string }) {
  if (!body) return null;
  return (
    <>
      {body
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
        .map((paragraph) => (
          <p key={paragraph.slice(0, 48)} className={className ?? "home-body mt-4 text-[color:var(--home-ink-70)]"}>
            {paragraph}
          </p>
        ))}
    </>
  );
}

export default function CompanyPageEditorial({
  page,
  serverWarning,
  hideSections = false,
  hideFooter = false,
  hideHero = false,
  copy,
  locale,
  afterHero,
}: {
  page: CompanyPageRecord;
  serverWarning?: boolean;
  hideSections?: boolean;
  hideFooter?: boolean;
  hideHero?: boolean;
  copy: HubPublicCopy["companyPage"];
  locale: string;
  /** Optional hand-crafted block rendered between hero and sections. */
  afterHero?: ReactNode;
}) {
  const metaItems = [
    {
      icon: <Clock3 className="h-3.5 w-3.5" aria-hidden />,
      label: copy.metaUpdated,
      value: formatUpdatedAt(page.updated_at, locale, copy.recentlyUpdated),
    },
    ...(page.subtitle
      ? [
          {
            icon: <Landmark className="h-3.5 w-3.5" aria-hidden />,
            label: copy.metaSection,
            value: page.subtitle,
          },
        ]
      : []),
    {
      icon: <ShieldCheck className="h-3.5 w-3.5" aria-hidden />,
      label: copy.metaStandard,
      value: copy.metaCorporateGrade,
    },
  ];

  return (
    <>
      <ScrollProgress />

      {!hideHero ? (
        <Section rhythm="hero" className="relative overflow-hidden">
          <AmbientGlow />
          <div className="home-reveal relative z-10">
            <SectionHeader
              eyebrow={page.hero_badge || page.subtitle || undefined}
              title={page.title}
              lede={page.intro || undefined}
              level={1}
            />

            {(page.primary_cta_label && page.primary_cta_href) ||
            (page.secondary_cta_label && page.secondary_cta_href) ? (
              <div className="mt-8 flex flex-wrap items-center gap-4">
                {page.primary_cta_label && page.primary_cta_href ? (
                  <PublicCTA
                    href={page.primary_cta_href}
                    size="lg"
                    trailingIcon={<ArrowRight className="h-4 w-4" aria-hidden />}
                  >
                    {page.primary_cta_label}
                  </PublicCTA>
                ) : null}
                {page.secondary_cta_label && page.secondary_cta_href ? (
                  <PublicCTA href={page.secondary_cta_href} variant="ghost">
                    {page.secondary_cta_label}
                  </PublicCTA>
                ) : null}
              </div>
            ) : null}

            <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
              {metaItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm">
                  <span className="text-[color:var(--home-accent-text)]">{item.icon}</span>
                  <dt className="home-caption text-[color:var(--home-ink-50)]">{item.label}</dt>
                  <dd className="font-medium text-[color:var(--home-ink)]">{item.value}</dd>
                </div>
              ))}
            </dl>

            {page.stats.length > 0 ? (
              <div className="mt-10 flex flex-wrap gap-x-12 gap-y-6">
                {page.stats
                  .filter((stat) => stat.value)
                  .map((stat) => (
                    <div key={stat.id ?? stat.label} className="flex flex-col-reverse gap-1">
                      <dt className="home-caption text-[color:var(--home-ink-50)]">{stat.label}</dt>
                      <dd
                        className="text-3xl font-semibold tabular-nums text-[color:var(--home-ink)]"
                        style={{ fontFamily: "var(--home-font-mono)" }}
                      >
                        {Number.isFinite(Number(stat.value)) ? (
                          <CountUp value={Number(stat.value)} />
                        ) : (
                          stat.value
                        )}
                      </dd>
                    </div>
                  ))}
              </div>
            ) : null}

            {serverWarning ? (
              <p className="home-caption mt-8 text-[color:var(--home-ink-50)]">{copy.serverWarning}</p>
            ) : null}
          </div>
        </Section>
      ) : null}

      {afterHero}

      {!hideSections && page.sections.length > 0 ? (
        <div aria-label={copy.pageSectionsAria}>
          {page.sections.map((section, index) => (
            <Section key={section.id ?? index} width="prose" rhythm="tight" id={section.id}>
              {section.title ? (
                <SectionHeader
                  eyebrow={section.eyebrow || undefined}
                  title={section.title}
                  size="headline"
                />
              ) : null}
              <BodyParagraphs body={section.body} />
              {section.items.length > 0 ? (
                <div className="mt-8 grid gap-5 sm:grid-cols-2">
                  {section.items
                    .filter((item) => item.title || item.label || item.body || item.value)
                    .map((item, itemIndex) => (
                      <Card key={item.id ?? itemIndex}>
                        {item.title || item.label ? (
                          <h3 className="home-title">{item.title || item.label}</h3>
                        ) : null}
                        {item.body || item.value ? (
                          <p className="home-body-sm mt-2 text-[color:var(--home-ink-60)]">
                            {item.body || item.value}
                          </p>
                        ) : null}
                        {item.href ? (
                          <a
                            href={item.href}
                            className="home-focus home-body-sm mt-4 inline-flex min-h-[44px] items-center gap-1.5 text-[color:var(--home-accent-text)]"
                          >
                            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                          </a>
                        ) : null}
                      </Card>
                    ))}
                </div>
              ) : null}
            </Section>
          ))}
        </div>
      ) : null}

      {!hideFooter ? (
        <Section width="prose" rhythm="tight">
          <Hairline className="mb-10" />
          <SectionHeader eyebrow={copy.footerEyebrow} title={copy.footerTitle} size="headline" />
          <p className="home-body-sm mt-4 text-[color:var(--home-ink-60)]">{copy.footerBody}</p>
          <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3 text-sm">
            <div className="flex items-baseline gap-2">
              <dt className="home-caption text-[color:var(--home-ink-50)]">{copy.footerUseCase}</dt>
              <dd className="font-medium text-[color:var(--home-ink)]">{copy.footerUseCaseValue}</dd>
            </div>
            <div className="flex items-baseline gap-2">
              <dt className="home-caption text-[color:var(--home-ink-50)]">{copy.footerStandard}</dt>
              <dd className="font-medium text-[color:var(--home-ink)]">{copy.footerStandardValue}</dd>
            </div>
          </dl>
        </Section>
      ) : null}
    </>
  );
}
