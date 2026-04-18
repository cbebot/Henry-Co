import type { ComponentType } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Home,
  Package,
  ShieldCheck,
  Sparkles,
  Truck,
  TriangleAlert,
} from "lucide-react";
import { translateSurfaceLabel, type AppLocale } from "@henryco/i18n";
import {
  getTrackingCurrentIndex,
  getTrackingHeadline,
  getTrackingStatusLabel,
  getTrackingSteps,
  getTrackingSupportCopy,
  getTrackingTone,
  type CareServiceFamily,
  type CareTrackingIconKey,
} from "@/lib/care-tracking";

const ICONS: Record<CareTrackingIconKey, ComponentType<{ className?: string }>> = {
  alert: TriangleAlert,
  briefcase: BriefcaseBusiness,
  building: BriefcaseBusiness,
  calendar: CalendarDays,
  check: CheckCircle2,
  clipboard: ClipboardList,
  clock: Clock3,
  home: Home,
  package: Package,
  shield: ShieldCheck,
  sparkles: Sparkles,
  truck: Truck,
};

function toneClasses(tone: ReturnType<typeof getTrackingTone>) {
  if (tone === "emerald") {
    return "border-emerald-300/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100";
  }
  if (tone === "blue") {
    return "border-cyan-300/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-100";
  }
  if (tone === "violet") {
    return "border-violet-300/30 bg-violet-500/10 text-violet-700 dark:text-violet-100";
  }
  if (tone === "red") {
    return "border-red-300/30 bg-red-500/10 text-red-700 dark:text-red-100";
  }
  return "border-amber-300/30 bg-amber-500/10 text-amber-700 dark:text-amber-100";
}

export default function TrackTimeline({
  locale,
  family,
  status,
}: {
  locale: AppLocale;
  family: CareServiceFamily;
  status: string;
}) {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const normalizedTone = getTrackingTone(status, family);
  const steps = getTrackingSteps(family);
  const current = getTrackingCurrentIndex(status, family);
  const currentLabel = t(getTrackingStatusLabel(status, family));

  if (String(status || "").toLowerCase() === "cancelled") {
    const cancelledCopy =
      family === "garment"
        ? t("This garment order was cancelled before pickup, finishing, or delivery completed.")
        : family === "home"
        ? t("This home-cleaning visit was cancelled before the service run reached completion.")
        : t("This office-cleaning visit was cancelled before the on-site service run was completed.");

    return (
      <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-6">
        <div className="flex items-center gap-3 text-red-100">
          <TriangleAlert className="h-5 w-5" />
          <div className="text-sm font-semibold uppercase tracking-[0.16em]">{t("Booking cancelled")}</div>
        </div>
        <div className="mt-3 text-sm text-red-100/85">
          {cancelledCopy}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[32px] border border-black/10 bg-white/85 p-6 shadow-[0_14px_34px_rgba(0,0,0,0.06)] backdrop-blur-0 md:shadow-[0_18px_60px_rgba(0,0,0,0.06)] md:backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_60px_rgba(0,0,0,0.24)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
            {t(getTrackingHeadline(family))}
          </div>
          <div className="mt-2 text-3xl font-bold text-zinc-950 dark:text-white">
            {currentLabel}
          </div>
          <div className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-white/65">
            {t(getTrackingSupportCopy(family))}
          </div>
        </div>

        <div className={`rounded-3xl border px-5 py-4 text-sm font-semibold ${toneClasses(normalizedTone)}`}>
          {t("Current status")}: {currentLabel}
        </div>
      </div>

      <div className="mt-8 grid gap-4 xl:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = ICONS[step.icon];
          const done = index < current;
          const active = index === current;

          return (
            <article
              key={step.key}
              className={`rounded-3xl border p-5 transition ${
                active
                  ? "border-[color:var(--accent)]/30 bg-[color:var(--accent)]/10"
                  : done
                    ? "border-emerald-300/25 bg-emerald-500/10"
                    : "border-black/10 bg-black/[0.03] dark:border-white/10 dark:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${
                    active
                      ? "bg-[color:var(--accent)] text-[#07111F]"
                      : done
                        ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-100"
                        : "bg-white text-zinc-500 dark:bg-white/10 dark:text-white/55"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
                    {t("Step")} {index + 1}
                  </div>
                  <div className="mt-1 text-lg font-semibold text-zinc-950 dark:text-white">
                    {t(step.label)}
                  </div>
                </div>
              </div>

              <div className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-white/65">
                {t(step.description)}
              </div>

              <div className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
                {active ? t("Current stage") : done ? t("Completed") : t("Pending")}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
