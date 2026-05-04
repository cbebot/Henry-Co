"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  ArrowRight,
  Compass,
  Layers3,
  Sparkles,
  Wand2,
} from "lucide-react";
import { BriefCopilotPanel } from "@/components/studio/brief-copilot-panel";
import { StudioRequestBuilder } from "@/components/studio/request-builder";
import type { BriefCopilotStructured } from "@/lib/studio/brief-copilot-action";
import type { StudioRequestConfig } from "@/lib/studio/request-config";
import type { StudioRequestPresetResult } from "@/lib/studio/request-presets";
import type {
  StudioPackage,
  StudioService,
  StudioTeamProfile,
  StudioTemplate,
} from "@/lib/studio/types";

type PathKey = "copilot" | "templates" | "custom";

type PathTileDefinition = {
  key: PathKey;
  kicker: string;
  title: string;
  summary: string;
  hint: string;
  icon: typeof Wand2;
};

const PATHS: PathTileDefinition[] = [
  {
    key: "copilot",
    kicker: "Quickest start",
    title: "Draft with the Co-pilot",
    summary:
      "Describe what you want in a paragraph. The co-pilot drafts every field of the brief and shows pricing while you review.",
    hint: "About 30 seconds",
    icon: Wand2,
  },
  {
    key: "templates",
    kicker: "Ready to start",
    title: "Pick a prebuilt brief",
    summary:
      "Use one of the studio templates — already scoped, priced, and timed — and tweak it to fit. No blank-page anxiety.",
    hint: "Browse 14 templates",
    icon: Layers3,
  },
  {
    key: "custom",
    kicker: "Most control",
    title: "Build your own brief",
    summary:
      "Step through the manual builder. Every choice updates pricing live. Best when you already know your stack and scope.",
    hint: "4 calm steps",
    icon: Compass,
  },
];

const NAIRA = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

/**
 * Three-path entry for the Studio brief request flow.
 *
 * Replaces the previous wall-of-marketing on /request (oversized hero,
 * 4-up "why this is calm" grid, stats rail, catalog dl, then the
 * builder) with a tight landing that lets the user act in one tap:
 *
 *   - Co-pilot (paragraph → AI-drafted brief, default)
 *   - Templates (pick a prebuilt brief from /pick)
 *   - Custom (manual step builder)
 *
 * Mobile-first: tiles stack single column with generous breathing
 * room, no oversized cards. Live pricing stays visible inside the
 * builder's existing side panel — the redesign doesn't fork the
 * data flow, it just makes the entry calm.
 */
