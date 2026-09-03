"use client";

import { useCallback, useState } from "react";
import { Moon } from "lucide-react";
import { useNotificationPreferences } from "../../shell/realtime-hooks";
import { CSS_VARS } from "../../tokens/color";
import { RADIUS } from "../../tokens/spacing";
import { typeStyle } from "../../tokens/type";
import { focusVisibleStyle } from "../../tokens/focus";

/**
 * QuietHoursPanel — readout + edit form for the customer's quiet hours.
 *
 * Reads from the realtime spine's `preferences` and writes via the
 * existing `/api/notifications/preferences` PATCH endpoint (V2-NOT-01-C).
 * Workspace apps may override the URL.
 */
export type QuietHoursPanelProps = {
  endpoint?: string;
  t?: (key: string) => string;
};

const DEFAULT_ENDPOINT = "/api/notifications/preferences";

export function QuietHoursPanel({
  endpoint = DEFAULT_ENDPOINT,
  t = (s) => s,
}: QuietHoursPanelProps) {
  const tt = (key: string) => (typeof t === "function" ? t(key) : key);
  const { preferences, apply } = useNotificationPreferences();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Optimistic + non-blocking (see PreferencesPanel): the form never globally
  // disables itself while a save is in flight, and a failed/timed-out save
  // rolls the value back instead of leaving the controls frozen.
  const persist = useCallback(
    async (
      patch: Partial<typeof preferences>,
      rollback: Partial<typeof preferences>,
    ) => {
      setError(null);
      apply(patch);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const body: Record<string, unknown> = {};
        if ("quiet_hours_enabled" in patch) body.quiet_hours_enabled = patch.quiet_hours_enabled;
        if ("quiet_hours_start" in patch && patch.quiet_hours_start)
          body.quiet_hours_start = patch.quiet_hours_start;
        if ("quiet_hours_end" in patch && patch.quiet_hours_end)
          body.quiet_hours_end = patch.quiet_hours_end;
        if ("quiet_hours_timezone" in patch)
          body.quiet_hours_timezone = patch.quiet_hours_timezone;
        const res = await fetch(endpoint, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          credentials: "same-origin",
          signal: controller.signal,
        });
        if (!res.ok) {
          apply(rollback);
          setError(tt("Could not save preference."));
          return;
        }
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1200);
      } catch {
        apply(rollback);
        setError(tt("Could not save preference."));
      } finally {
        clearTimeout(timer);
      }
    },
    [apply, endpoint, tt],
  );

  return (
    <section
      aria-labelledby="quiet-hours-heading"
      style={{
        padding: "1rem",
        borderRadius: RADIUS.lg,
        border: `1px solid var(${CSS_VARS.hairline})`,
        backgroundColor: `var(${CSS_VARS.surfaceElevated})`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Moon size={14} aria-hidden style={{ color: `var(${CSS_VARS.inkSoft})` }} />
        <h3
          id="quiet-hours-heading"
          style={{
            ...typeStyle("kicker"),
            margin: 0,
            color: `var(${CSS_VARS.inkSoft})`,
          }}
        >
          {tt("Quiet hours")}
        </h3>
      </div>

      <p
        style={{
          ...typeStyle("body"),
          color: `var(${CSS_VARS.ink})`,
          margin: "0.5rem 0 0",
        }}
      >
        {preferences.quiet_hours_enabled
          ? `${tt("In quiet hours")} ${preferences.quiet_hours_start} – ${preferences.quiet_hours_end}`
          : tt("Notifications arrive at any time")}
      </p>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "0.85rem",
          gap: "0.75rem",
          ...focusVisibleStyle(),
        }}
      >
        <span style={{ ...typeStyle("body"), color: `var(${CSS_VARS.ink})` }}>
          {tt("Enable quiet hours")}
        </span>
        <input
          type="checkbox"
          checked={preferences.quiet_hours_enabled}
          onChange={(e) =>
            persist(
              { quiet_hours_enabled: e.target.checked },
              { quiet_hours_enabled: preferences.quiet_hours_enabled },
            )
          }
          style={{ cursor: "pointer" }}
        />
      </label>

      {preferences.quiet_hours_enabled ? (
        <div
          style={{
            marginTop: "0.85rem",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.5rem",
          }}
        >
          <TimeField
            label={tt("Start")}
            value={preferences.quiet_hours_start}
            onChange={(v) =>
              persist(
                { quiet_hours_start: v },
                { quiet_hours_start: preferences.quiet_hours_start },
              )
            }
          />
          <TimeField
            label={tt("End")}
            value={preferences.quiet_hours_end}
            onChange={(v) =>
              persist(
                { quiet_hours_end: v },
                { quiet_hours_end: preferences.quiet_hours_end },
              )
            }
          />
        </div>
      ) : null}

      {error ? (
        <p
          role="alert"
          style={{
            ...typeStyle("small"),
            color: `var(${CSS_VARS.ink})`,
            margin: "0.5rem 0 0",
          }}
        >
          {error}
        </p>
      ) : null}
      {saved && !error ? (
        <p
          aria-live="polite"
          style={{
            ...typeStyle("small"),
            color: `var(${CSS_VARS.accentText})`,
            margin: "0.5rem 0 0",
          }}
        >
          {tt("Saved")}
        </p>
      ) : null}
    </section>
  );
}

function TimeField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      <span
        style={{
          ...typeStyle("kicker"),
          color: `var(${CSS_VARS.inkSoft})`,
          fontSize: "0.6rem",
        }}
      >
        {label}
      </span>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          padding: "0.45rem 0.65rem",
          borderRadius: RADIUS.md,
          border: `1px solid var(${CSS_VARS.hairline})`,
          background: `var(${CSS_VARS.surface})`,
          color: `var(${CSS_VARS.ink})`,
          ...typeStyle("body"),
          ...focusVisibleStyle(),
        }}
      />
    </label>
  );
}
