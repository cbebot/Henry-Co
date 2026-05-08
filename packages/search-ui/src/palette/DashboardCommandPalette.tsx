"use client";

/**
 * DashboardCommandPalette — the unified Cmd+K command palette for the
 * V2 dashboard shell.
 *
 * Replaces the legacy `CommandPalette` (kept exported for back-compat
 * via `./CommandPalette`) with a shell-primitive-driven version that:
 *
 *   - Uses `<BottomSheet>` (mobile) or a custom Dialog rendered with
 *     shell tokens (desktop) — anti-pattern #21.
 *   - Aggregates four sources: per-module commands (server),
 *     federated search (server), recents (localStorage), suggestions
 *     (server).
 *   - Wires Cmd+K, "/", "?", Esc, Tab/Shift+Tab, Up/Down, Enter,
 *     Cmd+1..9.
 *   - role=combobox + role=listbox + aria-activedescendant.
 *   - aria-live status updates on result-count and active row.
 *   - Premium ranker (ranker.ts) — typo-tolerant trigraph match,
 *     recency × frequency decay, scope alignment boost.
 *   - Active row is HenryCo gold, never blue (anti-pattern #15).
 *   - Reduced-motion-aware via the shell motion tokens.
 *
 * Hosts:
 *   - apps/account mounts the palette via the existing PaletteHost
 *     wrapper. The host passes `userId` so recents are scoped, plus
 *     `moduleJumpEntries` for Cmd+1..9 from the live rail order.
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Loader2, Search as SearchIcon, Sparkles, X } from "lucide-react";

import {
  BottomSheet,
  EmptyState,
} from "@henryco/dashboard-shell/components";
import {
  CSS_VARS,
  EASE_OUT,
  FADE_MS,
  RADIUS,
  typeStyle,
} from "@henryco/dashboard-shell/tokens";

import { useCommandKey } from "../hooks/useCommandKey";
import { useSearchQuery } from "../hooks/useSearchQuery";
import { usePaletteCommands } from "../hooks/usePaletteCommands";
import { usePaletteSuggestions } from "../hooks/usePaletteSuggestions";
import { useIsMobilePalette } from "../hooks/useIsMobilePalette";
import { useModuleJumpKeys, type ModuleJumpEntry } from "../hooks/useModuleJumpKeys";

import { aggregate } from "./aggregator";
import { rankPaletteRows } from "./ranker";
import { KeyboardCheatSheet } from "./KeyboardCheatSheet";
import { PaletteResultRow } from "./PaletteResultRow";
import {
  loadRecents,
  saveRecent,
  clearRecents,
  PALETTE_CLEAR_RECENTS_EVENT,
} from "./recents";
import type { PaletteGroup, PaletteRow, StoredRecent } from "./types";

const DIVISION_SCOPES: Array<{ key: string; label: string }> = [
  { key: "marketplace", label: "Marketplace" },
  { key: "wallet", label: "Wallet" },
  { key: "care", label: "Care" },
  { key: "property", label: "Property" },
  { key: "jobs", label: "Jobs" },
  { key: "learn", label: "Learn" },
  { key: "logistics", label: "Logistics" },
  { key: "studio", label: "Studio" },
];

/**
 * Cycling example prompts — drawn from real surfaces so users learn
 * the system by reading. Anti-pattern #17 — no patronising welcome
 * copy.
 */
const PROMPT_HINTS: ReadonlyArray<string> = [
  "Try “orders awaiting confirmation”",
  "Try “withdraw to my Access bank”",
  "Try “verify identity”",
  "Try “download last invoice”",
  "Try “support ticket #4382”",
  "Try “resume my care booking”",
  "Try “message Studio team”",
];

