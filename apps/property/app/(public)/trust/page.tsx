import type { Metadata } from "next";
import {
  Building2,
  CalendarRange,
  FileCheck2,
  ShieldCheck,
} from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import {
  PropertyMetricGrid,
  PropertySectionIntro,
} from "@/components/property/ui";
import { getPropertySnapshot } from "@/lib/property/data";
import { getPropertyPublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getPropertyPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  return {
    title: t("Trust standards | Henry Onyx Property"),
    description: t(
      "Every Henry Onyx Property listing is reviewed before it goes public. Read the standards each listing must meet.",
    ),
  };
}

/**
 * COPY-RESET (2026-10-03): outcomes only — each line is enforced in code.
 * Do not describe how review, holds, or fraud checks work.
 *   - private until approved: apps/property/lib/property/store.ts (visibility
 *     "private" on create) + app/api/property/route.ts staff decision
 *     (visibility "public" only on approved/published)
 *   - documents / identity holds block publication: route.ts
 *     (awaiting_documents / awaiting_eligibility refuse publish)
 *   - open inspection blocks publication: route.ts (requested / scheduled)
 */
const standards = [
  {
    icon: ShieldCheck,
    title: "Private until approved",
    body: "Every submission stays private until Henry Onyx reviews and approves it.",
  },
  {
    icon: FileCheck2,
    title: "Documents first",
    body: "A listing still waiting on required documents is not published.",
  },
  {
    icon: CalendarRange,
    title: "Inspections finished first",
    body: "If a listing needs a site inspection, it stays private until the inspection is finished.",
  },
  {
    icon: ShieldCheck,
    title: "Identity and ownership",
    body: "A listing can stay in review until the owner's identity or ownership is confirmed.",
  },
  {
    icon: Building2,
    title: "Owner-run listings",
    body: "Listings not managed by Henry Onyx are run by their owner or agent, who remains responsible after first contact.",
  },
];

export default async function TrustPage() {
  const snapshot = await getPropertySnapshot();
  const locale = await getPropertyPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const translatedMetrics = snapshot.metrics.map((metric) => ({
    label: t(metric.label),
    value: metric.value,
  }));

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-10 sm:px-8 lg:px-10">
      <PropertySectionIntro kicker={t("Trust")} title={t("Reviewed before it is public.")} />

      <div className="mt-10">
        <PropertyMetricGrid items={translatedMetrics} />
      </div>

      <section className="mt-14">
        <ul className="mt-6 divide-y divide-[var(--property-line)] border-y border-[var(--property-line)]">
          {standards.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.title}
                className="grid gap-3 py-6 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-6"
              >
                <Icon
                  className="h-5 w-5 text-[var(--property-accent-strong)]"
                  aria-hidden
                />
                <div>
                  <h3 className="text-base font-semibold tracking-tight text-[var(--property-ink)]">
                    {t(item.title)}
                  </h3>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--property-ink-soft)]">
                    {t(item.body)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
