"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { TourMachine, TourScope } from "@/lib/tour/engine";
import { saveTourProgress, hasSeenTour } from "@/lib/tour/engine";

type TourState = {
  isActive: boolean;
  currentStep: number;
  machine: TourMachine | null;
  scope: TourScope | null;
};

type TourContextValue = {
  state: TourState;
  startTour: (machine: TourMachine, scope: TourScope) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  endTour: () => void;
  shouldPrompt: boolean;
};

const TourContext = createContext<TourContextValue | null>(null);

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within TourProvider");
  return ctx;
}

export default function TourProvider({
  scope,
  machine,
  children,
}: {
  scope: TourScope;
  machine: TourMachine | null;
  children: ReactNode;
}) {
  const [state, setState] = useState<TourState>({
    isActive: false,
    currentStep: 0,
    machine: null,
    scope: null,
  });

  const [shouldPrompt, setShouldPrompt] = useState(false);

  useEffect(() => {
    if (machine && !hasSeenTour(scope, machine.version)) {
      // Small delay so the page loads first
      const timer = setTimeout(() => setShouldPrompt(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [scope, machine]);

  const startTour = useCallback((m: TourMachine, s: TourScope) => {
    setState({ isActive: true, currentStep: 0, machine: m, scope: s });
    setShouldPrompt(false);
    saveTourProgress(s, {
      machineId: m.id,
      version: m.version,
      currentStep: 0,
      completed: false,
      skipped: false,
      startedAt: new Date().toISOString(),
    });
  }, []);

  const nextStep = useCallback(() => {
    setState((prev) => {
      if (!prev.machine || !prev.scope) return prev;
      const next = prev.currentStep + 1;
      if (next >= prev.machine.steps.length) {
        saveTourProgress(prev.scope, {
          machineId: prev.machine.id,
          version: prev.machine.version,
          currentStep: next,
          completed: true,
          skipped: false,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        });
        return { isActive: false, currentStep: 0, machine: null, scope: null };
      }
      saveTourProgress(prev.scope, {
        machineId: prev.machine.id,
        version: prev.machine.version,
        currentStep: next,
        completed: false,
        skipped: false,
        startedAt: new Date().toISOString(),
      });
      return { ...prev, currentStep: next };
    });
  }, []);

  const prevStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1),
    }));
  }, []);

  const skipTour = useCallback(() => {
    setState((prev) => {
      if (prev.machine && prev.scope) {
        saveTourProgress(prev.scope, {
          machineId: prev.machine.id,
          version: prev.machine.version,
          currentStep: prev.currentStep,
          completed: false,
          skipped: true,
          startedAt: new Date().toISOString(),
        });
      }
      return { isActive: false, currentStep: 0, machine: null, scope: null };
    });
    setShouldPrompt(false);
  }, []);

  const endTour = useCallback(() => {
    setState({ isActive: false, currentStep: 0, machine: null, scope: null });
  }, []);

  return (
    <TourContext.Provider value={{ state, startTour, nextStep, prevStep, skipTour, endTour, shouldPrompt }}>
      {children}
    </TourContext.Provider>
  );
}