export interface DashboardCommandPaletteController {
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export interface DashboardCommandPaletteProps {
  /** Endpoint for federated content search. Default /api/search. */
  searchEndpoint?: string;
  /** Endpoint for per-module commands. Default /api/dashboard/commands. */
  commandsEndpoint?: string;
  /** Endpoint for empty-state suggestions. Default /api/dashboard/suggestions. */
  suggestionsEndpoint?: string;
  /** Resolved user_id — drives recents storage key. */
  userId: string | null;
  /** First 9 eligible modules in rail order, for Cmd+1..9. */
  moduleJumpEntries?: ReadonlyArray<ModuleJumpEntry>;
  /**
   * Optional telemetry sink. Called for `open`, `select`, `dismiss`,
   * `query` events. The host app may forward to the existing
   * `@henryco/observability` logger or to PostHog. The palette never
   * sends telemetry on its own (host-controlled).
   */
  onTelemetry?: (event: PaletteTelemetryEvent) => void;
}

export type PaletteTelemetryEvent =
  | { kind: "open"; trigger: "shortcut" | "click"; at: number }
  | { kind: "dismiss"; reason: "esc" | "backdrop" | "select"; at: number }
  | { kind: "query"; query: string; resultCount: number; at: number }
  | {
      kind: "select";
      rowKind: "command" | "search" | "recent" | "suggestion";
      sourceId: string;
      href: string;
      query: string;
      at: number;
    };

export const DashboardCommandPalette = forwardRef<
  DashboardCommandPaletteController,
  DashboardCommandPaletteProps
>(function DashboardCommandPalette(
  {
    searchEndpoint = "/api/search",
    commandsEndpoint = "/api/dashboard/commands",
    suggestionsEndpoint = "/api/dashboard/suggestions",
    userId,
    moduleJumpEntries = [],
    onTelemetry,
  },
  ref,
) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(0);
  const [cheatOpen, setCheatOpen] = useState(false);
  const [recents, setRecents] = useState<StoredRecent[]>([]);
  const [navigating, setNavigating] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useStableId("hc-palette-listbox");
  const liveRegionId = useStableId("hc-palette-live");

  const isMobile = useIsMobilePalette();

  // Wire Cmd+K + "/" via the existing hook.
  useCommandKey(
    useCallback(() => {
      setOpen((prev) => {
        const next = !prev;
        if (next && onTelemetry) {
          onTelemetry({ kind: "open", trigger: "shortcut", at: Date.now() });
        }
        return next;
      });
    }, [onTelemetry]),
  );

  // Cmd+1..9 module jumps work even when the palette is closed.
  useModuleJumpKeys(moduleJumpEntries);

  useImperativeHandle(
    ref,
    () => ({
      open: () => {
        setOpen(true);
        if (onTelemetry) {
          onTelemetry({ kind: "open", trigger: "click", at: Date.now() });
        }
      },
      close: () => setOpen(false),
      toggle: () => setOpen((prev) => !prev),
    }),
    [onTelemetry],
  );

  // Listen for the layout's signOut event and wipe local recents.
  useEffect(() => {
    function onClear() {
      clearRecents(userId);
      setRecents([]);
    }
    window.addEventListener(PALETTE_CLEAR_RECENTS_EVENT, onClear);
    return () => window.removeEventListener(PALETTE_CLEAR_RECENTS_EVENT, onClear);
  }, [userId]);

  // Load recents whenever the palette opens; reset state.
  useEffect(() => {
    if (!open) return;
    setRecents(loadRecents(userId));
    setHighlight(0);
    setNavigating(false);
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [open, userId]);

  // Cycle the placeholder hint while open + idle. 4 s cadence reads
  // calmly — fast enough to teach, slow enough to ignore.
  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => {
      setHintIndex((prev) => (prev + 1) % PROMPT_HINTS.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, [open]);

  const queryHandle = useSearchQuery({
    endpoint: searchEndpoint,
    divisions: scope ? [scope] : undefined,
    enabled: open,
  });
  const { query, setQuery, data: searchData, loading: searchLoading } = queryHandle;
  const trimmed = query.trim();

  const commandsHandle = usePaletteCommands({
    endpoint: commandsEndpoint,
    enabled: open,
  });
  const { commands, loading: commandsLoading } = commandsHandle;

  const suggestionsHandle = usePaletteSuggestions({
    endpoint: suggestionsEndpoint,
    enabled: open && trimmed.length === 0,
  });
  const { suggestions, loading: suggestionsLoading } = suggestionsHandle;

  const aggregated = useMemo(
    () =>
      aggregate({
        query,
        scope,
        commands,
        searchResults: searchData?.hits ?? [],
        suggestions,
        recents,
      }),
    [query, scope, commands, searchData, suggestions, recents],
  );

  // Premium ranker pass — the aggregator decides grouping, the ranker
  // re-orders flat rows by signal score. We then rebuild the groups
  // from the ranker output preserving the group attribution on each
  // row so users still see "Suggestions" / "Commands" / "Search"
  // section labels.
  const rankedFlat = useMemo(() => {
    if (aggregated.flat.length === 0) return aggregated.flat;
    return rankPaletteRows({
      query: trimmed,
      scope,
      recents,
      rows: aggregated.flat,
    }).rows;
  }, [aggregated.flat, trimmed, scope, recents]);

  const groups: PaletteGroup[] = useMemo(() => {
    if (rankedFlat.length === 0) return aggregated.groups;
    const byKey = new Map<PaletteGroup["key"], PaletteRow[]>();
    for (const row of rankedFlat) {
      const list = byKey.get(row.group) ?? [];
      list.push(row);
      byKey.set(row.group, list);
    }
    // Preserve the aggregator's declared group order.
    return aggregated.groups
      .map((g) => ({ ...g, rows: byKey.get(g.key) ?? [] }))
      .filter((g) => g.rows.length > 0);
  }, [aggregated.groups, rankedFlat]);

  const flat = rankedFlat;

  // Keep highlight inside the visible range when groups change.
  useEffect(() => {
    if (highlight >= flat.length) {
      setHighlight(Math.max(0, flat.length - 1));
    }
  }, [flat.length, highlight]);

  const close = useCallback(
    (reason: "esc" | "backdrop" | "select" = "esc") => {
      setOpen(false);
      setQuery("");
      setScope(null);
      if (onTelemetry) {
        onTelemetry({ kind: "dismiss", reason, at: Date.now() });
      }
    },
    [setQuery, onTelemetry],
  );

  const commitRow = useCallback(
    (row: PaletteRow) => {
      saveRecent(userId, row);
      setRecents(loadRecents(userId));
      setNavigating(true);
      if (onTelemetry) {
        onTelemetry({
          kind: "select",
          rowKind: row.kind,
          sourceId: row.sourceId,
          href: row.href,
          query,
          at: Date.now(),
        });
      }
      // Brief defer so the surface can run its close animation before
      // navigation steals paint.
      window.setTimeout(() => {
        window.location.assign(row.href);
      }, 30);
    },
    [userId, onTelemetry, query],
  );

  // Telemetry: emit a `query` event after each search settles. We
  // batch via a debounce-of-debounces by waiting for the search hook
  // to leave loading, then emit if the query has changed since last.
  const lastQueryEmittedRef = useRef<string>("");
  useEffect(() => {
    if (!open || !onTelemetry) return;
    if (searchLoading) return;
    if (query === lastQueryEmittedRef.current) return;
    lastQueryEmittedRef.current = query;
    onTelemetry({
      kind: "query",
      query,
      resultCount: (searchData?.hits?.length ?? 0) + commands.length + suggestions.length,
      at: Date.now(),
    });
  }, [open, onTelemetry, query, searchLoading, searchData, commands, suggestions]);

  // Keyboard surface — Esc / Up / Down / Enter / Tab.
  useEffect(() => {
    if (!open) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close("esc");
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlight((current) =>
          flat.length === 0 ? 0 : Math.min(flat.length - 1, current + 1),
        );
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlight((current) => Math.max(0, current - 1));
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const row = flat[highlight];
        if (row) commitRow(row);
        return;
      }
      if (event.key === "Tab") {
        event.preventDefault();
        const next = jumpToNeighbouringGroup(groups, flat, highlight, !event.shiftKey);
        setHighlight(next);
      }
    }
    window.addEventListener("keydown", handleKey, true);
    return () => window.removeEventListener("keydown", handleKey, true);
  }, [open, close, flat, highlight, groups, commitRow]);

  // "?" cheat sheet — global, ignores when typing in any field.
  useEffect(() => {
    function handler(event: KeyboardEvent) {
      if (event.key !== "?" || !event.shiftKey) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }
      event.preventDefault();
      setCheatOpen((prev) => !prev);
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const activeRowId = flat[highlight] ? `${listboxId}-row-${highlight}` : "";

  // ARIA live announcement — count + active row title. Kept terse so
  // screen readers don't drown the user.
  const liveMessage = useMemo(() => {
    if (!open) return "";
    if (flat.length === 0) {
      return trimmed ? `No results for ${trimmed}.` : "Idle. Type to search.";
    }
    const active = flat[highlight];
    return `${flat.length} result${flat.length === 1 ? "" : "s"}. Highlighted: ${active?.label ?? ""}.`;
  }, [open, flat, trimmed, highlight]);

  const placeholderHint = PROMPT_HINTS[hintIndex] ?? PROMPT_HINTS[0]!;

  const body = (
    <PaletteBody
      query={query}
      onQuery={setQuery}
      placeholderHint={placeholderHint}
      scope={scope}
      onScope={setScope}
      groups={groups}
      flat={flat}
      highlight={highlight}
      setHighlight={setHighlight}
      listboxId={listboxId}
      activeRowId={activeRowId}
      commitRow={commitRow}
      inputRef={inputRef}
      loading={searchLoading || commandsLoading || suggestionsLoading}
      navigating={navigating}
      onClose={() => close("backdrop")}
      isMobile={isMobile}
    />
  );

  return (
    <>
      <span
        id={liveRegionId}
        role="status"
        aria-live="polite"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {liveMessage}
      </span>
      {open ? (
        isMobile ? (
          <BottomSheet
            open={open}
            onClose={() => close("backdrop")}
            tall
            kicker="Search HenryCo"
            title="Find anything"
          >
            {body}
          </BottomSheet>
        ) : (
          <DesktopDialog onClose={() => close("backdrop")}>{body}</DesktopDialog>
        )
      ) : null}
      <KeyboardCheatSheet
        open={cheatOpen}
        onClose={() => setCheatOpen(false)}
        moduleCount={moduleJumpEntries.length}
      />
    </>
  );
});

/**
 * DesktopDialog — centred modal styled with shell tokens. Premium
 * surface: hairline border, soft elevated shadow, gold-tinted gradient
 * backplate, glass-morphism backdrop. Anti-pattern #14 (no default
 * tailwind dialogs).
 */
function DesktopDialog({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 8500,
        backgroundColor: "rgba(5, 8, 22, 0.42)",
        backdropFilter: "blur(6px) saturate(1.1)",
        WebkitBackdropFilter: "blur(6px) saturate(1.1)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "9vh 1rem 1rem",
        animation: `henrycoSurfaceEntry ${FADE_MS}ms ${EASE_OUT}`,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="HenryCo command palette"
        onClick={(event) => event.stopPropagation()}
        style={{
          position: "relative",
          width: "min(720px, 100%)",
          backgroundColor: `var(${CSS_VARS.surface})`,
          color: `var(${CSS_VARS.ink})`,
          borderRadius: RADIUS.xl,
          border: `1px solid var(${CSS_VARS.hairline})`,
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.6) inset, 0 32px 80px -28px rgba(5, 8, 22, 0.45), 0 12px 32px -16px rgba(5, 8, 22, 0.25)",
          overflow: "hidden",
          animation: `henrycoDrawerEntry ${FADE_MS}ms ${EASE_OUT}`,
        }}
      >
        <span
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage:
              "radial-gradient(120% 60% at 0% 0%, rgba(201, 162, 39, 0.06), transparent 60%)",
          }}
        />
        {children}
      </div>
    </div>
  );
}

