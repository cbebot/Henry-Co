"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X, Sparkles } from "lucide-react";
import { useTour } from "./TourProvider";

export default function TourOverlay() {
  const { state, nextStep, prevStep, skipTour } = useTour();
  const router = useRouter();

  const step = state.machine?.steps[state.currentStep];

  useEffect(() => {
    if (step?.route) {
      router.push(step.route);
    }
  }, [step?.route, router]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") skipTour();
    if (e.key === "ArrowRight") nextStep();
    if (e.key === "ArrowLeft") prevStep();
  }, [skipTour, nextStep, prevStep]);

  useEffect(() => {
    if (state.isActive) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [state.isActive, handleKeyDown]);

  if (!state.isActive || !state.machine || !step) return null;

  const totalSteps = state.machine.steps.length;
  const progress = ((state.currentStep + 1) / totalSteps) * 100;
  const isFirst = state.currentStep === 0;
  const isLast = state.currentStep === totalSteps - 1;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={skipTour} />

      {/* Tour card */}
      <div className="relative mx-4 w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
        <div className="overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-2xl dark:bg-[#0F1A2C]">
          {/* Progress bar */}
          <div className="h-1 bg-black/[0.06] dark:bg-white/[0.06]">
            <div
              className="h-full bg-[color:var(--accent)] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Header */}
          <div className="flex items-start justify-between px-8 pt-8">
            <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
              <Sparkles className="h-3.5 w-3.5" />
              Step {state.currentStep + 1} of {totalSteps}
            </div>
            <button
              onClick={skipTour}
              className="rounded-full p-1.5 text-zinc-400 transition hover:bg-black/5 hover:text-zinc-600 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white/70"
              aria-label="Close tour"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="px-8 pb-2 pt-4">
            <h3 className="text-xl font-black tracking-[-0.03em] text-zinc-950 dark:text-white sm:text-2xl">
              {step.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-white/65">
              {step.body}
            </p>

            {step.actionLabel && step.actionHref ? (
              <a
                href={step.actionHref}
                onClick={() => skipTour()}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[color:var(--accent)]/10 px-4 py-2.5 text-sm font-semibold text-[color:var(--accent)] transition hover:bg-[color:var(--accent)]/20"
              >
                {step.actionLabel}
                <ChevronRight className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between border-t border-black/[0.06] px-8 py-5 dark:border-white/[0.06]">
            <button
              onClick={prevStep}
              disabled={isFirst}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-500 transition hover:text-zinc-900 disabled:opacity-30 dark:text-white/50 dark:hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>

            <div className="flex items-center gap-1.5">
              {state.machine.steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === state.currentStep
                      ? "w-6 bg-[color:var(--accent)]"
                      : i < state.currentStep
                        ? "w-1.5 bg-[color:var(--accent)]/40"
                        : "w-1.5 bg-black/10 dark:bg-white/10"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextStep}
              className="care-button-primary inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold"
            >
              {isLast ? "Finish" : "Next"}
              {isLast ? null : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
