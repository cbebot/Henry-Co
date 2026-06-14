import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { COMPANY, henryDomain } from "@henryco/config";
import { getServicesCopy, resolveLocalizedDynamicField } from "@henryco/i18n/server";
import { emitEvent } from "@henryco/observability";
import { Section, SectionHeader, EditorialList, EditorialRow } from "@henryco/ui/public-design";
import { getHubPublicLocale } from "../../../lib/locale-server";
import { getServiceVerticals } from "../../lib/services-catalog";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getHubPublicLocale().catch(() => "en" as const);
  const copy = getServicesCopy(locale);
  return {
    title: copy.hubDirectory.metadataTitle.replace("{brand}", COMPANY.group.name),
    description: copy.hubDirectory.metadataDescription,
    alternates: { canonical: "/services" },
  };
}

function serviceCountLabel(count: number, copy: ReturnType<typeof getServicesCopy>): string {
  return count === 1
    ? copy.directory.serviceCountOne
    : copy.directory.serviceCountOther.replace("{count}", String(count));
}

export default async function HubServicesPage() {
  const locale = await getHubPublicLocale();
  const copy = getServicesCopy(locale);
  const { verticals } = await getServiceVerticals();

  const localized = await Promise.all(
    verticals.map(async (vertical) => ({
      slug: vertical.slug,
      count: vertical.service_count,
      name: await resolveLocalizedDynamicField({
        record: vertical as unknown as Record<string, unknown>,
        field: "name",
        locale,
        fallback: vertical.name,
        machineTranslate: locale !== "en",
      }),
      summary: await resolveLocalizedDynamicField({
        record: vertical as unknown as Record<string, unknown>,
        field: "summary",
        locale,
        fallback: vertical.summary,
        machineTranslate: locale !== "en",
      }),
    })),
  );

  emitEvent({
    name: "henry.services.catalog.viewed",
    classification: "user_action",
    outcome: "completed",
    payload: { surface: "hub_directory", vertical_count: localized.length, division: "care" },
  });

  return (
    <Section rhythm="hero">
      <SectionHeader
        eyebrow={copy.hubDirectory.eyebrow}
        title={copy.hubDirectory.title}
        lede={copy.hubDirectory.body}
      />
      <EditorialList className="mt-12">
        {localized.map((vertical) => (
          <EditorialRow
            key={vertical.slug}
            href={henryDomain("care", `/services/${vertical.slug}`)}
            title={vertical.name}
            body={vertical.summary}
            trailing={
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--home-ink-50)]">
                <span className="hidden sm:inline">{serviceCountLabel(vertical.count, copy)}</span>
                <span className="inline-flex items-center gap-1 text-[color:var(--home-accent-text)]">
                  {copy.hubDirectory.exploreCta}
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </span>
            }
          />
        ))}
      </EditorialList>
    </Section>
  );
}