interface PaletteBodyProps {
  query: string;
  onQuery: (next: string) => void;
  placeholderHint: string;
  scope: string | null;
  onScope: (next: string | null) => void;
  groups: PaletteGroup[];
  flat: PaletteRow[];
  highlight: number;
  setHighlight: (next: number) => void;
  listboxId: string;
  activeRowId: string;
  commitRow: (row: PaletteRow) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  loading: boolean;
  navigating: boolean;
  onClose: () => void;
  isMobile: boolean;
}

function PaletteBody({
  query,
  onQuery,
  placeholderHint,
  scope,
  onScope,
  groups,
  flat,
  highlight,
  setHighlight,
  listboxId,
  activeRowId,
  commitRow,
  inputRef,
  loading,
  navigating,
  onClose,
  isMobile,
}: PaletteBodyProps) {
  return (
    <div role="presentation" style={{ position: "relative" }}>
      <PaletteSearchInput
        query={query}
        onQuery={onQuery}
        placeholderHint={placeholderHint}
        listboxId={listboxId}
        activeRowId={activeRowId}
        inputRef={inputRef}
        loading={loading}
        onClose={onClose}
        isMobile={isMobile}
      />
      <PaletteScopeChips scope={scope} onScope={onScope} />
      <PaletteList
        groups={groups}
        flat={flat}
        highlight={highlight}
        setHighlight={setHighlight}
        listboxId={listboxId}
        commitRow={commitRow}
        loading={loading}
        navigating={navigating}
        query={query}
      />
      {!isMobile ? <PaletteFooter /> : null}
    </div>
  );
}

