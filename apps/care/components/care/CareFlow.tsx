"use client";

import { Building2, CalendarClock, Home, Package2 } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";

/**
 * CareFlow — the four service lanes as a calm, static editorial spread
 * (V3-PUBLIC-REBUILD-care). Replaces the old always-dark, auto-rotating,
 * nested-panel "dashboard" slab that read as a dirty dark island on the light
 * page. Now: a left intro column + a hairline-divided lane list on the page's
 * own theme-aware canvas (cobalt accent), matching the property differentiator
 * pattern. No glows, no rotation, no card-in-card.
 */
const LANES = [
  {
    n: "01",
    label: "Garment movement",
    title: "Wardrobe logistics that feel controlled, not improvised.",
    body: "Pickup, facility intake, treatment, finishing, quality control, and delivery read like one disciplined service story.",
    points: ["Pickup logging", "Facility checkpoints", "Finishing + QA"],
    icon: Package2,
  },
  {
    n: "02",
    label: "Residential execution",
    title: "Home cleaning that reads like a service product.",
    body: "Scheduling, team arrival, in-progress work, inspection, and recurring cadence — visible without decoding vague status text.",
    points: ["Room-aware quoting", "Recurring cadence", "Inspection follow-up"],
    icon: Home,
  },
  {
    n: "03",
    label: "Commercial readiness",
    title: "Office cleaning structured like an operating product.",
    body: "After-hours service, site-access readiness, supervisor checkpoints, and recurring contract rhythm — with real operational clarity.",
    points: ["Access readiness", "Section checklist", "Commercial cadence"],
    icon: Building2,
  },
  {
    n: "04",
    label: "Recurring continuity",
    title: "Recurring plans that read as managed care.",
    body: "Preferred windows, repeat cadence, and next-visit visibility stay present across booking, tracking, support, and execution.",
    points: ["Cadence visible", "Preferred windows", "Support continuity"],
    icon: CalendarClock,
  },
] as const;

export default function CareFlow() {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
      <div className="lg:sticky lg:top-28">
        <p className="care-kicker">{t("Service overview")}</p>
        <h2 className="mt-4 max-w-md text-balance care-section-title text-[color:var(--care-text)]">
          {t("See how each service lane behaves.")}
        </h2>
        <p className="mt-4 max-w-md text-sm leading-7 text-[color:var(--care-muted)]">
          {t(
            "Garment care, home cleaning, office cleaning, and recurring service each move through one clear, trackable customer journey.",
          )}
        </p>
      </div>

      <ol className="divide-y divide-[color:var(--care-border)] border-y border-[color:var(--care-border)]">
        {LANES.map((lane) => {
          const Icon = lane.icon;
          return (
            <li key={lane.n} className="grid gap-4 py-6 sm:grid-cols-[auto_1fr] sm:gap-6">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] font-semibold tracking-[0.22em] text-[color:var(--accent)]">
                  {lane.n}
                </span>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--care-border)] text-[color:var(--accent)]">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
              </div>
              <div>
                <p className="care-kicker">{t(lane.label)}</p>
                <h3 className="mt-2 text-lg font-semibold tracking-tight text-[color:var(--care-text)]">
                  {t(lane.title)}
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-[color:var(--care-muted)]">
                  {t(lane.body)}
                </p>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[12.5px] text-[color:var(--care-muted)]">
                  {lane.points.map((pt) => (
                    <span key={pt} className="inline-flex items-center gap-1.5">
                      <span aria-hidden className="h-1 w-1 rounded-full bg-[color:var(--accent)]" />
                      {t(pt)}
                    </span>
                  ))}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