export function StudioRequestLanding({
  services,
  packages,
  teams,
  requestConfig,
  templates,
  preferredTeamId,
  presetHint,
  initialPath,
}: {
  services: StudioService[];
  packages: StudioPackage[];
  teams: StudioTeamProfile[];
  requestConfig: StudioRequestConfig;
  templates: StudioTemplate[];
  preferredTeamId: string | null;
  presetHint: StudioRequestPresetResult | null;
  /** Optional initial path — preset/template params land users on the
   * matching flow on first paint. */
  initialPath?: PathKey;
}) {
  const [activePath, setActivePath] = useState<PathKey>(initialPath ?? "copilot");
  const [copilotSeed, setCopilotSeed] = useState<BriefCopilotStructured | null>(null);
  const [seedVersion, setSeedVersion] = useState(0);

  const handleCopilotApply = useCallback((structured: BriefCopilotStructured) => {
    setCopilotSeed(structured);
    setSeedVersion((prev) => prev + 1);
    if (typeof window !== "undefined") {
      const target = document.getElementById("studio-brief-builder");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const featuredTemplates = useMemo(() => templates.slice(0, 6), [templates]);

  return (
    <div className="space-y-12">
      <PathSelector active={activePath} onSelect={setActivePath} />

      {activePath === "copilot" ? (
        <section className="space-y-10" aria-labelledby="studio-path-copilot">
          <h2 id="studio-path-copilot" className="sr-only">
            Draft with the co-pilot
          </h2>
          <BriefCopilotPanel onApply={handleCopilotApply} />
          <div id="studio-brief-builder">
            <StudioRequestBuilder
              key={`copilot-${seedVersion}`}
              services={services}
              packages={packages}
              teams={teams}
              requestConfig={requestConfig}
              preferredTeamId={preferredTeamId}
              presetHint={presetHint}
              copilotSeed={copilotSeed}
            />
          </div>
        </section>
      ) : null}

      {activePath === "templates" ? (
        <TemplateBrowser
          templates={featuredTemplates}
          totalCount={templates.length}
          onPickCustom={() => setActivePath("custom")}
        />
      ) : null}

      {activePath === "custom" ? (
        <section className="space-y-6" aria-labelledby="studio-path-custom">
          <h2 id="studio-path-custom" className="sr-only">
            Build your own brief
          </h2>
          <p className="max-w-2xl text-[13.5px] leading-7 text-[var(--studio-ink-soft)]">
            Step through every choice. Pricing updates live in the side panel as
            you select scope, platform, timeline, and team. You can switch back
            to the co-pilot at any time without losing your place.
          </p>
          <div id="studio-brief-builder">
            <StudioRequestBuilder
              services={services}
              packages={packages}
              teams={teams}
              requestConfig={requestConfig}
              preferredTeamId={preferredTeamId}
              presetHint={presetHint}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}

function PathSelector({
  active,
  onSelect,
}: {
  active: PathKey;
  onSelect: (path: PathKey) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="How would you like to start your brief?"
      className="grid gap-3 sm:grid-cols-3"
    >
      {PATHS.map((path) => {
        const isActive = path.key === active;
        const Icon = path.icon;
        return (
          <button
            key={path.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(path.key)}
            className={[
              "group/path relative overflow-hidden rounded-2xl border px-5 py-5 text-left transition",
              "sm:px-6 sm:py-6",
              isActive
                ? "border-[rgba(151,244,243,0.55)] bg-[rgba(151,244,243,0.06)] shadow-[0_22px_60px_rgba(73,192,197,0.18)]"
                : "border-[var(--studio-line)] bg-[rgba(255,255,255,0.02)] hover:-translate-y-0.5 hover:border-[rgba(151,244,243,0.35)]",
            ].join(" ")}
          >
            <div className="flex items-center justify-between gap-3">
              <span
                className={[
                  "inline-flex h-9 w-9 items-center justify-center rounded-xl border transition",
                  isActive
                    ? "border-[rgba(151,244,243,0.55)] bg-[rgba(151,244,243,0.14)] text-[var(--studio-signal)]"
                    : "border-[var(--studio-line)] bg-[rgba(255,255,255,0.03)] text-[var(--studio-ink-soft)] group-hover/path:text-[var(--studio-signal)]",
                ].join(" ")}
                aria-hidden
              >
                <Icon className="h-4 w-4" />
              </span>
              <span
                className={[
                  "text-[10.5px] font-semibold uppercase tracking-[0.22em]",
                  isActive
                    ? "text-[var(--studio-signal)]"
                    : "text-[var(--studio-ink-soft)]",
                ].join(" ")}
              >
                {path.kicker}
              </span>
            </div>
            <h3 className="mt-4 text-[1.05rem] font-semibold leading-snug tracking-tight text-[var(--studio-ink)] sm:text-[1.15rem]">
              {path.title}
            </h3>
            <p className="mt-2 text-[13px] leading-6 text-[var(--studio-ink-soft)]">
              {path.summary}
            </p>
            <div className="mt-4 flex items-center gap-2 text-[12px] font-semibold text-[var(--studio-signal)]">
              <span>{path.hint}</span>
              <ArrowRight
                className={[
                  "h-3.5 w-3.5 transition",
                  isActive ? "translate-x-0.5" : "group-hover/path:translate-x-0.5",
                ].join(" ")}
              />
            </div>
            {isActive ? (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--studio-signal)] to-transparent"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function TemplateBrowser({
  templates,
  totalCount,
  onPickCustom,
}: {
  templates: StudioTemplate[];
  totalCount: number;
  onPickCustom: () => void;
}) {
  return (
    <section className="space-y-7" aria-labelledby="studio-path-templates">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
            Featured templates
          </p>
          <h2
            id="studio-path-templates"
            className="mt-2 text-[1.4rem] font-semibold leading-tight tracking-[-0.01em] text-[var(--studio-ink)] sm:text-[1.6rem]"
          >
            Pick a brief that&rsquo;s already scoped for you.
          </h2>
        </div>
        <Link
          href="/pick"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--studio-signal)] underline-offset-4 hover:underline"
        >
          Browse all {totalCount}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <article
            key={template.id}
            className="group/tpl relative overflow-hidden rounded-2xl border border-[var(--studio-line)] bg-[rgba(255,255,255,0.02)] p-5 transition hover:-translate-y-0.5 hover:border-[rgba(151,244,243,0.35)]"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-12 opacity-70"
              style={{
                background: `linear-gradient(135deg, ${template.preview.from} 0%, ${template.preview.to} 100%)`,
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute right-3 top-3 h-7 w-7 rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${template.preview.from} 0%, ${template.preview.to} 100%)`,
              }}
            />
            <div className="relative pt-8">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
                {template.projectTypeLabel}
              </p>
              <h3 className="mt-2 text-[15px] font-semibold leading-snug text-[var(--studio-ink)]">
                {template.name}
              </h3>
              <p className="mt-2 line-clamp-3 text-[12.5px] leading-6 text-[var(--studio-ink-soft)]">
                {template.tagline}
              </p>
              <div className="mt-4 flex items-baseline justify-between gap-2 border-t border-[var(--studio-line)] pt-3">
                <span className="text-[14px] font-semibold tabular-nums text-[var(--studio-ink)]">
                  {NAIRA.format(template.price)}
                </span>
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
                  {template.timelineWeeks}w · {Math.round(template.depositRate * 100)}% deposit
                </span>
              </div>
              <Link
                href={`/request?template=${template.slug}`}
                className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--studio-signal)] underline-offset-4 group-hover/tpl:underline"
              >
                Start with this template
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 border-t border-[var(--studio-line)] pt-6">
        <Link
          href="/pick"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--studio-line)] bg-[rgba(255,255,255,0.03)] px-5 py-2.5 text-[13px] font-semibold text-[var(--studio-ink)] transition hover:border-[rgba(151,244,243,0.45)]"
        >
          <Sparkles className="h-3.5 w-3.5" />
          See every template with case-study previews
        </Link>
        <button
          type="button"
          onClick={onPickCustom}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--studio-line)] bg-[rgba(255,255,255,0.03)] px-5 py-2.5 text-[13px] font-semibold text-[var(--studio-ink)] transition hover:border-[rgba(151,244,243,0.45)]"
        >
          <Compass className="h-3.5 w-3.5" />
          None fit — build a custom brief
        </button>
      </div>
    </section>
  );
}
