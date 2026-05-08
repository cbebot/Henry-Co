"use client";

/**
 * PaletteResultRow — one row in the palette listbox.
 *
 * Lifts visual styling out of the dialog/sheet so desktop and mobile
 * share the same row component (anti-pattern #21 — desktop and mobile
 * differ at the SURFACE layer, not at the row layer).
 *
 * Active row uses `--hc-accent-soft` background — gold, never blue
 * (anti-pattern #15). Icon set is lucide; no emoji literals
 * (anti-pattern #13).
 *
 * Premium signals:
 *   - Soft gold left bar on active (matches signal-feed accent).
 *   - Hover scale-tap micro-interaction (200 ms ease-out, GPU-accel).
 *   - Trailing keyboard hint (kbd elements).
 *   - Trailing meta chip with division/priority context.
 *   - High-contrast match highlight (the typed substring is bolded
 *     within the label).
 */

import {
  ArrowUpRight,
  Clock,
  Command,
  Compass,
  Lightbulb,
  Search as SearchIcon,
} from "lucide-react";
import type { CSSProperties } from "react";
import { CSS_VARS, RADIUS, focusVisibleStyle, typeStyle } from "@henryco/dashboard-shell/tokens";

import type { PaletteRow, PaletteRowKind } from "./types";

export interface PaletteResultRowProps {
  row: PaletteRow;
  active: boolean;
  /** aria-activedescendant target — must match listbox parent's value. */
  rowId: string;
  /** The current trimmed lowercased query — drives match highlighting. */
  matchQuery?: string;
  onSelect: () => void;
  onPointerEnter: () => void;
}

function kindIcon(kind: PaletteRowKind) {
  switch (kind) {
    case "command":
      return <Command size={14} aria-hidden />;
    case "search":
      return <SearchIcon size={14} aria-hidden />;
    case "recent":
      return <Clock size={14} aria-hidden />;
    case "suggestion":
      return <Lightbulb size={14} aria-hidden />;
    default:
      return <Compass size={14} aria-hidden />;
  }
}

export function PaletteResultRow({
  row,
  active,
  rowId,
  matchQuery,
  onSelect,
  onPointerEnter,
}: PaletteResultRowProps) {
  const rowStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1.5rem 1fr auto",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.625rem 1rem 0.625rem 0.875rem",
    width: "100%",
    textAlign: "left",
    background: active ? `var(${CSS_VARS.accentSoft})` : "transparent",
    borderLeft: active
      ? `2px solid var(${CSS_VARS.accentText})`
      : "2px solid transparent",
    border: "none",
    borderTop: 0,
    borderRight: 0,
    borderBottom: 0,
    cursor: "pointer",
    color: `var(${CSS_VARS.ink})`,
    borderRadius: 0,
    // Hold both states at scale 1 — the original 0.998 inactive state
    // produced subtle layout jitter on every Up/Down keystroke. The
    // active affordance is now carried entirely by the gold left bar
    // and accent-soft background. translateZ(0) stays so the row gets
    // its own GPU layer and the background-fade animates cleanly.
    transition: "background 140ms cubic-bezier(0.16, 1, 0.3, 1)",
    transform: "translateZ(0)",
    ...(active ? {} : focusVisibleStyle()),
  };

  return (
    <li role="presentation" style={{ listStyle: "none" }}>
      <button
        type="button"
        role="option"
        id={rowId}
        aria-selected={active}
        onPointerEnter={onPointerEnter}
        onMouseDown={(event) => event.preventDefault() /* keep input focused */}
        onClick={onSelect}
        style={rowStyle}
      >
        <span
          aria-hidden
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: active ? `var(${CSS_VARS.accentText})` : `var(${CSS_VARS.inkSoft})`,
            transition: "color 140ms ease",
          }}
        >
          {kindIcon(row.kind)}
        </span>
        <span style={{ minWidth: 0 }}>
          <span
            style={{
              ...typeStyle("bodyStrong"),
              color: `var(${CSS_VARS.ink})`,
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <HighlightedText text={row.label} match={matchQuery} />
          </span>
          {(row.kicker || row.detail) && (
            <span
              style={{
                ...typeStyle("small"),
                color: `var(${CSS_VARS.inkSoft})`,
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginTop: "0.125rem",
              }}
            >
              {row.kicker ? row.kicker : null}
              {row.kicker && row.detail ? " · " : null}
              {row.detail ? row.detail : null}
            </span>
          )}
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            color: `var(${CSS_VARS.inkMuted})`,
            ...typeStyle("micro"),
          }}
        >
          {row.shortcut?.length ? (
            <span
              aria-hidden
              style={{
                display: "inline-flex",
                gap: 2,
              }}
            >
              {row.shortcut.map((key, index) => (
                <kbd
                  key={`${row.key}-kbd-${index}`}
                  style={{
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    padding: "0.05rem 0.35rem",
                    border: `1px solid var(${CSS_VARS.hairline})`,
                    borderRadius: RADIUS.sm,
                    fontSize: "0.65rem",
                    color: `var(${CSS_VARS.inkSoft})`,
                  }}
                >
                  {key}
                </kbd>
              ))}
            </span>
          ) : null}
          {row.meta ? (
            <span
              style={{
                padding: "0.05rem 0.45rem",
                borderRadius: RADIUS.pill,
                border: `1px solid var(${CSS_VARS.hairline})`,
                color: active ? `var(${CSS_VARS.accentText})` : `var(${CSS_VARS.inkMuted})`,
                borderColor: active ? `var(${CSS_VARS.accentText})` : `var(${CSS_VARS.hairline})`,
                whiteSpace: "nowrap",
              }}
            >
              {row.meta}
            </span>
          ) : null}
          <ArrowUpRight
            size={12}
            aria-hidden
            style={{
              opacity: active ? 0.85 : 0.5,
              color: active ? `var(${CSS_VARS.accentText})` : "inherit",
              transition: "opacity 140ms ease",
            }}
          />
        </span>
      </button>
    </li>
  );
}

/**
 * Light-touch substring highlighter. Bolds the FIRST occurrence of
 * the typed query inside the label so the user sees exactly what
 * matched. Skips highlighting when the query is empty or has no
 * substring overlap.
 */
function HighlightedText({ text, match }: { text: string; match?: string }) {
  if (!match || !match.trim()) return <>{text}</>;
  const lower = text.toLowerCase();
  const lowerMatch = match.trim().toLowerCase();
  const idx = lower.indexOf(lowerMatch);
  if (idx === -1) return <>{text}</>;
  const before = text.slice(0, idx);
  const hit = text.slice(idx, idx + lowerMatch.length);
  const after = text.slice(idx + lowerMatch.length);
  return (
    <>
      {before}
      <span
        style={{
          backgroundColor: `var(${CSS_VARS.accentSoft})`,
          color: `var(${CSS_VARS.accentText})`,
          padding: "0 0.15em",
          borderRadius: 3,
          fontWeight: 700,
        }}
      >
        {hit}
      </span>
      {after}
    </>
  );
}
