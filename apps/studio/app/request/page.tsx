import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass, Layers3, Sparkles, Waypoints } from "lucide-react";
import { StudioRequestBuilder } from "@/components/studio/request-builder";
import { getStudioCatalog } from "@/lib/studio/catalog";
import {
  resolveStudioRequestPreset,
  resolveStudioTemplatePreset,
} from "@/lib/studio/request-presets";
import { getStudioTemplateBySlug } from "@/lib/studio/templates";

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

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-10 sm:px-8 lg:px-10">
      {startedFromTemplate ? (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-[1.4rem] border border-[var(--studio-signal)]/40 bg-[rgba(11,42,52,0.55)] px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div
              aria-hidden
              className="h-10 w-10 shrink-0 rounded-[0.9rem]"
              style={{
                background: `linear-gradient(135deg, ${startedFromTemplate.preview.from} 0%, ${startedFromTemplate.preview.to} 100%)`,
              }}
            />
            <div className="min-w-0">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
                Brief prefilled from template
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-[var(--studio-ink)]">
                {startedFromTemplate.name}
              </p>
              <p className="mt-0.5 text-[12.5px] text-[var(--studio-ink-soft)]">
                Customise scope, timing, and stack below — every choice stays editable.
              </p>
            </div>
          </div>
          <Link
            href={`/pick/${startedFromTemplate.slug}`}
            className="shrink-0 text-sm font-semibold text-[var(--studio-signal)] underline-offset-4 hover:underline"
          >
            ← Back to template
          </Link>
        </div>
      ) : null}

      {/* Editorial brief hero — no panel chrome */}
      <section>
        <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--studio-signal)]">
          Studio brief
        </p>
        <h1 className="mt-4 max-w-4xl text-balance text-[2.2rem] font-semibold leading-[1.04] tracking-[-0.025em] text-[var(--studio-ink)] sm:text-[2.9rem] md:text-[3.4rem]">
          Tell us what you need. We turn it into a clear plan.
        </h1>
        <p className="mt-5 max-w-3xl text-pretty text-base leading-[1.7] text-[var(--studio-ink-soft)] sm:text-lg">
          Work through the steps at your own pace. Skip nothing you are unsure about &mdash; we
          will ask follow-up questions if needed. You can choose a package path or a fully custom
          route; both end with a proper summary and payment instructions, not a silent inbox.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link
            href="/pick"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--studio-signal)] underline-offset-4 hover:underline"
          >
            <Compass className="h-3.5 w-3.5" />
            Browse ready-to-start paths instead
          </Link>
        </div>
        <p className="mt-6 max-w-3xl border-l-2 border-[var(--studio-signal)]/55 pl-4 text-sm leading-7 text-[var(--studio-ink-soft)]">
          <span className="font-semibold text-[var(--studio-ink)]">Stuck on a question?</span>{" "}
          Write &ldquo;not sure&rdquo; and move on. Honest answers help more than perfect ones.
        </p>

        {/* Why this is calm — editorial 4-col with hairlines, no panels */}
        <ul className="mt-12 grid gap-8 sm:grid-cols-2 sm:divide-x sm:divide-[var(--studio-line)] lg:grid-cols-4">
          {[
            {
              icon: Layers3,
              title: "Package or custom",
              body: "Packages suit familiar builds. Custom suits one-of-a-kind software, portals, and operations tools.",
            },
            {
              icon: Sparkles,
              title: "You stay in control",
              body: "Change your mind as you go &mdash; the form is a guide, not a test.",
            },
            {
              icon: Waypoints,
              title: "A record you can trust",
              body: "Your brief becomes the basis for scope and pricing. Nothing disappears into a black hole.",
            },
            {
              icon: ArrowRight,
              title: "What comes next is spelled out",
              body: "Deposits, references, and uploads are explained before you pay. No surprises.",
            },
          ].map((item, i) => (
            <li key={item.title} className={i > 0 ? "sm:pl-6 lg:pl-8" : ""}>
              <item.icon className="h-5 w-5 text-[var(--studio-signal)]" aria-hidden />
              <h3 className="mt-4 text-[1.05rem] font-semibold leading-snug tracking-tight text-[var(--studio-ink)]">
                {item.title}
              </h3>
              <p
                className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]"
                dangerouslySetInnerHTML={{ __html: item.body }}
              />
            </li>
          ))}
        </ul>

        {/* Catalog signals — editorial proof rail */}
        <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-[var(--studio-line)] py-5 sm:flex sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-12">
          {[
            ["Published services", String(catalog.services.length)],
            ["Package lanes", String(catalog.packages.length)],
            [
              "Service categories",
              String(
                catalog.requestConfig.projectTypes.filter((item) => item.isActive !== false)
                  .length,
              ),
            ],
            [
              "Timeline lanes",
              String(
                catalog.requestConfig.timelineOptions.filter((item) => item.isActive !== false)
                  .length,
              ),
            ],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1.5">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
                {label}
              </dt>
              <dd className="text-[1.5rem] font-semibold leading-tight tracking-tight text-[var(--studio-ink)] sm:text-[1.7rem]">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12">
        <StudioRequestBuilder
          services={catalog.services}
          packages={catalog.packages}
          teams={catalog.teams}
          requestConfig={catalog.requestConfig}
          preferredTeamId={params.team || null}
          presetHint={presetHint}
        />
      </section>
    </main>
  );
}
