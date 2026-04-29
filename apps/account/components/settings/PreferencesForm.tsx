"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { ButtonPendingContent } from "@henryco/ui";
import {
  pickNotificationSignalPreferenceUpdates,
  useNotificationSignalContext,
} from "@/lib/notification-signal";

type Props = {
  preferences: Record<string, boolean | string> | null;
};

type PreferencesState = {
  email_marketing: boolean;
  email_transactional: boolean;
  email_digest: boolean;
  push_enabled: boolean;
  whatsapp_enabled: boolean;
  sms_enabled: boolean;
  notification_care: boolean;
  notification_marketplace: boolean;
  notification_studio: boolean;
  notification_jobs: boolean;
  notification_learn: boolean;
  notification_property: boolean;
  notification_logistics: boolean;
  notification_wallet: boolean;
  notification_security: boolean;
  notification_referrals: boolean;
  in_app_toast_enabled: boolean;
  notification_sound_enabled: boolean;
  notification_vibration_enabled: boolean;
  high_priority_only: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
};

function readBoolean(value: boolean | string | undefined, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function buildInitialState(preferences: Props["preferences"]): PreferencesState {
  return {
    email_marketing: readBoolean(preferences?.email_marketing, true),
    email_transactional: readBoolean(preferences?.email_transactional, true),
    email_digest: readBoolean(preferences?.email_digest, false),
    push_enabled: readBoolean(preferences?.push_enabled, true),
    whatsapp_enabled: readBoolean(preferences?.whatsapp_enabled, false),
    sms_enabled: readBoolean(preferences?.sms_enabled, false),
    notification_care: readBoolean(preferences?.notification_care, true),
    notification_marketplace: readBoolean(preferences?.notification_marketplace, true),
    notification_studio: readBoolean(preferences?.notification_studio, true),
    notification_jobs: readBoolean(preferences?.notification_jobs, true),
    notification_learn: readBoolean(preferences?.notification_learn, true),
    notification_property: readBoolean(preferences?.notification_property, true),
    notification_logistics: readBoolean(preferences?.notification_logistics, true),
    notification_wallet: readBoolean(preferences?.notification_wallet, true),
    notification_security: readBoolean(preferences?.notification_security, true),
    notification_referrals: readBoolean(preferences?.notification_referrals, true),
    in_app_toast_enabled: readBoolean(preferences?.in_app_toast_enabled, true),
    notification_sound_enabled: readBoolean(preferences?.notification_sound_enabled, false),
    notification_vibration_enabled: readBoolean(preferences?.notification_vibration_enabled, false),
    high_priority_only: readBoolean(preferences?.high_priority_only, false),
    quiet_hours_enabled: readBoolean(preferences?.quiet_hours_enabled, false),
    quiet_hours_start: String(preferences?.quiet_hours_start || "22:00").slice(0, 5),
    quiet_hours_end: String(preferences?.quiet_hours_end || "07:00").slice(0, 5),
  };
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-[var(--acct-surface)] px-4 py-3">
      <div>
        <p className="text-sm font-medium text-[var(--acct-ink)]">{label}</p>
        <p className="text-xs text-[var(--acct-muted)]">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-[var(--acct-gold)]" : "bg-[var(--acct-line)]"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );
}

export default function PreferencesForm({ preferences }: Props) {
  const locale = useHenryCoLocale();
  const signalContext = useNotificationSignalContext();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const [prefs, setPrefs] = useState(() => buildInitialState(preferences));
  const [loading, setLoading] = useState(false);
  const [testingSound, setTestingSound] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    setPrefs(buildInitialState(preferences));
  }, [preferences]);

  const updateBoolean = (key: keyof PreferencesState, value: boolean) => {
    setPrefs((current) => ({ ...current, [key]: value }));
  };

  const updateText = (key: keyof PreferencesState, value: string) => {
    setPrefs((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/preferences/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      signalContext?.updatePreferences(
        pickNotificationSignalPreferenceUpdates({
          push_enabled: prefs.push_enabled,
          notification_care: prefs.notification_care,
          notification_marketplace: prefs.notification_marketplace,
          notification_studio: prefs.notification_studio,
          notification_jobs: prefs.notification_jobs,
          notification_learn: prefs.notification_learn,
          notification_property: prefs.notification_property,
          notification_logistics: prefs.notification_logistics,
          notification_wallet: prefs.notification_wallet,
          notification_security: prefs.notification_security,
          notification_referrals: prefs.notification_referrals,
          in_app_toast_enabled: prefs.in_app_toast_enabled,
          notification_sound_enabled: prefs.notification_sound_enabled,
          notification_vibration_enabled: prefs.notification_vibration_enabled,
          high_priority_only: prefs.high_priority_only,
          quiet_hours_enabled: prefs.quiet_hours_enabled,
          quiet_hours_start: prefs.quiet_hours_start,
          quiet_hours_end: prefs.quiet_hours_end,
        }),
      );

      setMessage({ type: "success", text: t("Preferences saved") });
      router.refresh();
    } catch {
      setMessage({ type: "error", text: t("Failed to save preferences") });
    } finally {
      setLoading(false);
    }
  };

  const handleTestSound = async () => {
    if (!signalContext || !prefs.notification_sound_enabled || testingSound) return;

    setTestingSound(true);
    try {
      await signalContext.testSound();
    } finally {
      setTestingSound(false);
    }
  };

  const soundStatusText = prefs.notification_sound_enabled
    ? signalContext?.audioUnlocked
      ? t("Sound enabled")
      : t("Sound blocked until you interact")
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-3" id="notification-signal-preferences">
      {message ? (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-[var(--acct-green-soft)] text-[var(--acct-green)]"
              : "bg-[var(--acct-red-soft)] text-[var(--acct-red)]"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <div className="rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-4">
        <p className="acct-kicker mb-3">{t("Delivery channels")}</p>
        <p className="mb-3 text-xs leading-5 text-[var(--acct-muted)]">
          {t("Turn on every channel you want to use. Email, in-app, WhatsApp, and SMS can all stay active at the same time.")}
        </p>
        <div className="space-y-3">
          <Toggle
            label={t("Marketing emails")}
            description={t("Promotions, new features, and offers")}
            checked={prefs.email_marketing}
            onChange={(value) => updateBoolean("email_marketing", value)}
          />
          <Toggle
            label={t("Transaction emails")}
            description={t("Receipts, confirmations, and alerts")}
            checked={prefs.email_transactional}
            onChange={(value) => updateBoolean("email_transactional", value)}
          />
          <Toggle
            label={t("Weekly digest")}
            description={t("A calmer summary instead of separate message noise")}
            checked={prefs.email_digest}
            onChange={(value) => updateBoolean("email_digest", value)}
          />
          <Toggle
            label={t("Push notifications")}
            description={t("Device push alerts — active on mobile when the HenryCo app is available")}
            checked={prefs.push_enabled}
            onChange={(value) => updateBoolean("push_enabled", value)}
          />
          <Toggle
            label={t("WhatsApp updates")}
            description={t("Important delivery and project movement through WhatsApp where supported")}
            checked={prefs.whatsapp_enabled}
            onChange={(value) => updateBoolean("whatsapp_enabled", value)}
          />
          <Toggle
            label={t("SMS updates")}
            description={t("Short urgent updates through SMS for time-sensitive flows")}
            checked={prefs.sms_enabled}
            onChange={(value) => updateBoolean("sms_enabled", value)}
          />
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="acct-kicker">{t("Notification sound")}</p>
          {soundStatusText ? (
            <span className="rounded-full bg-[var(--acct-gold-soft)] px-2.5 py-1 text-[0.72rem] font-semibold text-[var(--acct-gold)]">
              {soundStatusText}
            </span>
          ) : null}
        </div>

        <div className="mt-3 space-y-3">
          <Toggle
            label={t("Preview popups")}
            description={t("Compact preview cards for new notifications after the page is already open.")}
            checked={prefs.in_app_toast_enabled}
            onChange={(value) => updateBoolean("in_app_toast_enabled", value)}
          />
          <Toggle
            label={t("Enable sound")}
            description={t("Play a subtle chime for eligible notifications after you interact once on this device.")}
            checked={prefs.notification_sound_enabled}
            onChange={(value) => updateBoolean("notification_sound_enabled", value)}
          />
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[var(--acct-surface)] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[var(--acct-ink)]">{t("Test sound")}</p>
              <p className="text-xs text-[var(--acct-muted)]">
                {prefs.notification_sound_enabled
                  ? soundStatusText || t("Sound blocked until you interact")
                  : t("Enable sound")}
              </p>
            </div>
            <button
              type="button"
              disabled={!prefs.notification_sound_enabled || testingSound}
              onClick={() => void handleTestSound()}
              className="acct-button-ghost rounded-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ButtonPendingContent
                pending={testingSound}
                pendingLabel={t("Test sound")}
                spinnerLabel={t("Test sound")}
              >
                {t("Test sound")}
              </ButtonPendingContent>
            </button>
          </div>
          <Toggle
            label={t("Vibration")}
            description={t("Use light haptic feedback on supported devices.")}
            checked={prefs.notification_vibration_enabled}
            onChange={(value) => updateBoolean("notification_vibration_enabled", value)}
          />
          <Toggle
            label={t("High priority only")}
            description={t("Limit previews, sound, and vibration to high-priority or security updates.")}
            checked={prefs.high_priority_only}
            onChange={(value) => updateBoolean("high_priority_only", value)}
          />
          <Toggle
            label={t("Quiet hours")}
            description={t("Suppress sound and vibration during the hours you choose.")}
            checked={prefs.quiet_hours_enabled}
            onChange={(value) => updateBoolean("quiet_hours_enabled", value)}
          />

          <div className="grid gap-3 rounded-xl bg-[var(--acct-surface)] px-4 py-3 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-[var(--acct-ink)]">
              <span>{t("Quiet hours start")}</span>
              <input
                type="time"
                value={prefs.quiet_hours_start}
                disabled={!prefs.quiet_hours_enabled}
                onChange={(event) => updateText("quiet_hours_start", event.target.value)}
                className="w-full rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] px-3 py-2 text-sm text-[var(--acct-ink)] disabled:cursor-not-allowed disabled:opacity-60"
                aria-label={t("Quiet hours start")}
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-[var(--acct-ink)]">
              <span>{t("Quiet hours end")}</span>
              <input
                type="time"
                value={prefs.quiet_hours_end}
                disabled={!prefs.quiet_hours_enabled}
                onChange={(event) => updateText("quiet_hours_end", event.target.value)}
                className="w-full rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] px-3 py-2 text-sm text-[var(--acct-ink)] disabled:cursor-not-allowed disabled:opacity-60"
                aria-label={t("Quiet hours end")}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-4">
        <p className="acct-kicker mb-3">{t("Division sources")}</p>
        <div className="space-y-3">
          <Toggle
            label={t("Care notifications")}
            description={t("Bookings, tracking, and service status")}
            checked={prefs.notification_care}
            onChange={(value) => updateBoolean("notification_care", value)}
          />
          <Toggle
            label={t("Marketplace notifications")}
            description={t("Orders, seller updates, and disputes")}
            checked={prefs.notification_marketplace}
            onChange={(value) => updateBoolean("notification_marketplace", value)}
          />
          <Toggle
            label={t("Studio notifications")}
            description={t("Proposal movement, project room updates, and payment steps")}
            checked={prefs.notification_studio}
            onChange={(value) => updateBoolean("notification_studio", value)}
          />
          <Toggle
            label={t("Jobs notifications")}
            description={t("Application movement, recruiter updates, and alerts")}
            checked={prefs.notification_jobs}
            onChange={(value) => updateBoolean("notification_jobs", value)}
          />
          <Toggle
            label={t("Learn notifications")}
            description={t("Course activity, progress, and certification updates")}
            checked={prefs.notification_learn}
            onChange={(value) => updateBoolean("notification_learn", value)}
          />
          <Toggle
            label={t("Property notifications")}
            description={t("Inquiries, viewings, and listing progress")}
            checked={prefs.notification_property}
            onChange={(value) => updateBoolean("notification_property", value)}
          />
          <Toggle
            label={t("Logistics notifications")}
            description={t("Shipment movement and delivery updates")}
            checked={prefs.notification_logistics}
            onChange={(value) => updateBoolean("notification_logistics", value)}
          />
          <Toggle
            label={t("Wallet notifications")}
            description={t("Funding requests, balance changes, and verification alerts")}
            checked={prefs.notification_wallet}
            onChange={(value) => updateBoolean("notification_wallet", value)}
          />
          <div className="flex items-center justify-between gap-4 rounded-xl bg-[var(--acct-surface)] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[var(--acct-ink)]">{t("Security alerts")}</p>
              <p className="text-xs text-[var(--acct-muted)]">{t("Login attempts and sensitive account changes")}</p>
            </div>
            <span className="shrink-0 rounded-full bg-[var(--acct-green-soft)] px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-[var(--acct-green)]">
              {t("Always on")}
            </span>
          </div>
        </div>
      </div>

      <button type="submit" disabled={loading} className="acct-button-primary rounded-xl">
        <ButtonPendingContent pending={loading} pendingLabel={t("Saving preferences...")} spinnerLabel={t("Saving preferences...")}>
          {t("Save preferences")}
        </ButtonPendingContent>
      </button>
    </form>
  );
}
