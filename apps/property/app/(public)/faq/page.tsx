import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { resolveLocalizedDynamicField } from "@henryco/i18n/server";
import { PropertySectionIntro } from "@/components/property/ui";
import { getPropertySnapshot } from "@/lib/property/data";
import { getPropertyPublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export default async function PropertyFaqPage() {
  const snapshot = await getPropertySnapshot();
  const locale = await getPropertyPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  // Wrap FAQ row text — small fixed list, public page, non-EN
  // visitors deserve translated answers.
  const localizedFaqs = await Promise.all(
    snapshot.faqs.map(async (faq) => {
      const [question, answer] = await Promise.all([
        resolveLocalizedDynamicField({
          record: faq as unknown as Record<string, unknown>,
          field: "question",
          locale,
          fallback: faq.question ?? "",
          machineTranslate: locale !== "en",
        }),
        resolveLocalizedDynamicField({
          record: faq as unknown as Record<string, unknown>,
          field: "answer",
          locale,
          fallback: faq.answer ?? "",
          machineTranslate: locale !== "en",
        }),
      ]);
      return { ...faq, question, answer };
    }),
  );

  return (
    <main className="mx-auto max-w-[80rem] px-5 py-10 sm:px-8 lg:px-10">
      <PropertySectionIntro
        kicker={t("FAQ")}
        title={t("Before you reach out.")}
        description={t(
          "The essentials renters, buyers, owners, and managed-property clients usually check before a viewing or submission.",
        )}
      />

      <section className="mt-10">
        {snapshot.faqs.length === 0 ? (
          <p className="border-l-2 border-[var(--property-accent-strong)]/55 pl-5 text-sm leading-7 text-[var(--property-ink-soft)]">
            {t(
              "We're still publishing answers to the most common renter, buyer, and owner questions. In the meantime,",
            )}{" "}
            <Link
              href="/trust"
              className="font-semibold text-[var(--property-accent-strong)] underline-offset-4 hover:underline"
            >
              {t("read how we govern listings before publication")}
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-[var(--property-line)] border-y border-[var(--property-line)]">
            {localizedFaqs.map((faq) => (
              <li key={faq.id}>
                <details className="group py-5">
                  <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 text-base font-semibold tracking-tight text-[var(--property-ink)]">
                    <span>{faq.question}</span>
                    <span
                      aria-hidden
                      className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-soft)] transition group-open:text-[var(--property-accent-strong)]"
                    >
                      <span className="group-open:hidden">{t("Open")}</span>
                      <span className="hidden group-open:inline">{t("Close")}</span>
                    </span>
                  </summary>
                  {/* READING-02: FAQ answers read in the serif face (hub
                      home-faq precedent); ink stays host-owned. */}
                  <p className="hc-font-reading text-pretty mt-4 max-w-3xl text-sm leading-7 text-[var(--property-ink-soft)]">
                    {faq.answer}
                  </p>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-14 border-t border-[var(--property-line)] pt-10">
        <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr] lg:items-end">
          <div>
            <p className="property-kicker text-[10.5px] uppercase tracking-[0.28em]">
              {t("Still have a question?")}
            </p>
            <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--property-ink)] sm:text-[1.85rem]">
              {t("Reach out — we'll route it to the right desk.")}
            </h2>
            {/* READING-02: section intro in the serif reading face. */}
            <p className="hc-font-reading text-pretty mt-3 max-w-xl text-sm leading-7 text-[var(--property-ink-soft)]">
              {t(
                "Listing submissions, viewings, managed property requests, and inspection follow-up each have their own thread so the right person sees it first.",
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link
              href="/submit"
              className="property-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            >
              {t("Submit a listing")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/trust"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--property-line)] px-6 py-3 text-sm font-semibold text-[var(--property-ink)] transition hover:border-[var(--property-accent-strong)]/50"
            >
              {t("Trust standards")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
