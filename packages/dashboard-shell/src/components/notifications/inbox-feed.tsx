"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ACCOUNT_NOTIFICATION_TOKENS,
  type SeverityTokens,
} from "@henryco/notifications-ui/tokens";
import { isSafeNotificationDeepLink } from "@henryco/notifications-ui/deep-link";

import {
  useNotificationSignal,
  useRealtime,
} from "../../shell/realtime-hooks";
import type {
  RealtimeSignal,
  SignalAudience,
} from "../../shell/realtime-types";
import { CSS_VARS } from "../../tokens/color";
import { RADIUS } from "../../tokens/spacing";
import { typeStyle } from "../../tokens/type";
import { focusVisibleStyle } from "../../tokens/focus";
import { NotificationCard } from "./notification-card";

/**
 * InboxFeed — the live inbox surface for the ContextDrawer (and
 * standalone routes that want to embed the same list).
 *
 * Filterable by audience + division + read state. Reads the live
 * realtime spine; never owns its own subscription (anti-pattern #9).
 */
export type InboxFeedProps = {
  audience?: SignalAudience;
  tokens?: SeverityTokens;
  defaultMode?: "all" | "unread";
  actionEndpoint?: (id: string, action: "read" | "unread" | "archive" | "delete") => string;
  t?: (key: string) => string;
};

const DEFAULT_ENDPOINT = (id: string, action: "read" | "unread" | "archive" | "delete") =>
  action === "delete"
    ? `/api/notifications/${encodeURIComponent(id)}`
    : `/api/notifications/${encodeURIComponent(id)}/${action}`;

