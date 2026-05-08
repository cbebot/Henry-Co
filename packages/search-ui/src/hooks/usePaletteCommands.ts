/**
 * Hook: usePaletteCommands — fetch /api/dashboard/commands once per
 * mount, refetch on viewer change.
 *
 * Refetch is rare — commands change when role gates flip (rare) or
 * when feature flags flip (also rare). The palette UI calls
 * `refetch()` on its own lifecycle when needed.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import type { CommandsWirePayload, WireCommand } from "@henryco/dashboard-shell";

export interface UsePaletteCommandsResult {
  commands: WireCommand[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePaletteCommands(options: {
  endpoint?: string;
  enabled?: boolean;
  /**
   * External retry handle. Bumping `nonce` triggers a refetch even if
   * the endpoint hasn't changed. Used by the palette's shared retry
   * button so a single click clears the error across all hooks.
   */
  nonce?: number;
} = {}): UsePaletteCommandsResult {
  const { endpoint = "/api/dashboard/commands", enabled = true, nonce = 0 } = options;
  const [commands, setCommands] = useState<WireCommand[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(endpoint, { signal: controller.signal, headers: { Accept: "application/json" } })
      .then(async (response) => {
        if (!response.ok) throw new Error(`commands: ${response.status}`);
        const json = (await response.json()) as CommandsWirePayload;
        if (cancelled) return;
        setCommands(Array.isArray(json.commands) ? json.commands : []);
      })
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === "AbortError" || cancelled) return;
        setError(err instanceof Error ? err.message : "commands fetch failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [endpoint, enabled, tick, nonce]);

  return { commands, loading, error, refetch };
}
