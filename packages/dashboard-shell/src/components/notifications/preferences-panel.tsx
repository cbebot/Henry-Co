"use client";

import { useCallback, useState } from "react";
import { useNotificationPreferences } from "../../shell/realtime-hooks";
import type { RealtimePreferences } from "../../shell/realtime-types";
import { CSS_VARS } from "../../tokens/color";
import { RADIUS } from "../../tokens/spacing";
import { typeStyle } from "../../tokens/type";
import { focusVisibleStyle } from "../../tokens/focus";

/**
 * PreferencesPanel — muted divisions / muted event types / email
 * fallback / master toast switch / high-priority-only / sound /
 * vibration toggles.
 *
 * Reads + persists via the existing customer endpoint. Does NOT touch
 * the email-fallback cron schedule (master scope boundary).
 */
export type PreferencesPanelProps = {
  endpoint?: string;
  divisions?: ReadonlyArray<{ key: string; label: string }>;
  t?: (key: string) => string;
};

const DEFAULT_ENDPOINT = "/api/notifications/preferences";

const DEFAULT_DIVISIONS: ReadonlyArray<{ key: string; label: string }> = [
  { key: "care", label: "Care" },
  { key: "marketplace", label: "Marketplace" },
  { key: "studio", label: "Studio" },
  { key: "jobs", label: "Jobs" },
  { key: "learn", label: "Learn" },
  { key: "property", label: "Property" },
  { key: "logistics", label: "Logistics" },
  { key: "account", label: "Account" },
  { key: "security", label: "Security" },
];

export function PreferencesPanel({
  endpoint = DEFAULT_ENDPOINT,
  divisions = DEFAULT_DIVISIONS,
  t = (s) => s,
}: PreferencesPanelProps) {
  const tt = (key: string) => (typeof t === "function" ? t(key) : key);
  const { preferences, apply } = useNotificationPreferences();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persist = useCallback(
    async (patch: Partial<RealtimePreferences>) => {
      setPending(true);
      setError(null);
      apply(patch);
      try {
        const body: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(patch)) {
          if (v === undefined) continue;
          body[k] = v;
        }
        const res = await fetch(endpoint, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          credentials: "same-origin",
        });
        if (!res.ok) {
          setError(tt("Could not save preference."));
        }
      } catch {
        setError(tt("Could not save preference."));
      } finally {
        setPending(false);
      }
    },
    [apply, endpoint, tt],
  );

  const toggleDivision = useCallback(
    (key: string) => {
      const current = new Set(preferences.muted_divisions.map((d) => d.toLowerCase()));
      if (current.has(key.toLowerCase())) current.delete(key.toLowerCase());
      else current.add(key.toLowerCase());
      void persist({ muted_divisions: Array.from(current) });
    },
    [preferences.muted_divisions, persist],
  );

  const isMuted = (key: string) =>
    preferences.muted_divisions.some((d) => d.toLowerCase() === key.toLowerCase());

  return (
    <section
      aria-labelledby="prefs-heading"
      style={{
        padding: "1rem",
        borderRadius: RADIUS.lg,
        border: `1px solid var(${CSS_VARS.hairline})`,
        backgroundColor: `var(${CSS_VARS.surfaceElevated})`,
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <div>
        <h3
          id="prefs-heading"
          style={{
            ...typeStyle("kicker"),
            margin: 0,
            color: `var(${CSS_VARS.inkSoft})`,
          }}
        >
          {tt("Preferences")}
        </h3>
        <p
          style={{
            ...typeStyle("body"),
            color: `var(${CSS_VARS.ink})`,
            margin: "0.4rem 0 0",
          }}
        >
          {tt("Tune what reaches you, where, and when.")}
        </p>
      </div>

      <Toggle
        label={tt("In-app toasts")}
        description={tt("Show new activity as a transient toast.")}
        checked={preferences.in_app_toast_enabled}
        onChange={(v) => persist({ in_app_toast_enabled: v })}
        disabled={pending}
      />
      <Toggle
        label={tt("High-priority only")}
        description={tt("Quiet everything except urgent and security signals.")}
        checked={preferences.high_priority_only}
        onChange={(v) => persist({ high_priority_only: v })}
        disabled={pending}
      />
      <Toggle
        label={tt("Sound")}
        checked={preferences.notification_sound_enabled}
        onChange={(v) => persist({ notification_sound_enabled: v })}
        disabled={pending}
      />
      <Toggle
        label={tt("Vibration (mobile)")}
        checked={preferences.notification_vibration_enabled}
        onChange={(v) => persist({ notification_vibration_enabled: v })}
        disabled={pending}
      />
      <Toggle
        label={tt("Email fallback")}
        description={tt(
          "If you miss an in-app signal, we email you after a delay you choose.",
        )}
        checked={preferences.email_fallback_enabled}
        onChange={(v) => persist({ email_fallback_enabled: v })}
        disabled={pending}
      />

      <div>
        <p
          style={{
            ...typeStyle("kicker"),
            color: `var(${CSS_VARS.inkSoft})`,
            margin: "0 0 0.5rem",
          }}
        >
          {tt("Muted divisions")}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {divisions.map((d) => (
            <button
              key={d.key}
              type="button"
              role="switch"
              aria-checked={!isMuted(d.key)}
              onClick={() => toggleDivision(d.key)}
              disabled={pending}
              style={{
                padding: "0.35rem 0.85rem",
                fontSize: "0.7rem",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                borderRadius: "9999px",
                border: "none",
                backgroundColor: isMuted(d.key)
                  ? `var(${CSS_VARS.surface})`
                  : `var(${CSS_VARS.accentSoft})`,
                color: isMuted(d.key)
                  ? `var(${CSS_VARS.inkSoft})`
                  : `var(${CSS_VARS.accentText})`,
                cursor: "pointer",
                ...focusVisibleStyle(),
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          style={{
            ...typeStyle("small"),
            color: `var(${CSS_VARS.ink})`,
            margin: 0,
          }}
        >
          {error}
        </p>
      ) : null}
    </section>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "0.75rem",
        cursor: disabled ? "default" : "pointer",
      }}
    >
      <div style={{ flex: 1 }}>
        <p style={{ ...typeStyle("body"), margin: 0, color: `var(${CSS_VARS.ink})` }}>
          {label}
        </p>
        {description ? (
          <p
            style={{
              ...typeStyle("small"),
              color: `var(${CSS_VARS.inkSoft})`,
              margin: "0.2rem 0 0",
            }}
          >
            {description}
          </p>
        ) : null}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        style={{ marginTop: "0.25rem", cursor: disabled ? "default" : "pointer" }}
      />
    </label>
  );
}