export function InboxFeed({
  audience = "customer",
  tokens = ACCOUNT_NOTIFICATION_TOKENS,
  defaultMode = "all",
  actionEndpoint = DEFAULT_ENDPOINT,
  t = (s) => s,
}: InboxFeedProps) {
  const tt = (key: string) => (typeof t === "function" ? t(key) : key);
  const [mode, setMode] = useState<"all" | "unread">(defaultMode);
  const [divisionFilter, setDivisionFilter] = useState<string>("all");
  const { signals, loading, error } = useNotificationSignal({
    audience,
    visibleOnly: true,
    unreadOnly: mode === "unread",
  });
  const { markReadLocally, refresh } = useRealtime();

  const divisions = useMemo(() => {
    const set = new Map<string, string>();
    for (const s of signals) {
      const key = String(s.division || "").toLowerCase() || "general";
      const label = s.source?.label || s.division || "General";
      if (!set.has(key)) set.set(key, label);
    }
    return Array.from(set.entries()).map(([key, label]) => ({ key, label }));
  }, [signals]);

  const filtered = useMemo(() => {
    if (divisionFilter === "all") return signals;
    return signals.filter(
      (s) => String(s.division || "").toLowerCase() === divisionFilter.toLowerCase(),
    );
  }, [signals, divisionFilter]);

  const performAction = useCallback(
    async (signal: RealtimeSignal, action: "read" | "unread" | "archive" | "delete") => {
      if (action === "read") markReadLocally(signal.id);
      const url = actionEndpoint(signal.id, action);
      const method = action === "delete" ? "DELETE" : "POST";
      try {
        await fetch(url, { method, credentials: "same-origin" });
      } finally {
        await refresh();
      }
    },
    [actionEndpoint, markReadLocally, refresh],
  );

  const handleActivate = useCallback(
    (signal: RealtimeSignal) => {
      const dest = signal.action_url || signal.message_href || "/notifications";
      const safe = isSafeNotificationDeepLink(dest) ? dest : "/notifications";
      if (!signal.is_read) {
        markReadLocally(signal.id);
        fetch(actionEndpoint(signal.id, "read"), { method: "POST" }).catch(() => undefined);
      }
      if (typeof window !== "undefined") {
        if (/^https?:\/\//i.test(safe)) window.location.assign(safe);
        else window.location.href = safe;
      }
    },
    [markReadLocally, actionEndpoint],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <FilterBar
        mode={mode}
        setMode={setMode}
        divisions={divisions}
        divisionFilter={divisionFilter}
        setDivisionFilter={setDivisionFilter}
        t={tt}
      />

      {error ? (
        <div
          role="alert"
          style={{
            padding: "0.85rem 1rem",
            borderRadius: RADIUS.md,
            border: `1px solid var(${CSS_VARS.hairline})`,
            backgroundColor: `var(${CSS_VARS.surfaceElevated})`,
            color: `var(${CSS_VARS.ink})`,
          }}
        >
          <p style={{ ...typeStyle("bodyStrong"), margin: 0 }}>{tt("Activity unavailable")}</p>
          <p
            style={{
              ...typeStyle("small"),
              color: `var(${CSS_VARS.inkSoft})`,
              margin: "0.25rem 0 0",
            }}
          >
            {error}
          </p>
          <button
            type="button"
            onClick={() => void refresh()}
            style={{
              marginTop: "0.5rem",
              padding: "0.4rem 0.75rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: `var(${CSS_VARS.accentText})`,
              background: `var(${CSS_VARS.accentSoft})`,
              border: "none",
              borderRadius: RADIUS.pill,
              cursor: "pointer",
              ...focusVisibleStyle(),
            }}
          >
            {tt("Try again")}
          </button>
        </div>
      ) : loading && filtered.length === 0 ? (
        <InboxLoading />
      ) : filtered.length === 0 ? (
        <InboxEmptyState mode={mode} t={tt} />
      ) : (
        <div>
          {filtered.map((signal) => (
            <NotificationCard
              key={signal.id}
              signal={signal}
              tokens={tokens}
              onActivate={() => handleActivate(signal)}
              onAction={(action) => performAction(signal, action)}
              t={tt}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type FilterBarProps = {
  mode: "all" | "unread";
  setMode: (m: "all" | "unread") => void;
  divisions: Array<{ key: string; label: string }>;
  divisionFilter: string;
  setDivisionFilter: (k: string) => void;
  t: (key: string) => string;
};

function FilterBar({
  mode,
  setMode,
  divisions,
  divisionFilter,
  setDivisionFilter,
  t,
}: FilterBarProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        padding: "0.75rem",
        borderRadius: RADIUS.lg,
        border: `1px solid var(${CSS_VARS.hairline})`,
        backgroundColor: `var(${CSS_VARS.surfaceElevated})`,
      }}
    >
      <div role="tablist" aria-label={t("Read state")} style={{ display: "flex", gap: "0.4rem" }}>
        <FilterChip
          active={mode === "all"}
          onClick={() => setMode("all")}
          label={t("All")}
        />
        <FilterChip
          active={mode === "unread"}
          onClick={() => setMode("unread")}
          label={t("Unread")}
        />
      </div>

      <div
        role="tablist"
        aria-label={t("Source")}
        style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}
      >
        <FilterChip
          active={divisionFilter === "all"}
          onClick={() => setDivisionFilter("all")}
          label={t("All sources")}
        />
        {divisions.map((d) => (
          <FilterChip
            key={d.key}
            active={divisionFilter === d.key}
            onClick={() => setDivisionFilter(d.key)}
            label={d.label}
          />
        ))}
      </div>
    </div>
  );
}

function FilterChip({
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
        padding: "0.35rem 0.85rem",
        fontSize: "0.7rem",
        fontWeight: 600,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        borderRadius: "9999px",
        border: "none",
        backgroundColor: active
          ? `var(${CSS_VARS.accentSoft})`
          : `var(${CSS_VARS.surface})`,
        color: active
          ? `var(${CSS_VARS.accentText})`
          : `var(${CSS_VARS.inkSoft})`,
        cursor: "pointer",
        ...focusVisibleStyle(),
      }}
    >
      {label}
    </button>
  );
}

function InboxLoading() {
  return (
    <div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          aria-hidden
          style={{
            display: "flex",
            gap: "0.5rem",
            padding: "0.7rem",
            borderRadius: RADIUS.lg,
            backgroundColor: `var(${CSS_VARS.surfaceElevated})`,
            opacity: 0.5,
            marginBottom: "0.4rem",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: RADIUS.md,
              backgroundColor: `var(${CSS_VARS.hairline})`,
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                height: 10,
                width: "60%",
                borderRadius: 4,
                backgroundColor: `var(${CSS_VARS.hairline})`,
              }}
            />
            <div
              style={{
                marginTop: 6,
                height: 8,
                width: "90%",
                borderRadius: 4,
                backgroundColor: `var(${CSS_VARS.hairline})`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function InboxEmptyState({
  mode,
  t,
}: {
  mode: "all" | "unread";
  t: (key: string) => string;
}) {
  return (
    <div
      style={{
        padding: "3rem 1.25rem",
        textAlign: "center",
        borderRadius: RADIUS.lg,
        border: `1px dashed var(${CSS_VARS.hairline})`,
        backgroundColor: `var(${CSS_VARS.surface})`,
      }}
    >
      <p
        style={{
          ...typeStyle("kicker"),
          margin: 0,
          color: `var(${CSS_VARS.inkSoft})`,
        }}
      >
        {t("Inbox")}
      </p>
      <p
        style={{
          ...typeStyle("title"),
          color: `var(${CSS_VARS.ink})`,
          margin: "0.5rem 0 0",
        }}
      >
        {mode === "unread"
          ? t("Nothing waiting on you")
          : t("All quiet")}
      </p>
      <p
        style={{
          ...typeStyle("body"),
          color: `var(${CSS_VARS.inkSoft})`,
          margin: "0.5rem 0 0",
        }}
      >
        {t("When something needs you, it lands here.")}
      </p>
    </div>
  );
}
