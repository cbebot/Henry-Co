"use client";

import { useState, useSyncExternalStore } from "react";
import { translateSurfaceLabel, useHenryCoLocale } from "@henryco/i18n";
import { BellRing, Check, Moon, Volume2, Vibrate, Zap } from "lucide-react";
import { signalAudio } from "@/lib/notification-signal/audio";
import {
  getSignalPreferencesServerSnapshot,
  getSignalPreferencesSnapshot,
  saveSignalPreferences,
  subscribeSignalPreferences,
  type NotificationSignalPreferences,
} from "@/lib/notification-signal/preferences";
import { isVibrationSupported, triggerHaptic } from "@/lib/notification-signal/vibration";

// useSyncExternalStore-friendly "is the client mounted yet?" sentinel.
// Snapshots are primitives so they're trivially referentially stable.
const noopSubscribe = () => () => {};
const trueSnapshot = () => true;
const falseSnapshot = () => false;
const audioSupportedSnapshot = () => signalAudio.isSupported();
const vibrationSupportedSnapshot = () => isVibrationSupported();

function Toggle({
  label,
  description,
  checked,
  onChange,
  icon: Icon,
  disabled,
  disabledHint,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  disabled?: boolean;
  disabledHint?: string;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-4 rounded-xl bg-[var(--acct-surface)] px-4 py-3 ${
        disabled ? "opacity-70" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {Icon ? <Icon size={14} className="text-[var(--acct-muted)]" /> : null}
          <p className="text-sm font-medium text-[var(--acct-ink)]">{label}</p>
        </div>
        <p className="mt-0.5 text-xs leading-5 text-[var(--acct-muted)]">{description}</p>
        {disabled && disabledHint ? (
          <p className="mt-1 text-[0.7rem] font-medium text-[var(--acct-muted)]">{disabledHint}</p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed ${
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

export default function NotificationSignalSettingsCard() {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const prefs = useSyncExternalStore<NotificationSignalPreferences>(
    subscribeSignalPreferences,
    getSignalPreferencesSnapshot,
    getSignalPreferencesServerSnapshot,
  );
  const hydrated = useSyncExternalStore(noopSubscribe, trueSnapshot, falseSnapshot);
  const audioSupported = useSyncExternalStore(noopSubscribe, audioSupportedSnapshot, falseSnapshot);
  const vibrationAvailable = useSyncExternalStore(
    noopSubscribe,
    vibrationSupportedSnapshot,
    falseSnapshot,
  );
  const [audioStatus, setAudioStatus] = useState<"idle" | "playing" | "blocked">("idle");

  const update = <K extends keyof NotificationSignalPreferences>(
    key: K,
    value: NotificationSignalPreferences[K],
  ) => {
    saveSignalPreferences({ ...prefs, [key]: value });
  };

  const handleTestSound = async () => {
    setAudioStatus("idle");
    const unlocked = await signalAudio.unlock();
    if (!unlocked) {
      setAudioStatus("blocked");
      return;
    }
    const ok = signalAudio.playChime("default");
    setAudioStatus(ok ? "playing" : "blocked");
    if (ok) {
      window.setTimeout(() => setAudioStatus("idle"), 1200);
    }
  };

  const handleTestVibration = () => {
    if (!vibrationAvailable) return;
    triggerHaptic("default");
  };

  // Don't render the form before hydration to avoid flashing default values
  // when the user has saved preferences in localStorage.
  if (!hydrated) {
    return (
      <div className="rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-4">
        <div className="acct-kicker mb-3">{t("On-device alerts")}</div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-[var(--acct-surface)]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="acct-kicker">{t("On-device alerts")}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--acct-muted)]">
            {t("Controls how new notifications signal you on this device. They do not change which notifications you receive.")}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Toggle
          icon={BellRing}
          label={t("In-app preview popups")}
          description={t("Show a small toast in the corner when a new notification arrives.")}
          checked={prefs.showToast}
          onChange={(v) => update("showToast", v)}
        />

        <div className="space-y-1">
          <Toggle
            icon={Volume2}
            label={t("Notification sound")}
            description={t("A short, soft chime when a new notification arrives.")}
            checked={prefs.sound}
            onChange={(v) => update("sound", v)}
            disabled={!audioSupported}
            disabledHint={!audioSupported ? t("Sound is not supported on this browser.") : undefined}
          />
          {prefs.sound && audioSupported ? (
            <div className="flex flex-wrap items-center gap-2 px-1 pt-1">
              <button
                type="button"
                onClick={() => void handleTestSound()}
                className="acct-button-ghost text-xs"
              >
                {t("Test sound")}
              </button>
              {audioStatus === "playing" ? (
                <span className="inline-flex items-center gap-1 text-[0.7rem] font-medium text-[var(--acct-green)]">
                  <Check size={12} aria-hidden /> {t("Played")}
                </span>
              ) : null}
              {audioStatus === "blocked" ? (
                <span className="text-[0.7rem] font-medium text-[var(--acct-muted)]">
                  {t("Tap or click anywhere on the page first to allow sound, then try again.")}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="space-y-1">
          <Toggle
            icon={Vibrate}
            label={t("Vibration")}
            description={t("A brief haptic pulse on supported devices when a new notification arrives.")}
            checked={prefs.vibration}
            onChange={(v) => update("vibration", v)}
            disabled={!vibrationAvailable}
            disabledHint={!vibrationAvailable ? t("Vibration is not supported on this device.") : undefined}
          />
          {prefs.vibration && vibrationAvailable ? (
            <div className="px-1 pt-1">
              <button
                type="button"
                onClick={handleTestVibration}
                className="acct-button-ghost text-xs"
              >
                {t("Test vibration")}
              </button>
            </div>
          ) : null}
        </div>

        <Toggle
          icon={Zap}
          label={t("High-priority only")}
          description={t("Only signal urgent alerts (security and time-sensitive updates). Other notifications still appear in your feed.")}
          checked={prefs.highPriorityOnly}
          onChange={(v) => update("highPriorityOnly", v)}
        />

        <div className="rounded-xl bg-[var(--acct-surface)] px-4 py-3">
          <Toggle
            icon={Moon}
            label={t("Quiet hours")}
            description={t("Mute sound and vibration during a daily window. Toasts still appear visually.")}
            checked={prefs.quietHoursEnabled}
            onChange={(v) => update("quietHoursEnabled", v)}
          />
          {prefs.quietHoursEnabled ? (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs font-medium text-[var(--acct-muted)]">
                {t("Start")}
                <input
                  type="time"
                  className="acct-input"
                  value={prefs.quietHoursStart}
                  onChange={(event) => update("quietHoursStart", event.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-[var(--acct-muted)]">
                {t("End")}
                <input
                  type="time"
                  className="acct-input"
                  value={prefs.quietHoursEnd}
                  onChange={(event) => update("quietHoursEnd", event.target.value)}
                />
              </label>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
