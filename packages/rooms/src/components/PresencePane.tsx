"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Hand, Mic, MicOff } from "lucide-react";
import { Chip, EmptyState, Panel } from "@henryco/dashboard-shell/components";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";

import { useRoomsRealtime } from "../realtime/rooms-realtime";
import type { ParticipantRole, RoomParticipant } from "../types";

/**
 * PresencePane — live participant list.
 *
 * Reads from the rooms realtime context (no per-widget subscription).
 * Renders one row per active participant (left_at IS NULL) plus an
 * accessible live region that announces join/leave to screen readers
 * (closes audit V7's "live region for join/leave" requirement).
 *
 * Role chips:
 *   - host / operator → accent (gold)
 *   - interviewer → accent
 *   - candidate → neutral
 *   - customer → neutral
 *   - observer → outline
 */
export type PresencePaneProps = {
  /** Render a custom action per participant row (e.g. "Mute" for the host). */
  renderRowAction?: (participant: RoomParticipant) => ReactNode;
  /**
   * Resolver from userId → display name. The hook deliberately doesn't
   * fetch profile data (that's the consumer's call) — pass the map you
   * already have in scope.
   */
  resolveDisplayName?: (userId: string) => string | null;
  /**
   * Resolver from userId → muted boolean. Provider drivers expose mute
   * state via their own SDK; this prop lets the consumer pass through.
   */
  resolveMuted?: (userId: string) => boolean;
};

const ROLE_TONE: Record<ParticipantRole, "accent" | "neutral" | "outline"> = {
  host: "accent",
  operator: "accent",
  interviewer: "accent",
  candidate: "neutral",
  customer: "neutral",
  observer: "outline",
};

const ROLE_LABEL: Record<ParticipantRole, string> = {
  host: "Host",
  operator: "Operator",
  interviewer: "Interviewer",
  candidate: "Candidate",
  customer: "Guest",
  observer: "Observer",
};

export function PresencePane({
  renderRowAction,
  resolveDisplayName,
  resolveMuted,
}: PresencePaneProps) {
  const { participants } = useRoomsRealtime();
  const active = participants.filter((p) => p.leftAt === null);

  // Live-region announcement for join/leave. Tracks the diff against
  // the previous render and writes "joined" / "left" strings to an
  // aria-live="polite" node that screen readers pick up.
  const previousIdsRef = useRef<ReadonlySet<string>>(new Set());
  const liveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentIds = new Set(active.map((p) => p.id));
    const prevIds = previousIdsRef.current;
    const joined: RoomParticipant[] = [];
    const left: string[] = [];
    for (const p of active) {
      if (!prevIds.has(p.id)) joined.push(p);
    }
    for (const id of prevIds) {
      if (!currentIds.has(id)) left.push(id);
    }
    if (liveRef.current && (joined.length > 0 || left.length > 0)) {
      const parts: string[] = [];
      for (const p of joined) {
        const name = resolveDisplayName?.(p.userId) ?? "A participant";
        parts.push(`${name} joined.`);
      }
      for (const _ of left) {
        parts.push("A participant left.");
      }
      liveRef.current.textContent = parts.join(" ");
    }
    previousIdsRef.current = currentIds;
  }, [active, resolveDisplayName]);

  if (active.length === 0) {
    return (
      <Panel tone="flat" padding="md">
        <EmptyState
          kicker="Live room"
          headline="Waiting for participants"
          body="Once someone joins, you'll see them here."
          align="start"
        />
        <div
          ref={liveRef}
          aria-live="polite"
          aria-atomic="true"
          style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0 }}
        />
      </Panel>
    );
  }

  return (
    <Panel tone="flat" padding="md">
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
        aria-label={`${active.length} active participants`}
      >
        {active.map((p) => {
          const displayName =
            resolveDisplayName?.(p.userId) ?? "Participant";
          const muted = resolveMuted?.(p.userId) ?? false;
          return (
            <li
              key={p.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.75rem",
                backgroundColor: `var(${CSS_VARS.surfaceElevated})`,
                border: `1px solid var(${CSS_VARS.hairline})`,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "9999px",
                  backgroundColor: `var(${CSS_VARS.accentSoft})`,
                  color: `var(${CSS_VARS.accentText})`,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {displayName
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((s) => s[0]?.toUpperCase() ?? "")
                  .join("")}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.95rem",
                    fontWeight: 500,
                    color: `var(${CSS_VARS.ink})`,
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                  }}
                >
                  {displayName}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.15rem" }}>
                  <Chip tone={ROLE_TONE[p.role]}>{ROLE_LABEL[p.role]}</Chip>
                  {p.handRaised ? (
                    <Chip tone="warning" leading={<Hand size={11} aria-hidden />}>
                      Hand raised
                    </Chip>
                  ) : null}
                </div>
              </div>
              <span aria-label={muted ? "Muted" : "Microphone on"} style={{ color: `var(${CSS_VARS.inkMuted})` }}>
                {muted ? <MicOff size={16} /> : <Mic size={16} />}
              </span>
              {renderRowAction ? <div>{renderRowAction(p)}</div> : null}
            </li>
          );
        })}
      </ul>
      <div
        ref={liveRef}
        aria-live="polite"
        aria-atomic="true"
        style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0 }}
      />
    </Panel>
  );
}
