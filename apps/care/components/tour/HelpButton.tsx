"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { HelpCircle, X, Sparkles, ChevronRight, BookOpen, MessageCircleQuestion } from "lucide-react";
import { useTour } from "./TourProvider";
import { getHelpForRoute } from "@/lib/tour/help-content";
import type { TourMachine, TourScope } from "@/lib/tour/engine";

export default function HelpButton({
  machine,
  scope,
}: {
  machine: TourMachine | null;
  scope: TourScope;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { startTour } = useTour();
  const help = getHelpForRoute(pathname);

  return (
    <>
      {/* Floating help button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[100] flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--accent)] text-[#07111F] shadow-lg transition hover:scale-105 hover:shadow-xl active:scale-95"
        aria-label="Help"
      >
        <HelpCircle className="h-5 w-5" />
      </button>

      {/* Help drawer */}
      {isOpen ? (
        <div className="fixed inset-0 z-[9997] flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative h-full w-full max-w-md animate-in slide-in-from-right duration-200">
            <div className="flex h-full flex-col overflow-hidden border-l border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0F1A2C]">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-5 dark:border-white/[0.06]">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                    <BookOpen className="h-3.5 w-3.5" />
                    Help & Guidance
                  </div>
                  <h3 className="mt-1 text-lg font-black tracking-[-0.03em] text-zinc-950 dark:text-white">
                    {help?.title || "Help"}
                  </h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-2 text-zinc-400 transition hover:bg-black/5 hover:text-zinc-600 dark:text-white/40 dark:hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                {help ? (
                  <div className="space-y-6">
                    {/* Page description */}
                    <div>
                      <p className="text-sm leading-7 text-zinc-600 dark:text-white/65">
                        {help.description}
                      </p>
                    </div>

                    {/* Tips */}
                    {help.tips.length > 0 ? (
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
                          Tips
                        </h4>
                        <ul className="mt-3 space-y-2.5">
                          {help.tips.map((tip, i) => (
                            <li key={i} className="flex gap-3 text-sm leading-6 text-zinc-700 dark:text-white/70">
                              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--accent)]" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {/* FAQ */}
                    {help.faq.length > 0 ? (
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
                          Common Questions
                        </h4>
                        <div className="mt-3 space-y-4">
                          {help.faq.map((item, i) => (
                            <div key={i} className="rounded-2xl border border-black/[0.06] bg-black/[0.02] p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
                              <div className="flex items-start gap-2.5">
                                <MessageCircleQuestion className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--accent)]" />
                                <div>
                                  <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                                    {item.question}
                                  </div>
                                  <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-white/60">
                                    {item.answer}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500 dark:text-white/50">
                    No specific help available for this page yet.
                  </p>
                )}
              </div>

              {/* Footer with tour replay */}
              {machine ? (
                <div className="border-t border-black/[0.06] px-6 py-5 dark:border-white/[0.06]">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      startTour(machine, scope);
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                  >
                    <Sparkles className="h-4 w-4 text-[color:var(--accent)]" />
                    Replay guided tour
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
