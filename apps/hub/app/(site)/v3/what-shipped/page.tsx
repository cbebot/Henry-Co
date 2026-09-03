import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { COMPANY, getDivisionUrl, type DivisionKey } from "@henryco/config";
import { getHubPublicCopy } from "@henryco/i18n/server";
import { emitEvent } from "@henryco/observability";
import { Card, Section, SectionHeader } from "@henryco/ui/public-design";
import { getHubPublicLocale } from "../../../../lib/locale-server";

/**
 * /v3/what-shipped — the capability inventory (V3-96 S2.5, honest form).
 *
 * A tight per-division list of what exists TODAY, each block with one
 * "see it live" link to the division's real surface. Nothing deferred is
 * dressed as product — the page says so explicitly. Division names and
 * URLs resolve from @henryco/config, so the inventory cannot drift from
 * the real division registry.
 */

export const revalidate = 60;

const INVENTORY_DIVISIONS: DivisionKey[] = [
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
  const copy = getHubPublicCopy(locale).v3.shipped;
  return {
    title: copy.metaTitle.replace("{brand}", COMPANY.group.name),
    description: copy.metaDescription,
    alternates: { canonical: "/v3/what-shipped" },
  };
}

export default async function WhatShippedPage() {
  const locale = await getHubPublicLocale();
  const copy = getHubPublicCopy(locale).v3.shipped;

  emitEvent({
    name: "henry.v3.showcase.viewed",
    classification: "user_action",
    outcome: "completed",
    payload: { surface: "v3_what_shipped", locale },
  });

  return (
    <>
      <Section rhythm="hero" width="prose">
        <SectionHeader eyebrow={copy.eyebrow} title={copy.title} lede={copy.lede} level={1} />
      </Section>

      <Section>
        <div className="grid gap-6 sm:grid-cols-2">
          {INVENTORY_DIVISIONS.map((key) => {
            const division = COMPANY.divisions[key];
            const entry = copy.divisions[key];
            if (!entry) return null;
            return (
              <Card key={key}>
                <h2 className="home-title">{division.name}</h2>
                <p className="home-body-sm mt-1 text-[color:var(--home-ink-60)]">{entry.summary}</p>
                <ul className="mt-4 space-y-2">
                  {entry.items.map((item) => (
                    <li key={item} className="home-body-sm flex gap-2 text-[color:var(--home-ink-70)]">
                      <span className="text-[color:var(--home-accent-text)]" aria-hidden>
                        —
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href={getDivisionUrl(key)}
                  className="home-focus home-body-sm mt-5 inline-flex min-h-[44px] items-center gap-1.5 text-[color:var(--home-accent-text)]"
                >
                  {copy.seeLive}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </a>
              </Card>
            );
          })}
        </div>
      </Section>

      <Section rhythm="tight" width="prose">
        <p className="home-body-sm text-[color:var(--home-ink-50)]">{copy.note}</p>
      </Section>
    </>
  );
}
