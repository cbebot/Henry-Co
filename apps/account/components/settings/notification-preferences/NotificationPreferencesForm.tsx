"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlarmClock,
  Bell,
  BellOff,
  Building2,
  Check,
  ChevronDown,
  Clock,
  GraduationCap,
  Loader2,
  Mail,
  MessageSquare,
  Palette,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  Users,
  Volume2,
  VolumeX,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";

// V2-NOT-01-C: Notifications preferences form.
//
// Field cluster:
//   Delivery       — toast/sound/vibration + high_priority_only
//   Quiet hours    — start/end + IANA timezone
//   Email fallback — enabled + delay choice + estimated next-fallback hint
//   Channels       — email_marketing/transactional/digest, push, whatsapp, sms
//   Mute           — by division (12 toggles) + by event type (search list)
//
// Persistence model:
//   Each field auto-saves with a 500ms debounce on the field key, plus
//   optimistic state. On server reject the field rolls back AND surfaces
//   an inline error pill at the section. The Save All button is a manual
//   flush — useful in flaky-network conditions where the user would rather
//   batch a confirm than rely on the silent debounce.

const ALLOWED_DELAY_HOURS: ReadonlyArray<number> = [1, 4, 12, 24, 48];

type DivisionKey =
  | "care"
  | "marketplace"
  | "property"
  | "logistics"
  | "jobs"
  | "learn"
  | "studio"
  | "security"
  | "account"
  | "hub"
  | "staff"
  | "system";

type DivisionConfig = {
  key: DivisionKey;
  label: string;
  description: string;
  icon: LucideIcon;
};

// Alphabetical, with "system" pinned last (it's HenryCo-internal — users
// shouldn't easily mute it without scrolling past everything else).
const DIVISIONS: ReadonlyArray<DivisionConfig> = [
  { key: "account", label: "Account", description: "Wallet, payments, and profile updates", icon: Users },
  { key: "care", label: "Care", description: "Bookings, tracking, and service alerts", icon: Sparkles },
  { key: "hub", label: "HenryCo Hub", description: "Cross-division program updates", icon: Wifi },
  { key: "jobs", label: "Jobs", description: "Application movement and recruiter messages", icon: Building2 },
  { key: "learn", label: "Learn", description: "Course activity and certification updates", icon: GraduationCap },
  { key: "logistics", label: "Logistics", description: "Shipment progress and delivery alerts", icon: Truck },
  { key: "marketplace", label: "Marketplace", description: "Orders, seller updates, and disputes", icon: ShoppingBag },
  { key: "property", label: "Property", description: "Inquiries, viewings, and listing progress", icon: Building2 },
  { key: "security", label: "Security", description: "Account and device security alerts", icon: ShieldCheck },
  { key: "staff", label: "Staff", description: "Operator-channel updates if you have access", icon: Users },
  { key: "studio", label: "Studio", description: "Proposals, project rooms, and payment steps", icon: Palette },
  { key: "system", label: "System", description: "HenryCo-internal alerts and platform notices", icon: Bell },
];

type EventTypeOption = {
  value: string;
  label: string;
  division: DivisionKey;
};

// Sourced from packages/notifications/event-types.ts. We don't import the
// runtime registry because doing so leaks a server module's shape into the
// client; the labels are display copy that lives in the UI layer.
const EVENT_TYPES: ReadonlyArray<EventTypeOption> = [
  { value: "auth.signup.welcome", label: "Welcome / signup confirmations", division: "account" },
  { value: "auth.password.changed", label: "Password change confirmations", division: "security" },
  { value: "auth.security.new_device", label: "New device sign-in alerts", division: "security" },
  { value: "system.welcome", label: "System welcome messages", division: "system" },
  { value: "logistics.shipment.update", label: "Shipment movement updates", division: "logistics" },
  { value: "marketplace.order.update", label: "Order status updates", division: "marketplace" },
  { value: "property.viewing.update", label: "Property viewing changes", division: "property" },
  { value: "learn.enrollment.update", label: "Course enrollment updates", division: "learn" },
  { value: "studio.project.update", label: "Project room updates", division: "studio" },
  { value: "care.booking.update", label: "Care booking updates", division: "care" },
  { value: "support.reply.received", label: "Support thread replies", division: "account" },
  { value: "support.thread.created", label: "New support threads", division: "account" },
  { value: "wallet.transaction.update", label: "Wallet transaction updates", division: "account" },
  { value: "kyc.review.update", label: "KYC verification updates", division: "security" },
  { value: "system.notification.relay", label: "Cross-division relays", division: "system" },
];

