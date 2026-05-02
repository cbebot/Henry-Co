/**
 * Hook: useSearchQuery — debounced fetcher against /api/search.
 *
 * Lives in @henryco/search-ui (not search-core) because it is React-bound
 * and uses fetch+abort directly. The server-side wrapper is in
 * search-core/query.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import type { SearchOutput } from "@henryco/search-core";

interface UseSearchQueryOptions {
  endpoint?: string;
  debounceMs?: number;
  divisions?: string[];
  enabled?: boolean;
}

interface UseSearchQueryResult {
  query: string;
  setQuery: (q: string) => void;
  data: SearchOutput | null;
  loading: boolean;
  error: string | null;
}

export function useSearchQuery(options: UseSearchQueryOptions = {}): UseSearchQueryResult {
  const { endpoint = "/api/search", debounceMs = 160, divisions, enabled = true } = options;
  const [query, setQuery] = useState("");
  const [data, setData] = useState<SearchOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) {
      setData(null);
      setLoading(false);
      return;
    }
    const trimmed = query.trim();
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ q: trimmed });
        if (divisions && divisions.length > 0) params.set("division", divisions.join(","));
        const response = await fetch(`${endpoint}?${params.toString()}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }
        const json = (await response.json()) as SearchOutput;
        setData(json);
      } catch (err) {
        if ((err as { name?: string }).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, endpoint, debounceMs, enabled, divisions?.join(",")]);

  return { query, setQuery, data, loading, error };
}
