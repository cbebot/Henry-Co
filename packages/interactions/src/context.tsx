"use client";

/**
 * @henryco/interactions — the dependency-injection edge.
 *
 * All React context providers + hooks that the engines read from live here.
 * The app mounts these once (near the public shell root) and wires each to
 * the real system: telemetry → @henryco/observability, labels → @henryco/i18n,
 * currency → @henryco/pricing. The engines never hard-import those packages.
 */

import { createContext, useContext, type ReactNode } from "react";
import { noopSink, type InteractionTelemetrySink } from "./telemetry";
import { defaultCurrencyFormatter, type CurrencyFormatter } from "./pricing";

const TelemetryContext = createContext<InteractionTelemetrySink>(noopSink);

export function InteractionTelemetryProvider({
  sink,
  children,
}: {
  sink: InteractionTelemetrySink;
  children: ReactNode;
}) {
  return <TelemetryContext.Provider value={sink}>{children}</TelemetryContext.Provider>;
}

/** Read the injected telemetry sink. Defaults to `noopSink` when no provider is mounted. */
export function useInteractionTelemetry(): InteractionTelemetrySink {
  return useContext(TelemetryContext);
}

const CurrencyContext = createContext<CurrencyFormatter>(defaultCurrencyFormatter);

export function CurrencyProvider({
  format,
  children,
}: {
  format: CurrencyFormatter;
  children: ReactNode;
}) {
  return <CurrencyContext.Provider value={format}>{children}</CurrencyContext.Provider>;
}

/** Read the injected currency formatter. Defaults to an Intl-based fallback. */
export function useCurrencyFormatter(): CurrencyFormatter {
  return useContext(CurrencyContext);
}