type Preferences = {
  email_fallback_enabled: boolean;
  email_fallback_delay_hours: number;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  quiet_hours_timezone: string | null;
  muted_divisions: string[];
  muted_event_types: string[];
  in_app_toast_enabled: boolean;
  notification_sound_enabled: boolean;
  notification_vibration_enabled: boolean;
  high_priority_only: boolean;
  email_marketing: boolean;
  email_transactional: boolean;
  email_digest: boolean;
  push_enabled: boolean;
  whatsapp_enabled: boolean;
  sms_enabled: boolean;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

const DEFAULT_PREFS: Preferences = {
  email_fallback_enabled: true,
  email_fallback_delay_hours: 24,
  quiet_hours_enabled: false,
  quiet_hours_start: "22:00:00",
  quiet_hours_end: "07:00:00",
  quiet_hours_timezone: null,
  muted_divisions: [],
  muted_event_types: [],
  in_app_toast_enabled: true,
  notification_sound_enabled: false,
  notification_vibration_enabled: false,
  high_priority_only: false,
  email_marketing: true,
  email_transactional: true,
  email_digest: false,
  push_enabled: true,
  whatsapp_enabled: false,
  sms_enabled: false,
};

function normalizeTime(value: string | null | undefined, fallback: string) {
  const v = String(value || fallback);
  return v.slice(0, 5); // HH:MM for the <input type="time"> control
}

function buildInitialState(initial: Record<string, unknown> | null | undefined): Preferences {
  const merged: Preferences = { ...DEFAULT_PREFS };
  if (!initial) return merged;
  for (const key of Object.keys(merged) as Array<keyof Preferences>) {
    const value = initial[key];
    if (value === undefined || value === null) {
      if (key === "quiet_hours_timezone") merged.quiet_hours_timezone = null;
      continue;
    }
    if (key === "muted_divisions" || key === "muted_event_types") {
      merged[key] = Array.isArray(value) ? (value as string[]).map((v) => String(v)) : [];
    } else if (key === "quiet_hours_start" || key === "quiet_hours_end") {
      merged[key] = String(value);
    } else if (key === "quiet_hours_timezone") {
      merged.quiet_hours_timezone = typeof value === "string" ? value : null;
    } else if (key === "email_fallback_delay_hours") {
      const n = Number(value);
      merged.email_fallback_delay_hours = ALLOWED_DELAY_HOURS.includes(n) ? n : 24;
    } else if (typeof value === "boolean") {
      (merged as Record<string, unknown>)[key] = value;
    }
  }
  return merged;
}

function detectBrowserTimezone(): string | null {
  if (typeof Intl === "undefined") return null;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz && /^[A-Za-z0-9_+\-/]+$/.test(tz) ? tz : null;
  } catch {
    return null;
  }
}

// Curated common-zones list. We don't render the whole IANA database since
// it explodes the picker; users on uncommon zones can still type and we
// detect their browser's zone as the default.
const COMMON_TIMEZONES: ReadonlyArray<string> = [
  "Africa/Lagos",
  "Africa/Accra",
  "Africa/Johannesburg",
  "Africa/Nairobi",
  "Africa/Cairo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Amsterdam",
  "Europe/Rome",
  "Europe/Moscow",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Sao_Paulo",
  "America/Mexico_City",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Pacific/Auckland",
  "UTC",
];

type PatchPayload = Partial<Preferences>;

