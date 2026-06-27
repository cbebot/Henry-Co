"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Compass,
  Layers3,
  Wand2,
} from "lucide-react";
import { getStudioRequestCopy } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
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

/**
 * /request authors a fresh brief with two in-page lanes (Co-pilot or
 * Custom). Pre-built templates live at /pick — that's the canonical
 * gallery + checkout. The templates card on this page is a deep link
 * out, not an in-page tab, so /pick and /request stop overlapping.
 */
type PathKey = "copilot" | "custom";

type PathTileDefinition = {
  key: PathKey;
  icon: typeof Wand2;
};

const PATHS: PathTileDefinition[] = [
  {
    key: "copilot",
    icon: Wand2,
  },
  {
    key: "custom",
    icon: Compass,
  },
];

/** Localized kicker/title/summary/hint for a path tile, keyed by path. */
function pathTileText(copy: ReturnType<typeof getStudioRequestCopy>, key: PathKey) {
  return key === "copilot"
    ? {
        kicker: copy.landing.copilotKicker,
        title: copy.landing.copilotTitle,
        summary: copy.landing.copilotSummary,
        hint: copy.landing.copilotHint,
      }
    : {
        kicker: copy.landing.customKicker,
        title: copy.landing.customTitle,
        summary: copy.landing.customSummary,
        hint: copy.landing.customHint,
      };
}

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
  pathChosenUpstream = false,
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
  /** True when the path was already declared upstream (e.g. /pick →
   * /request?path=custom, or a template seed). The full three-tile
   * picker is replaced by a compact switcher so the chosen content is
   * immediately visible — especially on mobile where the tiles
   * otherwise stack and push the actual brief below the fold.
   * The user can still switch paths via the compact switcher. */
  pathChosenUpstream?: boolean;
}) {
  const locale = useHenryCoLocale();
  const copy = getStudioRequestCopy(locale);
  const [activePath, setActivePath] = useState<PathKey>(initialPath ?? "copilot");
  const [copilotSeed, setCopilotSeed] = useState<BriefCopilotStructured | null>(null);
  const [seedVersion, setSeedVersion] = useState(0);
  // Once the user has actively switched paths in-page (or the page was
  // entered without an upstream choice), we want the full picker back so
  // they can compare options at a glance.
  const [picksMade, setPicksMade] = useState(false);
  const showCompact = pathChosenUpstream && !picksMade;

  function handlePathSelect(next: PathKey) {
    setPicksMade(true);
    setActivePath(next);
  }

  const handleCopilotApply = useCallback((structured: BriefCopilotStructured) => {
    setCopilotSeed(structured);
    setSeedVersion((prev) => prev + 1);
    if (typeof window !== "undefined") {
      const target = document.getElementById("studio-brief-builder");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <div className="space-y-12">
      {showCompact ? (
        <CompactPathSwitcher active={activePath} onSelect={handlePathSelect} />
      ) : (
        <>
          <PathSelector active={activePath} onSelect={handlePathSelect} />
          <TemplatesLinkCard count={templates.length} />
        </>
      )}

      {activePath === "copilot" ? (
        <section className="space-y-10" aria-labelledby="studio-path-copilot">
          <h2 id="studio-path-copilot" className="sr-only">
            {copy.landing.draftWithCopilotHeading}
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

      {activePath === "custom" ? (
        <section className="space-y-6" aria-labelledby="studio-path-custom">
          <h2 id="studio-path-custom" className="sr-only">
            {copy.landing.buildOwnBriefHeading}
          </h2>
          <p className="max-w-2xl text-[13.5px] leading-7 text-[var(--studio-ink-soft)]">
            {copy.landing.customIntro}
          </p>
          <div id="studio-brief-builder">
            <StudioRequestBuilder
              services={services}
              packages={packages}
              teams={teams}
              requestConfig={requestConfig}
              preferredTeamId={preferredTeamId}
              presetHint={presetHint}
              // When path was chosen upstream the lane is already
              // "custom" — start at step 2 (Scope) so the user isn't
              // asked "package or custom?" a second time. They can
              // still tap step 1 (Path) in the rail to revisit it.
              initialStepIndex={pathChosenUpstream ? 1 : 0}
              initialPathway={pathChosenUpstream ? "custom" : undefined}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}

/**
 * Compact horizontal switcher used after the user has already chosen
 * a path upstream (e.g. /pick → /request?path=custom). The full
 * three-tile selector would otherwise stack on mobile and push the
 * brief content below the fold — replacing it with a pill row keeps
 * the path switchable while making the brief itself the visible
 * surface.
 */
function CompactPathSwitcher({
  active,
  onSelect,
}: {
  active: PathKey;
  onSelect: (path: PathKey) => void;
}) {
  const locale = useHenryCoLocale();
  const copy = getStudioRequestCopy(locale);
  const activePath = PATHS.find((p) => p.key === active);
  const activeText = activePath ? pathTileText(copy, activePath.key) : null;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[var(--studio-line)] bg-[rgba(255,255,255,0.025)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {activePath ? (
          <span
            aria-hidden
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[rgba(151,244,243,0.45)] bg-[rgba(151,244,243,0.1)] text-[var(--studio-signal)]"
          >
            <activePath.icon className="h-3.5 w-3.5" />
          </span>
        ) : null}
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
            {activeText?.kicker || copy.landing.briefPathFallbackKicker}
          </p>
          <p className="truncate text-[13px] font-semibold text-[var(--studio-ink)]">
            {activeText?.title || copy.landing.briefPathFallbackTitle}
          </p>
        </div>
      </div>
      <div
        role="tablist"
        aria-label={copy.landing.switchBriefPath}
        className="flex flex-wrap gap-1.5"
      >
        {PATHS.map((path) => {
          const isActive = path.key === active;
          return (
            <button
              key={path.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(path.key)}
              className={[
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-semibold transition",
                isActive
                  ? "border-[rgba(151,244,243,0.55)] bg-[rgba(151,244,243,0.12)] text-[var(--studio-signal)]"
                  : "border-[var(--studio-line)] bg-transparent text-[var(--studio-ink-soft)] hover:border-[rgba(151,244,243,0.35)] hover:text-[var(--studio-ink)]",
              ].join(" ")}
            >
              <path.icon className="h-3 w-3" aria-hidden />
              {path.key === "copilot" ? copy.landing.copilotPill : copy.landing.customPill}
            </button>
          );
        })}
      </div>
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
  const locale = useHenryCoLocale();
  const copy = getStudioRequestCopy(locale);
  return (
    <div
      role="tablist"
      aria-label={copy.landing.howToStart}
      className="grid gap-3 sm:grid-cols-3"
    >
      {PATHS.map((path) => {
        const isActive = path.key === active;
        const Icon = path.icon;
        const text = pathTileText(copy, path.key);
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
                {text.kicker}
              </span>
            </div>
            <h3 className="mt-4 text-[1.05rem] font-semibold leading-snug tracking-tight text-[var(--studio-ink)] sm:text-[1.15rem]">
              {text.title}
            </h3>
            <p className="mt-2 text-[13px] leading-6 text-[var(--studio-ink-soft)]">
              {text.summary}
            </p>
            <div className="mt-4 flex items-center gap-2 text-[12px] font-semibold text-[var(--studio-signal)]">
              <span>{text.hint}</span>
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

/**
 * Quiet bridge to /pick — the templates path is no longer an in-page
 * tab on /request. Instead we surface a single calm card that links
 * out so /request stays focused on brief authoring and /pick stays
 * canonical for ready-made templates + checkout. Resolves the prior
 * duplication where both surfaces re-displayed the template browser.
 */
function TemplatesLinkCard({ count }: { count: number }) {
  const locale = useHenryCoLocale();
  const copy = getStudioRequestCopy(locale);
  return (
    <Link
      href="/pick"
      className="group/tpl-link flex flex-col gap-3 rounded-2xl border border-[var(--studio-line)] bg-[rgba(255,255,255,0.025)] px-5 py-4 transition hover:-translate-y-0.5 hover:border-[rgba(151,244,243,0.45)] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-5"
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--studio-line)] bg-[rgba(151,244,243,0.05)] text-[var(--studio-signal)]"
        >
          <Layers3 className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
            {copy.landing.skipBriefKicker}
          </p>
          <p className="mt-1 text-[14px] font-semibold text-[var(--studio-ink)] sm:text-[15px]">
            {copy.landing.browseTemplates(count)}
          </p>
          <p className="mt-1 text-[12.5px] leading-5 text-[var(--studio-ink-soft)]">
            {copy.landing.eachTemplateShips}
          </p>
        </div>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1.5 self-end text-[12.5px] font-semibold text-[var(--studio-signal)] underline-offset-4 group-hover/tpl-link:underline sm:self-center">
        {copy.landing.browseTemplatesLink}
        <ArrowUpRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}
