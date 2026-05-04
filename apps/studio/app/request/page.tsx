import type { Metadata } from "next";
import Link from "next/link";
import { StudioRequestLanding } from "@/components/studio/request-landing";
import { getStudioCatalog } from "@/lib/studio/catalog";
import {
  resolveStudioRequestPreset,
  resolveStudioTemplatePreset,
} from "@/lib/studio/request-presets";
import { getStudioTemplateBySlug, studioTemplates } from "@/lib/studio/templates";

export const metadata: Metadata = {
  title: "Studio brief — Tell us what you need | HenryCo Studio",
  description:
    "Compose a HenryCo Studio brief: pick a package or custom path, choose features, and get an honest estimate before you commit. No silent inbox.",
  alternates: { canonical: "/request" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Studio brief | HenryCo Studio",
    description:
      "Tell us what you need. We turn it into a clear plan with real pricing, deposits, and a delivery record.",
    type: "website",
    url: "/request",
  },
  twitter: {
    card: "summary_large_image",
    title: "Studio brief | HenryCo Studio",
    description:
      "A calm form for serious projects — packages or custom, with proper pricing and payment guidance.",
  },
};

export default async function RequestPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string; preset?: string; template?: string }>;
}) {
  const params = await searchParams;
  const catalog = await getStudioCatalog();
  const templateHint = resolveStudioTemplatePreset(params.template, catalog.requestConfig);
  const presetHint =
    templateHint ?? resolveStudioRequestPreset(params.preset, catalog.requestConfig);
  const startedFromTemplate = params.template
    ? getStudioTemplateBySlug(params.template)
    : null;

  // When a template or preset param is present, drop the user straight
  // into the manual builder (with the seed already applied) — they've
  // already chosen their path, no point making them re-pick.
  const initialPath = startedFromTemplate || presetHint ? "custom" : "copilot";

  return (
    <main
      id="henryco-main"
      tabIndex={-1}
      className="mx-auto max-w-[88rem] px-5 pb-20 pt-8 sm:px-8 sm:pt-10 lg:px-10"
    >
      {startedFromTemplate ? (
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--studio-signal)]/40 bg-[rgba(11,42,52,0.55)] px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-start gap-3">
            <div
              aria-hidden
              className="h-9 w-9 shrink-0 rounded-[0.85rem]"
              style={{
                background: `linear-gradient(135deg, ${startedFromTemplate.preview.from} 0%, ${startedFromTemplate.preview.to} 100%)`,
              }}
            />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
                Brief prefilled from template
              </p>
              <p className="mt-0.5 truncate text-[13.5px] font-semibold text-[var(--studio-ink)]">
                {startedFromTemplate.name}
              </p>
              <p className="mt-0.5 text-[12px] text-[var(--studio-ink-soft)]">
                Edit any field below — every choice stays under your control.
              </p>
            </div>
          </div>
          <Link
            href={`/pick/${startedFromTemplate.slug}`}
            className="shrink-0 text-[12.5px] font-semibold text-[var(--studio-signal)] underline-offset-4 hover:underline"
          >
            ← Template detail
          </Link>
        </div>
      ) : null}

      {/* Tight, calm hero — three paths sit immediately below so a
       * landing visitor sees their next action above the fold on
       * both mobile and desktop. Replaces the previous wall of
       * marketing (oversized headline, why-calm 4-up grid, stats dl,
       * etc.) which pushed the actual entry far below the fold on
       * mobile. */}
      <section>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--studio-signal)]">
          Studio brief
        </p>
        <h1 className="mt-3 max-w-3xl text-balance text-[1.7rem] font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--studio-ink)] sm:text-[2.1rem] md:text-[2.4rem]">
          Tell us what you need. Pricing appears as you choose.
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-[14.5px] leading-[1.7] text-[var(--studio-ink-soft)] sm:text-[15.5px]">
          Three calm paths. Pick whichever matches the way you think — you can
          switch at any time. Every path ends with the same thing: a clear plan,
          a real price, and a payment route that isn&rsquo;t a black box.
        </p>
      </section>

      <section className="mt-8 sm:mt-10">
        <StudioRequestLanding
          services={catalog.services}
          packages={catalog.packages}
          teams={catalog.teams}
          requestConfig={catalog.requestConfig}
          templates={studioTemplates}
          preferredTeamId={params.team || null}
          presetHint={presetHint}
          initialPath={initialPath}
        />
      </section>
    </main>
  );
}
