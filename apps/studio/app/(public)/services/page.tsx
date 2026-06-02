import { ArrowRight } from "lucide-react";
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
} from "@henryco/ui/public-design";
import { getStudioCatalog } from "@/lib/studio/catalog";
import { getStudioPublicLocale } from "@/lib/locale-server";
import { studioServiceSlug } from "@/lib/studio/content";
import { formatCurrency } from "@/lib/env";

/**
 * Services — capability list on the locked --home-* system. Editorial hero →
 * honest proof rail → a hairline EditorialList (one line per service, price +
 * window in the trailing slot; deep detail lives on /services/[slug]) → one
 * invitation. Surface labels via translateSurfaceLabel; catalog row text stays
 * source-language (wave-1 follow-up, like the detail pages already do).
 */
export default async function ServicesPage() {
  const catalog = await getStudioCatalog();
  const locale = await getStudioPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const proof = (n: number) => (n > 0 ? String(n) : null);

  return (
    <main id="henryco-main" tabIndex={-1}>
      <Section rhythm="hero">
        <Eyebrow>{t("Services")}</Eyebrow>
        <DisplayHeading level={1} size="xl" className="mt-5 max-w-3xl">
          {t("Specialised capability, priced against")}{" "}
          <span className="italic text-[color:var(--home-accent-text)]">{t("outcomes.")}</span>
        </DisplayHeading>
        <Lede className="mt-6 max-w-2xl">
          {t(
            "Websites, internal systems, commerce, product UX, and custom software — each with a defined scope, a starting price, and a delivery window stated up front.",
          )}
        </Lede>
        <PublicProofRail
          className="mt-10"
          items={[
            { value: proof(catalog.services.length), label: t("Capabilities") },
            { value: proof(catalog.packages.length), label: t("Packages") },
            { value: proof(catalog.teams.length), label: t("Specialist teams") },
          ]}
        />
      </Section>

      <Section rhythm="tight">
        <EditorialList>
          {catalog.services.map((service, i) => (
            <EditorialRow
              key={service.id}
              index={String(i + 1).padStart(2, "0")}
              href={`/services/${studioServiceSlug(service)}`}
              title={service.name}
              body={service.headline}
              trailing={
                <div className="text-right">
                  <div className="home-num text-sm font-semibold text-[color:var(--home-ink)]">
                    {t("from")} {formatCurrency(service.startingPrice)}
                  </div>
                  <div className="home-caption">{service.deliveryWindow}</div>
                </div>
              }
            />
          ))}
        </EditorialList>
      </Section>

      <Section>
        <div className="flex flex-col gap-6 rounded-[var(--home-radius-lg)] border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-02)] p-8 sm:flex-row sm:items-center sm:justify-between sm:p-12">
          <div className="max-w-xl">
            <DisplayHeading level={2} size="headline">{t("Not sure which fits?")}</DisplayHeading>
            <Body className="mt-2">
              {t("Start a brief and we'll scope the right capability with honest pricing — in about 8 minutes.")}
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