export default function NotificationPreferencesForm({
  initialPreferences,
}: {
  initialPreferences: Record<string, unknown> | null;
}) {
  const locale = useHenryCoLocale();
  const t = useCallback((text: string) => translateSurfaceLabel(locale, text), [locale]);

  const [prefs, setPrefs] = useState<Preferences>(() => buildInitialState(initialPreferences));
  const [pendingFields, setPendingFields] = useState<ReadonlySet<keyof Preferences>>(new Set());
  const [errorFields, setErrorFields] = useState<ReadonlySet<keyof Preferences>>(new Set());
  const [globalStatus, setGlobalStatus] = useState<SaveStatus>("idle");
  const [globalMessage, setGlobalMessage] = useState<string>("");
  const [eventSearch, setEventSearch] = useState("");
  const [eventListOpen, setEventListOpen] = useState(false);
  const [tzPickerOpen, setTzPickerOpen] = useState(false);
  const [tzSearch, setTzSearch] = useState("");

  // Per-field debounce timers keyed by field name. We don't share a single
  // debounce: tapping toggle A then toggle B should let A flush even if B is
  // still settling.
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // Authoritative server-confirmed snapshot, used for rollback.
  const lastConfirmed = useRef<Preferences>(prefs);

  useEffect(() => {
    return () => {
      const timers = debounceTimers.current;
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    };
  }, []);

  const detectedTimezone = useMemo(() => detectBrowserTimezone(), []);
  const effectiveTimezone = prefs.quiet_hours_timezone || detectedTimezone || "UTC";

  const setPrefsAndCommit = useCallback(
    async (
      patch: PatchPayload,
      options: { rollbackOnError?: boolean } = { rollbackOnError: true },
    ) => {
      const fields = Object.keys(patch) as Array<keyof Preferences>;
      const previous = { ...prefs };
      const nextPrefs = { ...prefs, ...patch } as Preferences;
      setPrefs(nextPrefs);
      setPendingFields((s) => {
        const next = new Set(s);
        for (const f of fields) next.add(f);
        return next;
      });
      setErrorFields((s) => {
        const next = new Set(s);
        for (const f of fields) next.delete(f);
        return next;
      });
      setGlobalStatus("saving");
      setGlobalMessage(t("Saving preferences..."));

      let response: Response;
      try {
        response = await fetch("/api/notifications/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
      } catch {
        if (options.rollbackOnError) setPrefs(previous);
        setPendingFields((s) => {
          const next = new Set(s);
          for (const f of fields) next.delete(f);
          return next;
        });
        setErrorFields((s) => {
          const next = new Set(s);
          for (const f of fields) next.add(f);
          return next;
        });
        setGlobalStatus("error");
        setGlobalMessage(t("We couldn’t reach the server. Your last change was rolled back."));
        return;
      }

      if (!response.ok) {
        if (options.rollbackOnError) setPrefs(previous);
        setPendingFields((s) => {
          const next = new Set(s);
          for (const f of fields) next.delete(f);
          return next;
        });
        setErrorFields((s) => {
          const next = new Set(s);
          for (const f of fields) next.add(f);
          return next;
        });
        setGlobalStatus("error");
        setGlobalMessage(
          response.status === 401
            ? t("Your session expired. Please refresh and sign in again.")
            : t("That value wasn’t accepted. Your last change was rolled back."),
        );
        return;
      }

      let confirmed: Preferences | null = null;
      try {
        const json = (await response.json()) as { preferences?: Record<string, unknown> };
        if (json?.preferences) confirmed = buildInitialState(json.preferences);
      } catch {
        // Server accepted; treat optimistic state as confirmed.
      }

      const finalState = confirmed ?? nextPrefs;
      lastConfirmed.current = finalState;
      setPrefs(finalState);
      setPendingFields((s) => {
        const next = new Set(s);
        for (const f of fields) next.delete(f);
        return next;
      });
      setGlobalStatus("saved");
      setGlobalMessage(t("Preferences saved."));
    },
    [prefs, t],
  );

  const queueDebouncedPatch = useCallback(
    (field: keyof Preferences, value: unknown) => {
      // Preview the new state immediately for crisp UX.
      setPrefs((current) => ({ ...current, [field]: value }) as Preferences);
      const key = String(field);
      const existing = debounceTimers.current.get(key);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(() => {
        debounceTimers.current.delete(key);
        // We re-resolve from latest state at flush time so two rapid edits
        // to the same field collapse into a single PATCH with the latest.
        setPrefs((latest) => {
          const patch = { [field]: latest[field] } as PatchPayload;
          void setPrefsAndCommit(patch);
          return latest;
        });
      }, 500);
      debounceTimers.current.set(key, timer);
    },
    [setPrefsAndCommit],
  );

  const flushAll = useCallback(() => {
    // Cancel pending debounces and commit the full snapshot in one PATCH.
    const timers = debounceTimers.current;
    for (const timer of timers.values()) clearTimeout(timer);
    timers.clear();
    void setPrefsAndCommit(prefs as PatchPayload);
  }, [prefs, setPrefsAndCommit]);

  // Section-level toggle for full-snapshot save. We compute hasUnsynced from
  // pendingFields instead of comparing to `lastConfirmed.current` because the
  // optimistic UI may show synced state during the debounce window.
  const hasUnsynced = pendingFields.size > 0;

  const updateBoolean = useCallback(
    (field: keyof Preferences, value: boolean) => {
      queueDebouncedPatch(field, value);
    },
    [queueDebouncedPatch],
  );

  const updateDelay = useCallback(
    (hours: number) => {
      if (!ALLOWED_DELAY_HOURS.includes(hours)) return;
      queueDebouncedPatch("email_fallback_delay_hours", hours);
    },
    [queueDebouncedPatch],
  );

  const updateTime = useCallback(
    (field: "quiet_hours_start" | "quiet_hours_end", value: string) => {
      queueDebouncedPatch(field, `${value}:00`);
    },
    [queueDebouncedPatch],
  );

  const updateTimezone = useCallback(
    (value: string | null) => {
      queueDebouncedPatch("quiet_hours_timezone", value);
      setTzPickerOpen(false);
    },
    [queueDebouncedPatch],
  );

  const toggleDivisionMute = useCallback(
    (key: DivisionKey, muted: boolean) => {
      const current = new Set(prefs.muted_divisions);
      if (muted) current.add(key);
      else current.delete(key);
      queueDebouncedPatch("muted_divisions", [...current].sort());
    },
    [prefs.muted_divisions, queueDebouncedPatch],
  );

  const toggleEventMute = useCallback(
    (eventValue: string, muted: boolean) => {
      const current = new Set(prefs.muted_event_types);
      if (muted) current.add(eventValue);
      else current.delete(eventValue);
      queueDebouncedPatch("muted_event_types", [...current].sort());
    },
    [prefs.muted_event_types, queueDebouncedPatch],
  );

  const filteredEvents = useMemo(() => {
    const q = eventSearch.trim().toLowerCase();
    if (!q) return EVENT_TYPES;
    return EVENT_TYPES.filter(
      (e) =>
        e.label.toLowerCase().includes(q) ||
        e.value.toLowerCase().includes(q) ||
        e.division.toLowerCase().includes(q),
    );
  }, [eventSearch]);

  const filteredTimezones = useMemo(() => {
    const q = tzSearch.trim().toLowerCase();
    if (!q) return COMMON_TIMEZONES;
    return COMMON_TIMEZONES.filter((tz) => tz.toLowerCase().includes(q));
  }, [tzSearch]);

  const mutedDivisionSet = useMemo(() => new Set(prefs.muted_divisions), [prefs.muted_divisions]);
  const mutedEventSet = useMemo(() => new Set(prefs.muted_event_types), [prefs.muted_event_types]);

  return (
    <div className="space-y-5">
      {/* Live save status — announced to screen readers for a11y */}
      <div
        className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition-colors ${
          globalStatus === "error"
            ? "border-[var(--acct-red-soft)] bg-[var(--acct-red-soft)] text-[var(--acct-red)]"
            : globalStatus === "saved"
            ? "border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] text-[var(--acct-muted)]"
            : "border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] text-[var(--acct-muted)]"
        }`}
        role="status"
        aria-live="polite"
      >
        <span className="flex items-center gap-2">
          {globalStatus === "saving" ? (
            <Loader2 size={14} className="animate-spin" aria-hidden />
          ) : globalStatus === "saved" ? (
            <Check size={14} className="text-[var(--acct-green)]" aria-hidden />
          ) : globalStatus === "error" ? (
            <BellOff size={14} aria-hidden />
          ) : (
            <Bell size={14} className="text-[var(--acct-gold)]" aria-hidden />
          )}
          <span>
            {globalStatus === "idle" ? t("Changes save automatically. Use the button below to flush all at once.") : globalMessage}
          </span>
        </span>
        <button
          type="button"
          onClick={flushAll}
          disabled={!hasUnsynced && globalStatus !== "error"}
          className="acct-button-ghost rounded-xl text-xs disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("Save all now")}
        </button>
      </div>

      {/* Delivery */}
      <Section title={t("In-app delivery")} kicker="Delivery" icon={Bell}>
        <Toggle
          label={t("Preview popups")}
          description={t("Compact preview cards for new notifications while the page is open.")}
          checked={prefs.in_app_toast_enabled}
          onChange={(v) => updateBoolean("in_app_toast_enabled", v)}
          isPending={pendingFields.has("in_app_toast_enabled")}
        />
        <Toggle
          label={t("Notification sound")}
          description={t("Play a subtle chime once you’ve interacted with the page on this device.")}
          checked={prefs.notification_sound_enabled}
          onChange={(v) => updateBoolean("notification_sound_enabled", v)}
          isPending={pendingFields.has("notification_sound_enabled")}
          icon={prefs.notification_sound_enabled ? Volume2 : VolumeX}
        />
        <Toggle
          label={t("Vibration")}
          description={t("Use light haptic feedback on supported devices.")}
          checked={prefs.notification_vibration_enabled}
          onChange={(v) => updateBoolean("notification_vibration_enabled", v)}
          isPending={pendingFields.has("notification_vibration_enabled")}
        />
        <Toggle
          label={t("High priority only")}
          description={t("Limit popups, sound, and vibration to security and urgent alerts.")}
          checked={prefs.high_priority_only}
          onChange={(v) => updateBoolean("high_priority_only", v)}
          isPending={pendingFields.has("high_priority_only")}
        />
      </Section>

      {/* Quiet hours */}
      <Section title={t("Quiet hours")} kicker="Calm" icon={AlarmClock}>
        <Toggle
          label={t("Enable quiet hours")}
          description={t("Suppress sound and vibration during the time window you choose.")}
          checked={prefs.quiet_hours_enabled}
          onChange={(v) => updateBoolean("quiet_hours_enabled", v)}
          isPending={pendingFields.has("quiet_hours_enabled")}
        />

        <div className="grid gap-3 rounded-xl bg-[var(--acct-surface)] px-4 py-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-[var(--acct-ink)]">
            <span className="block">{t("Start")}</span>
            <input
              type="time"
              value={normalizeTime(prefs.quiet_hours_start, "22:00")}
              disabled={!prefs.quiet_hours_enabled}
              onChange={(e) => updateTime("quiet_hours_start", e.target.value)}
              className="w-full rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] px-3 py-2 text-sm text-[var(--acct-ink)] disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={t("Quiet hours start time")}
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-[var(--acct-ink)]">
            <span className="block">{t("End")}</span>
            <input
              type="time"
              value={normalizeTime(prefs.quiet_hours_end, "07:00")}
              disabled={!prefs.quiet_hours_enabled}
              onChange={(e) => updateTime("quiet_hours_end", e.target.value)}
              className="w-full rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] px-3 py-2 text-sm text-[var(--acct-ink)] disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={t("Quiet hours end time")}
            />
          </label>
        </div>

        <div className="rounded-xl bg-[var(--acct-surface)] px-4 py-4">
          <p className="acct-kicker mb-2">{t("Timezone")}</p>
          <button
            type="button"
            onClick={() => setTzPickerOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] px-3 py-2 text-sm text-[var(--acct-ink)]"
            aria-haspopup="listbox"
            aria-expanded={tzPickerOpen}
          >
            <span className="flex items-center gap-2">
              <Clock size={14} aria-hidden />
              <span>{prefs.quiet_hours_timezone ?? `${detectedTimezone ?? "UTC"} (${t("auto-detected")})`}</span>
            </span>
            <ChevronDown size={14} aria-hidden className={tzPickerOpen ? "rotate-180" : ""} />
          </button>
          {tzPickerOpen ? (
            <div className="mt-3 space-y-2 rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-3">
              <label className="flex items-center gap-2 rounded-lg bg-[var(--acct-surface)] px-3 py-2 text-sm">
                <Search size={14} aria-hidden className="text-[var(--acct-muted)]" />
                <input
                  type="text"
                  value={tzSearch}
                  onChange={(e) => setTzSearch(e.target.value)}
                  placeholder={t("Search timezones")}
                  className="flex-1 bg-transparent text-sm text-[var(--acct-ink)] outline-none"
                  aria-label={t("Search timezones")}
                />
              </label>
              <ul role="listbox" className="max-h-64 overflow-y-auto" aria-label={t("Timezone options")}>
                <li>
                  <button
                    type="button"
                    onClick={() => updateTimezone(null)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-[var(--acct-ink)] hover:bg-[var(--acct-surface)]"
                    role="option"
                    aria-selected={prefs.quiet_hours_timezone === null}
                  >
                    <span>{t("Use device timezone")}</span>
                    {prefs.quiet_hours_timezone === null ? <Check size={14} className="text-[var(--acct-gold)]" /> : null}
                  </button>
                </li>
                {filteredTimezones.map((tz) => (
                  <li key={tz}>
                    <button
                      type="button"
                      onClick={() => updateTimezone(tz)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-[var(--acct-ink)] hover:bg-[var(--acct-surface)]"
                      role="option"
                      aria-selected={prefs.quiet_hours_timezone === tz}
                    >
                      <span>{tz}</span>
                      {prefs.quiet_hours_timezone === tz ? <Check size={14} className="text-[var(--acct-gold)]" /> : null}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="mt-2 text-xs text-[var(--acct-muted)]">
            {t("Effective timezone:")} <span className="font-medium text-[var(--acct-ink)]">{effectiveTimezone}</span>
          </p>
        </div>
      </Section>

      {/* Email fallback */}
      <Section title={t("Email fallback")} kicker="Email" icon={Mail}>
        <Toggle
          label={t("Email me when I miss notifications in-app")}
          description={t("Send a reminder email if a notification stays unread past the chosen delay.")}
          checked={prefs.email_fallback_enabled}
          onChange={(v) => updateBoolean("email_fallback_enabled", v)}
          isPending={pendingFields.has("email_fallback_enabled")}
        />
        <div className="rounded-xl bg-[var(--acct-surface)] px-4 py-4">
          <p className="acct-kicker mb-2">{t("How long to wait before emailing")}</p>
          <div
            role="radiogroup"
            aria-label={t("Email fallback delay")}
            className="flex flex-wrap gap-2"
          >
            {ALLOWED_DELAY_HOURS.map((hours) => {
              const active = prefs.email_fallback_delay_hours === hours;
              return (
                <button
                  key={hours}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={!prefs.email_fallback_enabled}
                  onClick={() => updateDelay(hours)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    active
                      ? "border-[var(--acct-gold)] bg-[var(--acct-gold-soft)] text-[var(--acct-gold)]"
                      : "border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] text-[var(--acct-ink)] hover:border-[var(--acct-gold)]"
                  }`}
                >
                  {hours === 1 ? t("1 hour") : t("{n} hours").replace("{n}", String(hours))}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-[var(--acct-muted)]">
            {prefs.email_fallback_enabled
              ? t("Unread notifications older than {n} hours trigger a fallback email from your division’s sender.").replace(
                  "{n}",
                  String(prefs.email_fallback_delay_hours),
                )
              : t("Email fallback is off. Notifications will only appear in your inbox.")}
          </p>
        </div>
      </Section>

      {/* Channel cluster */}
      <Section title={t("Email & messaging channels")} kicker="Channels" icon={MessageSquare}>
        <Toggle
          label={t("Transaction emails")}
          description={t("Receipts, confirmations, and account-critical alerts.")}
          checked={prefs.email_transactional}
          onChange={(v) => updateBoolean("email_transactional", v)}
          isPending={pendingFields.has("email_transactional")}
        />
        <Toggle
          label={t("Marketing emails")}
          description={t("Promotions, new features, and offers.")}
          checked={prefs.email_marketing}
          onChange={(v) => updateBoolean("email_marketing", v)}
          isPending={pendingFields.has("email_marketing")}
        />
        <Toggle
          label={t("Weekly digest")}
          description={t("A calmer Sunday summary instead of separate-message noise.")}
          checked={prefs.email_digest}
          onChange={(v) => updateBoolean("email_digest", v)}
          isPending={pendingFields.has("email_digest")}
        />
        <Toggle
          label={t("Push notifications")}
          description={t("Device push alerts when the HenryCo app is available.")}
          checked={prefs.push_enabled}
          onChange={(v) => updateBoolean("push_enabled", v)}
          isPending={pendingFields.has("push_enabled")}
        />
        <Toggle
          label={t("WhatsApp updates")}
          description={t("Important delivery and project movement through WhatsApp where supported.")}
          checked={prefs.whatsapp_enabled}
          onChange={(v) => updateBoolean("whatsapp_enabled", v)}
          isPending={pendingFields.has("whatsapp_enabled")}
        />
        <Toggle
          label={t("SMS updates")}
          description={t("Short urgent updates through SMS for time-sensitive flows.")}
          checked={prefs.sms_enabled}
          onChange={(v) => updateBoolean("sms_enabled", v)}
          isPending={pendingFields.has("sms_enabled")}
        />
      </Section>

      {/* Mute by division */}
      <Section title={t("Mute divisions")} kicker="Mute" icon={BellOff}>
        <p className="text-xs leading-5 text-[var(--acct-muted)]">
          {t("Muted divisions still arrive in your inbox but stop sound, vibration, popups, and email fallback for that source.")}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {DIVISIONS.map((d) => {
            const muted = mutedDivisionSet.has(d.key);
            const Icon = d.icon;
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => toggleDivisionMute(d.key, !muted)}
                aria-pressed={muted}
                className={`flex items-start justify-between gap-3 rounded-xl border p-3 text-left transition-colors ${
                  muted
                    ? "border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] opacity-70"
                    : "border-[var(--acct-line)] bg-[var(--acct-surface)] hover:border-[var(--acct-gold)]"
                }`}
              >
                <div className="flex flex-1 items-start gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    muted
                      ? "bg-[var(--acct-bg-elevated)] text-[var(--acct-muted)]"
                      : "bg-[var(--acct-gold-soft)] text-[var(--acct-gold)]"
                  }`}>
                    <Icon size={16} aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--acct-ink)]">{t(d.label)}</p>
                    <p className="text-xs text-[var(--acct-muted)]">{t(d.description)}</p>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide ${
                    muted
                      ? "bg-[var(--acct-red-soft)] text-[var(--acct-red)]"
                      : "bg-[var(--acct-green-soft)] text-[var(--acct-green)]"
                  }`}
                >
                  {muted ? t("Muted") : t("On")}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Mute by event type */}
      <Section title={t("Mute specific events")} kicker="Event mute" icon={BellOff}>
        <button
          type="button"
          onClick={() => setEventListOpen((v) => !v)}
          aria-expanded={eventListOpen}
          className="flex w-full items-center justify-between rounded-xl border border-[var(--acct-line)] bg-[var(--acct-surface)] px-4 py-3 text-sm text-[var(--acct-ink)]"
        >
          <span className="flex items-center gap-2">
            <BellOff size={14} className="text-[var(--acct-muted)]" aria-hidden />
            <span>
              {t("Show event-type mute list")}
              <span className="ml-2 rounded-full bg-[var(--acct-bg-elevated)] px-2 py-0.5 text-[0.7rem] font-semibold text-[var(--acct-muted)]">
                {prefs.muted_event_types.length}
              </span>
            </span>
          </span>
          <ChevronDown size={14} aria-hidden className={eventListOpen ? "rotate-180" : ""} />
        </button>
        {eventListOpen ? (
          <div className="space-y-3 rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-3">
            <label className="flex items-center gap-2 rounded-lg bg-[var(--acct-surface)] px-3 py-2 text-sm">
              <Search size={14} aria-hidden className="text-[var(--acct-muted)]" />
              <input
                type="text"
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                placeholder={t("Filter by event name or division")}
                className="flex-1 bg-transparent text-sm text-[var(--acct-ink)] outline-none"
                aria-label={t("Filter events")}
              />
            </label>
            <ul className="max-h-80 space-y-1 overflow-y-auto">
              {filteredEvents.length === 0 ? (
                <li className="px-3 py-2 text-xs text-[var(--acct-muted)]">{t("No events match that filter.")}</li>
              ) : (
                filteredEvents.map((evt) => {
                  const muted = mutedEventSet.has(evt.value);
                  return (
                    <li key={evt.value}>
                      <button
                        type="button"
                        onClick={() => toggleEventMute(evt.value, !muted)}
                        aria-pressed={muted}
                        className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--acct-surface)]"
                      >
                        <span className="flex flex-col">
                          <span className="font-medium text-[var(--acct-ink)]">{t(evt.label)}</span>
                          <span className="text-[0.7rem] text-[var(--acct-muted)]">{evt.value}</span>
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide ${
                            muted
                              ? "bg-[var(--acct-red-soft)] text-[var(--acct-red)]"
                              : "bg-[var(--acct-bg-elevated)] text-[var(--acct-muted)]"
                          }`}
                        >
                          {muted ? t("Muted") : t("On")}
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        ) : null}
      </Section>

      {errorFields.size > 0 ? (
        <p className="rounded-xl bg-[var(--acct-red-soft)] px-4 py-3 text-xs text-[var(--acct-red)]">
          {t("Some changes were rejected by the server and rolled back. Please retry.")}
        </p>
      ) : null}
    </div>
  );
}

function Section({
  title,
  kicker,
  icon: Icon,
  children,
}: {
  title: string;
  kicker: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <section className="acct-card space-y-3 p-5" aria-labelledby={`section-${kicker}`}>
      <header className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--acct-gold-soft)] text-[var(--acct-gold)]">
          <Icon size={16} aria-hidden />
        </div>
        <div>
          <p className="acct-kicker">{kicker}</p>
          <h2 id={`section-${kicker}`} className="text-sm font-semibold text-[var(--acct-ink)]">
            {title}
          </h2>
        </div>
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
  isPending,
  icon: Icon,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  isPending?: boolean;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-[var(--acct-surface)] px-4 py-3">
      <div className="flex flex-1 items-start gap-3">
        {Icon ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--acct-bg-elevated)] text-[var(--acct-muted)]">
            <Icon size={14} aria-hidden />
          </div>
        ) : null}
        <div>
          <p className="text-sm font-medium text-[var(--acct-ink)]">{label}</p>
          <p className="text-xs text-[var(--acct-muted)]">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
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
        {isPending ? (
          <span className="absolute -right-2 -top-1 flex h-3 w-3 items-center justify-center">
            <Loader2 size={10} className="animate-spin text-[var(--acct-muted)]" aria-hidden />
          </span>
        ) : null}
      </button>
    </div>
  );
}
