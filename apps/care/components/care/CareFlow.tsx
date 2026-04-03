"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  Home,
  Package2,
  ShieldCheck,
} from "lucide-react";

const SLIDES = [
  {
    label: "Garment movement",
    title: "Wardrobe logistics that feel controlled, not improvised.",
    body: "Pickup, facility intake, treatment, finishing, quality control, and delivery now read like one disciplined service story.",
    stats: ["Pickup logging", "Facility checkpoints", "Finishing + QA"],
    icon: Package2,
    accent: "from-[color:var(--accent)]/20 to-[color:var(--accent-secondary)]/10",
  },
  {
    label: "Residential execution",
    title: "Home cleaning now reads like a service product, not a loose promise.",
    body: "Customers can see scheduling, team arrival, in-progress work, inspection, and recurring cadence without decoding vague status text.",
    stats: ["Room-aware quoting", "Recurring cadence", "Inspection follow-up"],
    icon: Home,
    accent: "from-[color:var(--accent-secondary)]/18 to-[color:var(--accent)]/10",
  },
  {
    label: "Commercial readiness",
    title: "Office cleaning is structured like an actual operating product.",
    body: "After-hours service, site access readiness, supervisor checkpoints, and recurring contract rhythm are presented with real operational clarity.",
    stats: ["Access readiness", "Section checklist", "Commercial cadence"],
    icon: Building2,
    accent: "from-[color:var(--accent-deep)]/18 to-[color:var(--accent)]/10",
  },
  {
    label: "Recurring continuity",
    title: "Recurring plans now read as managed care, not a booking workaround.",
    body: "Preferred windows, repeat cadence, and next-visit visibility stay present across booking, tracking, support, and execution views.",
    stats: ["Cadence visible", "Preferred windows", "Support continuity"],
    icon: CalendarClock,
    accent: "from-[color:var(--accent)]/18 to-white/5",
  },
] as const;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function CareFlow() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setActive((current) => (current + 1) % SLIDES.length);
    }, 4200);

    return () => clearInterval(timer);
  }, [paused]);

  const current = SLIDES[active];
  const progress = useMemo(() => ((active + 1) / SLIDES.length) * 100, [active]);
  const Icon = current.icon;

  return (
    <section
      className="care-dash-card relative overflow-hidden rounded-[2.5rem] p-8 md:p-10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at top, color-mix(in srgb, var(--accent) 18%, transparent), transparent 34%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-1/2"
        style={{
          background:
            "radial-gradient(circle at center, color-mix(in srgb, var(--accent-secondary) 16%, transparent), transparent 42%)",
        }}
      />

      <div className="relative">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="care-kicker">Operational showcase</div>
            <h2 className="mt-3 care-section-title text-white">
              See how each service lane behaves.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/66">
              This motion strip is deliberate. It shows that garment logistics, home cleaning,
              office cleaning, and recurring continuity are no longer being forced into one vague workflow.
            </p>
          </div>

          <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/58">
            Hover to pause
          </div>
        </div>

        <div className="mt-7 h-2 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),var(--accent-secondary))]"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="grid gap-3">
            {SLIDES.map((slide, index) => {
              const SlideIcon = slide.icon;
              const selected = index === active;

              return (
                <button
                  key={slide.label}
                  type="button"
                  onClick={() => setActive(index)}
                  className={cn(
                    "rounded-[1.6rem] border px-5 py-4 text-left transition",
                    selected
                      ? "border-[color:var(--accent)]/25 bg-white/[0.08] text-white shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
                      : "border-white/10 bg-white/[0.03] text-white/72 hover:bg-white/[0.05]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.05]">
                      <SlideIcon className="h-5 w-5 text-[color:var(--accent)]" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
                        {slide.label}
                      </div>
                      <div className="mt-1 text-base font-semibold">
                        {slide.title}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.label}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="grid gap-6 md:grid-cols-[0.85fr_1.15fr]"
              >
                <div
                  className={cn(
                    "relative overflow-hidden rounded-[1.75rem] border border-white/10 p-6",
                    "bg-gradient-to-br",
                    current.accent
                  )}
                >
                  <div className="absolute inset-0 care-grid opacity-20" />
                  <div className="relative">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#06101a]/70">
                      <Icon className="h-6 w-6 text-[color:var(--accent)]" />
                    </div>
                    <div className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-white/72">
                      Service architecture
                    </div>
                    <div className="mt-3 text-3xl font-bold tracking-[-0.05em] text-white">
                      {current.label}
                    </div>

                    <div className="mt-8 grid gap-3">
                      {current.stats.map((item) => (
                        <div
                          key={item}
                          className="rounded-2xl border border-white/12 bg-[#06101a]/58 px-4 py-3 text-sm font-medium text-white/80"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between">
                  <div>
                    <div className="care-kicker">Now showing</div>
                    <h3 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-white md:text-4xl">
                      {current.title}
                    </h3>
                    <p className="mt-4 max-w-xl text-sm leading-7 text-white/68">
                      {current.body}
                    </p>
                  </div>

                  <div className="mt-8 grid gap-3 md:grid-cols-3">
                    {[
                      {
                        title: "Clear handoff",
                        body: "Each status shift maps to a real operational checkpoint.",
                      },
                      {
                        title: "Role-aware",
                        body: "Support, staff, manager, and rider views are no longer guessing at the same timeline.",
                      },
                      {
                        title: "Trust signal",
                        body: "Customers see a clearer, more believable service story.",
                      },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="rounded-[1.4rem] border border-white/10 bg-[#06101a]/62 p-4"
                      >
                        <div className="flex items-center gap-2 text-sm font-semibold text-white">
                          <ShieldCheck className="h-4 w-4 text-[color:var(--accent)]" />
                          {item.title}
                        </div>
                        <p className="mt-3 text-sm leading-6 text-white/62">{item.body}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-[color:var(--accent)]">
                    Service architecture showcase
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
