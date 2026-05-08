/**
 * Hook: usePaletteSuggestions — fetch /api/dashboard/suggestions when
 * the palette opens with no query.
 *
 * RLS-bearing on the server. Cache discipline: every response is
 * `private, max-age=0, must-revalidate`. We therefore don't cache
 * client-side either.
 */

"use client";

import { useEffect, useState } from "react";
import type {
  PaletteSuggestion,
  SuggestionsWirePayload,
} from "@henryco/search-core";

export interface UsePaletteSuggestionsResult {
  suggestions: PaletteSuggestion[];
  loading: boolean;
  error: string | null;
}

export function usePaletteSuggestions(options: {
  endpoint?: string;
  /** Only fetch when this is true (the palette's open + empty-query gate). */
  enabled?: boolean;
  /** External retry handle — bumping triggers a refetch. */
  nonce?: number;
} = {}): UsePaletteSuggestionsResult {
  const { endpoint = "/api/dashboard/suggestions", enabled = true, nonce = 0 } = options;
  const [suggestions, setSuggestions] = useState<PaletteSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(endpoint, { signal: controller.signal, headers: { Accept: "application/json" } })
      .then(async (response) => {
        if (!response.ok) throw new Error(`suggestions: ${response.status}`);
        const json = (await response.json()) as SuggestionsWirePayload;
        if (cancelled) return;
        setSuggestions(Array.isArray(json.suggestions) ? json.suggestions : []);
      })
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === "AbortError" || cancelled) return;
        setError(err instanceof Error ? err.message : "suggestions fetch failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [endpoint, enabled, nonce]);

  return { suggestions, loading, error };
}
