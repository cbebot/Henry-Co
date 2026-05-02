"use client";

/**
 * V2-ADDR-01 — Places Autocomplete input.
 *
 * Renders a text input that, on each keystroke (debounced), queries the
 * server-side proxy at `placesEndpoint` and renders predictions.
 *
 * On pick, calls `onPick` with the selected place_id + display description.
 * The parent is then expected to call the parent's `placeDetailsEndpoint` to
 * resolve to a full address — that detail call is not done here because we
 * want the parent to control session token lifecycle and field mapping.
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";

export interface PlacesAutocompleteProps {
  /**
   * Server proxy URL that takes `?q=<query>&session=<token>` and returns:
   *   { predictions: Array<{ place_id, description, main_text, secondary_text }> }
   * The proxy MUST be implemented per app (account hosts the canonical one).
   */
  placesEndpoint: string;
  sessionToken: string;
  countryHint?: string;
  initialValue?: string;
  placeholder?: string;
  /** Fired when the user picks an autocomplete suggestion. */
  onPick: (pick: { place_id: string; description: string }) => void;
  /** Fired on blur with no pick — useful for resetting parent state. */
  onClearWithoutPick?: () => void;
  /** Optional CSS class for the wrapper. Container is `position: relative`. */
  className?: string;
  inputClassName?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

interface Prediction {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
}

const DEBOUNCE_MS = 200;
const MIN_QUERY_LEN = 3;

export default function PlacesAutocomplete({
  placesEndpoint,
  sessionToken,
  countryHint,
  initialValue = "",
  placeholder = "Start typing your address…",
  onPick,
  onClearWithoutPick,
  className,
  inputClassName,
  ariaLabel = "Address",
  disabled = false,
}: PlacesAutocompleteProps) {
  const [query, setQuery] = useState(initialValue);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();

  const search = useCallback(
    async (q: string) => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError(null);
      try {
        const url = new URL(placesEndpoint, window.location.origin);
        url.searchParams.set("q", q);
        url.searchParams.set("session", sessionToken);
        if (countryHint) url.searchParams.set("country", countryHint);
        const res = await fetch(url.toString(), { signal: controller.signal });
        if (!res.ok) throw new Error("Address lookup failed");
        const json = (await res.json()) as { predictions?: Prediction[] };
        setPredictions(json.predictions ?? []);
        setOpen((json.predictions ?? []).length > 0);
        setActiveIdx(0);
      } catch (err) {
        if ((err as { name?: string }).name === "AbortError") return;
        setPredictions([]);
        setOpen(false);
        setError("Couldn't load suggestions. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [placesEndpoint, sessionToken, countryHint]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < MIN_QUERY_LEN) {
      setPredictions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      search(query.trim());
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function handlePick(p: Prediction) {
    setQuery(p.description);
    setOpen(false);
    setPredictions([]);
    onPick({ place_id: p.place_id, description: p.description });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || predictions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % predictions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + predictions.length) % predictions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      handlePick(predictions[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className={`addr-autocomplete-wrap${className ? ` ${className}` : ""}`} style={{ position: "relative" }}>
      <input
        type="text"
        autoComplete="off"
        spellCheck={false}
        value={query}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={open}
        aria-activedescendant={open ? `${listboxId}-opt-${activeIdx}` : undefined}
        className={inputClassName}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => {
          if (predictions.length === 0 && query.trim().length === 0) onClearWithoutPick?.();
        }}
      />
      {loading && (
        <div aria-hidden="true" style={{ position: "absolute", right: 12, top: 12, fontSize: 12, opacity: 0.6 }}>
          …
        </div>
      )}
      {error && (
        <p role="alert" style={{ marginTop: 6, fontSize: 12, color: "#b91c1c" }}>
          {error}
        </p>
      )}
      {open && predictions.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 50,
            marginTop: 4,
            background: "var(--addr-popover-bg, white)",
            border: "1px solid var(--addr-popover-border, #e5e7eb)",
            borderRadius: 12,
            boxShadow: "0 12px 24px -8px rgba(0,0,0,0.18)",
            padding: 4,
            maxHeight: 320,
            overflowY: "auto",
          }}
        >
          {predictions.map((p, i) => (
            <li
              key={p.place_id}
              id={`${listboxId}-opt-${i}`}
              role="option"
              aria-selected={i === activeIdx}
              onMouseDown={(e) => {
                // mousedown so onBlur doesn't close before we register the click
                e.preventDefault();
                handlePick(p);
              }}
              onMouseEnter={() => setActiveIdx(i)}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                cursor: "pointer",
                background: i === activeIdx ? "var(--addr-popover-active, rgba(0,0,0,0.04))" : "transparent",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 14 }}>{p.main_text}</div>
              {p.secondary_text && (
                <div style={{ fontSize: 12, opacity: 0.7 }}>{p.secondary_text}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
