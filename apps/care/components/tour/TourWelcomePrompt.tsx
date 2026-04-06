"use client";

import { Sparkles, ArrowRight, X } from "lucide-react";
import { useTour } from "./TourProvider";
import type { TourMachine, TourScope } from "@/lib/tour/engine";

export default function TourWelcomePrompt({
  machine,
  scope,
}: {
  machine: TourMachine;
  scope: TourScope;
}) {
  const { shouldPrompt, startTour, skipTour } = useTour();

  if (!shouldPrompt) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center px-3 py-8">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={skipTour} />
      <div className="relative mx-4 mb-4 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300 sm:mb-0">
        <div className="overflow-hidden rounded-[2rem] border border-white/20 bg-white p-8 shadow-2xl dark:bg-[#0F1A2C]">
          <button
            onClick={skipTour}
            className="absolute right-4 top-4 rounded-full p-2 text-zinc-400 transition hover:bg-black/5 hover:text-zinc-600 dark:text-white/40 dark:hover:bg-white/10"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10">
            <Sparkles className="h-6 w-6 text-[color:var(--accent)]" />
          </div>

          <h3 className="mt-5 text-xl font-black tracking-[-0.03em] text-zinc-950 dark:text-white">
            {machine.name}
          </h3>
          <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/65">
            {machine.description}. Would you like a quick guided tour? It only takes a minute.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={() => startTour(machine, scope)}
              className="care-button-primary inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold"
            >
              Start tour
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={skipTour}
              className="rounded-2xl px-5 py-3 text-sm font-semibold text-zinc-500 transition hover:text-zinc-900 dark:text-white/50 dark:hover:text-white"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
