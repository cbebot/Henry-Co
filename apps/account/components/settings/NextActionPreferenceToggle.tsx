"use client";

import { useState } from "react";
import { Compass } from "lucide-react";
import { getNextActionCopy } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";

/**
 * V3-39 — the "do this next" suggestion control (E-D2: legitimate-interest
 * default-ON with user control). Persists through the account preferences
 * route's ALLOWED_FIELDS allowlist (customer_preferences.
 * next_action_prompts_enabled — never a new prefs table). Optimistic with
 * rollback on a failed save; the server resolver honors a persisted FALSE
 * before anything renders. Mounted only while the personalization_next_action
 * flag is live (the page gates it), so the toggle is never a dead control.
 */
export default function NextActionPreferenceToggle({
  initialEnabled,
}: {
  initialEnabled: boolean;
}) {
  const locale = useHenryCoLocale();
  const copy = getNextActionCopy(locale);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);

  async function persist(value: boolean) {
    setEnabled(value);
    setSaving(true);
    try {
      const response = await fetch("/api/preferences/update", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ next_action_prompts_enabled: value }),
      });
      if (!response.ok) setEnabled(!value);
    } catch {
      setEnabled(!value);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="acct-card p-5" aria-labelledby="next-action-toggle-title">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--acct-gold-soft)] text-[var(--acct-gold)]">
            <Compass size={18} />
          </div>
          <div>
            <p
              id="next-action-toggle-title"
              className="text-sm font-medium text-[var(--acct-ink)]"
            >
              {copy.settings.toggleLabel}
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--acct-muted)]">
              {copy.settings.toggleDescription}
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-labelledby="next-action-toggle-title"
          disabled={saving}
          onClick={() => void persist(!enabled)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
            enabled ? "bg-[var(--acct-gold)]" : "bg-[var(--acct-line)]"
          } ${saving ? "opacity-60" : ""}`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-5" : ""
            }`}
          />
        </button>
      </div>
    </section>
  );
}
