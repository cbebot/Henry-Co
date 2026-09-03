import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { COMPANY, LEGAL } from "@henryco/config";
import { getHubPublicCopy } from "@henryco/i18n/server";
import { emitEvent } from "@henryco/observability";
import { PublicCTA, Section, SectionHeader } from "@henryco/ui/public-design";
import { getHubPublicLocale } from "../../../lib/locale-server";

/**
 * /announcing-v3 — the founder post (V3-96 S3.1).
 *
 * The publishing surface for the V3 announcement. The body is typed copy
 * in owner voice — the owner edits the prose in the copy module (Pattern
 * A), and every locale carries it natively. Signed with the registered
 * founder name from LEGAL.entity; one primary action, one secondary.
 */

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getHubPublicLocale().catch(() => "en" as const);
  const copy = getHubPublicCopy(locale).v3.announcement;
  return {
    title: copy.metaTitle.replace("{brand}", COMPANY.group.name),
    description: copy.metaDescription,
    alternates: { canonical: "/announcing-v3" },
  };
}

export default async function AnnouncingV3Page() {
  const locale = await getHubPublicLocale();
  const copy = getHubPublicCopy(locale).v3.announcement;

  emitEvent({
    name: "henry.v3.announcement.delivered",
    classification: "system_state",
    outcome: "completed",
    payload: { channel: "blog", segment: "public", locale },
  });

  return (
    <>
      <Section rhythm="hero" width="prose">
        <SectionHeader eyebrow={copy.eyebrow} title={copy.title} lede={copy.lede} level={1} />
      </Section>

      <Section width="prose" rhythm="tight">
        <div className="flex flex-col gap-6">
          {copy.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 32)} className="home-body text-[color:var(--home-ink-70)]">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-10">
          <p className="home-title">{LEGAL.entity.founder}</p>
          <p className="home-caption mt-1 text-[color:var(--home-ink-50)]">{copy.signoffRole}</p>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <PublicCTA href="/v3" size="lg" trailingIcon={<ArrowRight className="h-4 w-4" aria-hidden />}>
            {copy.ctaStory}
          </PublicCTA>
          <PublicCTA href="/v3/try" variant="ghost">
            {copy.ctaTry}
          </PublicCTA>
        </div>
      </Section>
    </>
  );
}
