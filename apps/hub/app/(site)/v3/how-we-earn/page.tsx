import type { Metadata } from "next";
import { COMPANY, type DivisionKey } from "@henryco/config";
import { getHubPublicCopy } from "@henryco/i18n/server";
import { emitEvent } from "@henryco/observability";
import {
  EditorialList,
  EditorialRow,
  Hairline,
  Section,
  SectionHeader,
} from "@henryco/ui/public-design";
import { getHubPublicLocale } from "../../../../lib/locale-server";

/**
 * /v3/how-we-earn — the Earning Map (V3-96 S2.3 / doctrine Part III +
 * Principle 14).
 *
 * How each division earns and what the user gets in exchange. No invented
 * numbers — rows whose monetization is not live are tagged honestly ("not
 * charged yet"). Division names resolve from @henryco/config so the map can
 * never drift from the real division registry.
 */

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getHubPublicLocale().catch(() => "en" as const);
  const copy = getHubPublicCopy(locale).v3.earn;
  return {
    title: copy.metaTitle.replace("{brand}", COMPANY.group.name),
    description: copy.metaDescription,
    alternates: { canonical: "/v3/how-we-earn" },
  };
}

export default async function EarningMapPage() {
  const locale = await getHubPublicLocale();
  const copy = getHubPublicCopy(locale).v3.earn;

  emitEvent({
    name: "henry.v3.showcase.viewed",
    classification: "user_action",
    outcome: "completed",
    payload: { surface: "v3_earning_map", locale },
  });

  return (
    <>
      <Section rhythm="hero" width="prose">
        <SectionHeader eyebrow={copy.eyebrow} title={copy.title} lede={copy.lede} level={1} />
      </Section>

      <Section>
        <Hairline className="mb-10" />
        <SectionHeader title={copy.rowsTitle} size="headline" />
        <EditorialList className="mt-6">
          {copy.rows.map((row) => {
            const division = COMPANY.divisions[row.division as DivisionKey];
            const name = division?.name ?? row.division;
            return (
              <EditorialRow
                key={row.division}
                title={name}
                body={
                  <>
                    {row.mechanism} <span className="text-[color:var(--home-ink)]">{row.exchange}</span>
                  </>
                }
                trailing={
                  <span
                    className={
                      row.live
                        ? "home-caption rounded-full border border-[color:var(--home-accent)] px-3 py-1 text-[color:var(--home-accent-text)]"
                        : "home-caption rounded-full border border-[color:var(--home-line-15)] px-3 py-1 text-[color:var(--home-ink-50)]"
                    }
                  >
                    {row.live ? copy.liveTag : copy.earlyTag}
                  </span>
                }
              />
            );
          })}
        </EditorialList>
      </Section>
    </>
  );
}