function PaletteSearchInput({
  query,
  onQuery,
  placeholderHint,
  listboxId,
  activeRowId,
  inputRef,
  loading,
  onClose,
  isMobile,
}: {
  query: string;
  onQuery: (next: string) => void;
  placeholderHint: string;
  listboxId: string;
  activeRowId: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  loading: boolean;
  onClose: () => void;
  isMobile: boolean;
}) {
  const containerStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.875rem 1rem",
    borderBottom: `1px solid var(${CSS_VARS.hairline})`,
    position: isMobile ? "sticky" : "static",
    top: 0,
    zIndex: 1,
    backgroundColor: `var(${CSS_VARS.surface})`,
  };
  return (
    <div style={containerStyle}>
      <SearchIcon size={16} aria-hidden style={{ color: `var(${CSS_VARS.inkSoft})` }} />
      <input
        ref={inputRef}
        type="search"
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholderHint}
        value={query}
        onChange={(event) => onQuery(event.target.value)}
        role="combobox"
        aria-expanded
        aria-controls={listboxId}
        aria-activedescendant={activeRowId || undefined}
        aria-label="Search HenryCo"
        style={{
          flex: 1,
          minWidth: 0,
          border: "none",
          outline: "none",
          background: "transparent",
          color: `var(${CSS_VARS.ink})`,
          ...typeStyle("body"),
        }}
      />
      {loading ? (
        <Loader2
          size={14}
          aria-hidden
          style={{
            color: `var(${CSS_VARS.inkSoft})`,
            animation: "henrycoSpin 1s linear infinite",
          }}
        />
      ) : null}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close palette"
        style={{
          border: "none",
          background: "transparent",
          padding: "0.35rem",
          cursor: "pointer",
          color: `var(${CSS_VARS.inkSoft})`,
          borderRadius: RADIUS.pill,
        }}
      >
        <X size={16} aria-hidden />
      </button>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes henrycoSpin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes henrycoSpin {
            from, to { transform: none; }
          }
        }
      `}</style>
    </div>
  );
}

function PaletteScopeChips({
  scope,
  onScope,
}: {
  scope: string | null;
  onScope: (next: string | null) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Search scope"
      style={{
        display: "flex",
        gap: "0.4rem",
        padding: "0.6rem 1rem",
        flexWrap: "wrap",
        borderBottom: `1px solid var(${CSS_VARS.hairline})`,
      }}
    >
      <ScopeChipButton
        active={!scope}
        onClick={() => onScope(null)}
        label="All"
      />
      {DIVISION_SCOPES.map((entry) => (
        <ScopeChipButton
          key={entry.key}
          active={scope === entry.key}
          onClick={() => onScope(scope === entry.key ? null : entry.key)}
          label={entry.label}
        />
      ))}
    </div>
  );
}

function ScopeChipButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "0.25rem 0.7rem",
        borderRadius: RADIUS.pill,
        border: active
          ? `1px solid var(${CSS_VARS.accentText})`
          : `1px solid var(${CSS_VARS.hairline})`,
        backgroundColor: active
          ? `var(${CSS_VARS.accentSoft})`
          : "transparent",
        color: active
          ? `var(${CSS_VARS.accentText})`
          : `var(${CSS_VARS.ink})`,
        cursor: "pointer",
        ...typeStyle("micro"),
        transition: "background 140ms ease, color 140ms ease, border-color 140ms ease",
      }}
    >
      {label}
    </button>
  );
}

function PaletteList({
  groups,
  flat,
  highlight,
  setHighlight,
  listboxId,
  commitRow,
  loading,
  navigating,
  query,
}: {
  groups: PaletteGroup[];
  flat: PaletteRow[];
  highlight: number;
  setHighlight: (next: number) => void;
  listboxId: string;
  commitRow: (row: PaletteRow) => void;
  loading: boolean;
  navigating: boolean;
  query: string;
}) {
  if (navigating) {
    return (
      <div
        style={{
          padding: "1.25rem 1rem",
          color: `var(${CSS_VARS.inkSoft})`,
          ...typeStyle("body"),
          display: "inline-flex",
          gap: "0.5rem",
          alignItems: "center",
        }}
      >
        <Sparkles size={14} aria-hidden />
        Opening that for you…
      </div>
    );
  }
  if (flat.length === 0) {
    if (loading) {
      return (
        <div
          style={{
            padding: "1.25rem 1rem",
            color: `var(${CSS_VARS.inkSoft})`,
            ...typeStyle("body"),
          }}
        >
          Searching across HenryCo…
        </div>
      );
    }
    return (
      <div style={{ padding: "1.25rem 1rem" }}>
        <EmptyState
          kicker={query.trim() ? "No matches" : "Start typing"}
          headline={
            query.trim()
              ? `No results for "${query.trim()}"`
              : "Search across orders, support, wallet, listings, and more."
          }
          body={
            query.trim()
              ? "Try a single keyword like “orders”, “withdraw”, or “support”."
              : "Press ? for keyboard shortcuts."
          }
        />
      </div>
    );
  }

  let runningIndex = 0;
  return (
    <ul
      id={listboxId}
      role="listbox"
      aria-label="Palette results"
      style={{
        listStyle: "none",
        padding: 0,
        margin: 0,
        maxHeight: "60vh",
        overflowY: "auto",
        overscrollBehavior: "contain",
      }}
    >
      {groups.map((group) => (
        <li role="presentation" key={group.key} style={{ listStyle: "none" }}>
          <div
            aria-hidden
            style={{
              padding: "0.625rem 1rem 0.25rem",
              ...typeStyle("kicker"),
              color: `var(${CSS_VARS.inkMuted})`,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span>{group.label}</span>
            <span
              aria-hidden
              style={{
                ...typeStyle("micro"),
                color: `var(${CSS_VARS.inkMuted})`,
                opacity: 0.65,
              }}
            >
              {group.rows.length}
            </span>
          </div>
          <ul
            role="presentation"
            style={{ listStyle: "none", padding: 0, margin: 0 }}
          >
            {group.rows.map((row) => {
              const index = runningIndex;
              runningIndex += 1;
              return (
                <PaletteResultRow
                  key={row.key}
                  row={row}
                  active={highlight === index}
                  rowId={`${listboxId}-row-${index}`}
                  matchQuery={query}
                  onSelect={() => commitRow(row)}
                  onPointerEnter={() => setHighlight(index)}
                />
              );
            })}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function PaletteFooter() {
  return (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        padding: "0.625rem 1rem",
        borderTop: `1px solid var(${CSS_VARS.hairline})`,
        ...typeStyle("micro"),
        color: `var(${CSS_VARS.inkMuted})`,
        backgroundColor: `var(${CSS_VARS.surface})`,
      }}
    >
      <FooterChord keys={["↑", "↓"]} label="move" />
      <FooterChord keys={["↵"]} label="open" />
      <FooterChord keys={["Tab"]} label="cycle group" />
      <span style={{ marginLeft: "auto" }}>
        <FooterChord keys={["?"]} label="shortcuts" />
      </span>
    </div>
  );
}

function FooterChord({ keys, label }: { keys: string[]; label: string }) {
  return (
    <span style={{ display: "inline-flex", gap: "0.35rem", alignItems: "center" }}>
      <span aria-hidden style={{ display: "inline-flex", gap: 2 }}>
        {keys.map((k, i) => (
          <kbd
            key={`${label}-kbd-${i}`}
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              padding: "0 0.35rem",
              border: `1px solid var(${CSS_VARS.hairline})`,
              borderRadius: 4,
              fontSize: "0.65rem",
              color: `var(${CSS_VARS.inkSoft})`,
            }}
          >
            {k}
          </kbd>
        ))}
      </span>
      <span>{label}</span>
    </span>
  );
}

/**
 * Move the highlight to the first row of the next (or previous) group.
 * Wraps at the ends so Tab from the last group returns to the first.
 */
function jumpToNeighbouringGroup(
  groups: PaletteGroup[],
  flat: PaletteRow[],
  current: number,
  forward: boolean,
): number {
  if (groups.length <= 1 || flat.length === 0) return current;
  // Compute the running index where each group starts.
  const starts: number[] = [];
  let acc = 0;
  for (const g of groups) {
    starts.push(acc);
    acc += g.rows.length;
  }
  // Find which group `current` belongs to.
  let groupIndex = 0;
  for (let i = 0; i < starts.length; i += 1) {
    if (current >= starts[i]!) groupIndex = i;
  }
  const nextGroupIndex = forward
    ? (groupIndex + 1) % groups.length
    : (groupIndex - 1 + groups.length) % groups.length;
  return starts[nextGroupIndex] ?? 0;
}

let idCounter = 0;
function useStableId(prefix: string): string {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const ref = useRef<string | null>(null);
  if (!ref.current) {
    idCounter += 1;
    ref.current = `${prefix}-${idCounter}`;
  }
  return ref.current;
}
