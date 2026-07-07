import type { Metadata } from "next";
import { Download } from "lucide-react";
import { HenryCoLogo, marks } from "@henryco/brand";
import { COMPANY, LEGAL } from "@henryco/config";
import { getHubPublicCopy } from "@henryco/i18n/server";
import { emitEvent } from "@henryco/observability";
import { Card, EditorialList, EditorialRow, Section, SectionHeader } from "@henryco/ui/public-design";
import { getHubPublicLocale } from "../../../../lib/locale-server";

/**
 * /press/v3 — the press kit (V3-96 S2.4, honest form).
 *
 * Registered facts only: boilerplate, company facts from LEGAL.entity
 * (CAC record) + COMPANY.group, the three approved brand marks as
 * downloadable SVGs, and plain usage rules. No invented quotes, no
 * stock-photo executives. The counsel-reviewed watermarked screenshot
 * pack (L10) ships separately when cleared — this page never fakes it.
 */

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getHubPublicLocale().catch(() => "en" as const);
  const copy = getHubPublicCopy(locale).v3.press;
  return {
    title: copy.metaTitle.replace("{brand}", COMPANY.group.name),
    description: copy.metaDescription,
    alternates: { canonical: "/press/v3" },
  };
}

export default async function PressKitPage() {
  const locale = await getHubPublicLocale();
  const copy = getHubPublicCopy(locale).v3.press;

  emitEvent({
    name: "henry.v3.showcase.viewed",
    classification: "user_action",
    outcome: "completed",
    payload: { surface: "v3_press_kit", locale },
  });

  const facts: { label: string; value: string }[] = [
    { label: copy.factLabels.legalName, value: LEGAL.entity.name },
    { label: copy.factLabels.rc, value: `RC ${LEGAL.entity.rcNumber}` },
    { label: copy.factLabels.founded, value: COMPANY.group.established },
    { label: copy.factLabels.hq, value: COMPANY.group.hqLocation },
    { label: copy.factLabels.founder, value: LEGAL.entity.founder },
    { label: copy.factLabels.contact, value: COMPANY.group.supportEmail },
  ];

  const markDownloads = [
    { label: copy.markLabels.monogram, href: marks.monogram.appPath, logoVariant: "tile" as const },
    { label: copy.markLabels.wordmarkFull, href: marks.wordmarkFull.appPath, logoVariant: "wordmark" as const },
    { label: copy.markLabels.wordmarkCompact, href: marks.wordmarkCompact.appPath, logoVariant: "wordmark" as const },
  ];

  return (
    <>
      <Section rhythm="hero" width="prose">
        <SectionHeader eyebrow={copy.eyebrow} title={copy.title} lede={copy.lede} level={1} />
      </Section>

      <Section width="prose">
        <SectionHeader title={copy.boilerplateTitle} size="headline" />
        <p className="home-body mt-4 text-[color:var(--home-ink-70)]">{copy.boilerplate}</p>
      </Section>

      <Section width="prose">
        <SectionHeader title={copy.factsTitle} size="headline" />
        <dl className="mt-6 grid gap-x-10 gap-y-4 sm:grid-cols-2">
          {facts.map((fact) => (
            <div key={fact.label} className="flex flex-col gap-0.5">
              <dt className="home-caption text-[color:var(--home-ink-50)]">{fact.label}</dt>
              <dd className="home-body-sm text-[color:var(--home-ink)]">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section>
        <SectionHeader title={copy.marksTitle} lede={copy.marksLede} size="headline" />
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {markDownloads.map((mark) => (
            <Card key={mark.href}>
              <div className="grid min-h-24 place-items-center py-4">
                <HenryCoLogo size={mark.logoVariant === "tile" ? 56 : 44} variant={mark.logoVariant} label="" />
              </div>
              <p className="home-body-sm mt-2 text-center text-[color:var(--home-ink-70)]">{mark.label}</p>
              <div className="mt-3 text-center">
                <a
                  href={mark.href}
                  download
                  className="home-focus home-body-sm inline-flex min-h-[44px] items-center gap-1.5 text-[color:var(--home-accent-text)]"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden />
                  {copy.download}
                </a>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section width="prose">
        <SectionHeader title={copy.usageTitle} size="headline" />
        <EditorialList className="mt-4">
          {copy.usageRules.map((rule, i) => (
            <EditorialRow key={rule} index={String(i + 1).padStart(2, "0")} title={rule} />
          ))}
        </EditorialList>
      </Section>

      <Section rhythm="tight" width="prose">
        <h2 className="home-title">{copy.contactTitle}</h2>
        <p className="home-body-sm mt-2 text-[color:var(--home-ink-60)]">{copy.contactBody}</p>
        <a
          href={`mailto:${COMPANY.group.supportEmail}`}
          className="home-focus home-body-sm mt-3 inline-flex min-h-[44px] items-center text-[color:var(--home-accent-text)]"
        >
          {COMPANY.group.supportEmail}
        </a>
      </Section>
    </>
  );
}
