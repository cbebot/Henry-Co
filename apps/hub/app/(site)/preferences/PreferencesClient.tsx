"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { getSharedCookieDomain } from "@henryco/config";
import {
  LOCALE_LABELS,
  getUserSelectableLocales,
  isPublicSelectorLocale,
  isRtlLocale,
  type AppLocale,
  type EcosystemConsentCopy,
} from "@henryco/i18n";
import { formatDate } from "@henryco/i18n/format-date";
import { Globe, ShieldCheck, Palette, Check, Sun, Moon, Monitor } from "lucide-react";

const STORAGE_KEY = "henryco-ecosystem-consent";
const COOKIE_KEY = "henryco_ecosystem_consent";

type ConsentState = {
  essential: true;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
  personalizedExperience: boolean;
  updatedAt: string;
};

const DEFAULT_CONSENT: ConsentState = {
  essential: true,
  preferences: false,
  analytics: false,
  marketing: false,
  personalizedExperience: false,
  updatedAt: "",
};

function readCookie(name: string) {
  if (typeof document === "undefined") return undefined;
  const prefix = `${name}=`;
  return document.cookie
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(prefix))
    ?.slice(prefix.length);
}

function persistConsent(value: ConsentState, host: string) {
  const serialized = JSON.stringify(value);
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, serialized);
  const domain = getSharedCookieDomain(host);
  const domainPart = domain ? `; domain=${domain}` : "";
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(serialized)}; path=/; max-age=31536000; samesite=lax${domainPart}`;
}

const THEME_OPTIONS = [
  { value: "system", label: "System", Icon: Monitor },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "light", label: "Light", Icon: Sun },
] as const;

export default function PreferencesClient({
  initialLocale,
  copy,
}: {
  initialLocale: AppLocale;
  copy: EcosystemConsentCopy;
}) {
  const [ready, setReady] = useState(false);
  const [consent, setConsent] = useState<ConsentState>(DEFAULT_CONSENT);
  const [localeChoice, setLocaleChoice] = useState<AppLocale>(initialLocale);
  const [saved, setSaved] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setLocaleChoice(initialLocale);
  }, [initialLocale]);

  useEffect(() => {
    try {
      let raw: string | null = null;
      if (typeof window !== "undefined") {
        const local = window.localStorage.getItem(STORAGE_KEY);
        const cookie = readCookie(COOKIE_KEY);
        raw = local || (cookie ? decodeURIComponent(cookie) : "") || null;
      }
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ConsentState>;
        setConsent({
          essential: true,
          preferences: Boolean(parsed.preferences),
          analytics: Boolean(parsed.analytics),
          marketing: Boolean(parsed.marketing),
          personalizedExperience: Boolean(parsed.personalizedExperience),
          updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
        });
      }
    } catch {
      /* ignore parse errors */
    } finally {
      setReady(true);
    }
  }, []);

  const lastUpdated = useMemo(() => {
    if (!consent.updatedAt) return copy.panel.lastUpdatedNever;
    const date = new Date(consent.updatedAt);
    if (Number.isNaN(date.getTime())) return consent.updatedAt;
    return `${copy.panel.lastUpdated}: ${formatDate(date, { locale: localeChoice, year: "numeric", month: "short", day: "numeric" })}`;
  }, [consent.updatedAt, copy.panel.lastUpdated, copy.panel.lastUpdatedNever, localeChoice]);
  const languageOptions = useMemo(() => getUserSelectableLocales(localeChoice), [localeChoice]);

  const persistLocale = useCallback(async (locale: AppLocale) => {
    try {
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: locale }),
        keepalive: true,
      });
    } catch {
      /* non-fatal */
    }
  }, []);

  function save() {
    const payload: ConsentState = {
      ...consent,
      essential: true,
      updatedAt: new Date().toISOString(),
    };
    setConsent(payload);
    if (typeof window !== "undefined") {
      persistConsent(payload, window.location.hostname);
    }
    void persistLocale(localeChoice);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-white/8" />
        <div className="mt-4 h-4 w-96 animate-pulse rounded bg-white/6" />
        <div className="mt-12 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/[0.04] border border-white/8" />
          ))}
        </div>
      </div>
    );
  }

  const isRtl = isRtlLocale(localeChoice);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8" dir={isRtl ? "rtl" : "ltr"}>
      <div className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {copy.panel.title}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-white/60">
          {lastUpdated}
        </p>
      </div>

      {/* ── Language ── */}
      <section className="mb-10">
        <div className="flex items-center gap-2.5 mb-5">
          <Globe className="h-5 w-5 text-[color:var(--accent,#C9A227)]" />
          <h2 className="text-lg font-semibold text-white">{copy.language.label}</h2>
        </div>
        <p className="mb-4 text-sm text-white/55">{copy.language.hint}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {languageOptions.map((code) => {
            const active = code === localeChoice;
            return (
              <button
                key={code}
                type="button"
                onClick={() => setLocaleChoice(code)}
                className={[
                  "relative flex flex-col items-start rounded-xl border px-4 py-3 text-left transition-all",
                  active
                    ? "border-[color:var(--accent,#C9A227)]/60 bg-[color:var(--accent,#C9A227)]/10 ring-1 ring-[color:var(--accent,#C9A227)]/30"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]",
                ].join(" ")}
                dir={isRtlLocale(code) ? "rtl" : "ltr"}
              >
                <span className="text-sm font-semibold text-white">{LOCALE_LABELS[code].native}</span>
                <span className="text-xs text-white/45">{LOCALE_LABELS[code].en}</span>
                {!isPublicSelectorLocale(code) ? (
                  <span className="mt-2 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-white/58">
                    Scaffold
                  </span>
                ) : null}
                {active ? (
                  <Check className="absolute top-2.5 end-2.5 h-4 w-4 text-[color:var(--accent,#C9A227)]" />
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Theme ── */}
      <section className="mb-10">
        <div className="flex items-center gap-2.5 mb-5">
          <Palette className="h-5 w-5 text-[color:var(--accent,#C9A227)]" />
          <h2 className="text-lg font-semibold text-white">{copy.panel.theme}</h2>
        </div>
        <div className="flex gap-2">
          {THEME_OPTIONS.map(({ value, label, Icon }) => {
            const active = (theme || "system") === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={[
                  "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "border-[color:var(--accent,#C9A227)]/60 bg-[color:var(--accent,#C9A227)]/10 text-white"
                    : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:text-white",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Privacy & Personalization ── */}
      <section className="mb-10">
        <div className="flex items-center gap-2.5 mb-5">
          <ShieldCheck className="h-5 w-5 text-[color:var(--accent,#C9A227)]" />
          <h2 className="text-lg font-semibold text-white">{copy.panel.eyebrow}</h2>
        </div>

        <div className="space-y-3">
          <PreferenceCard
            title={copy.panel.essential.title}
            description={copy.panel.essential.description}
            checked
            disabled
            onChange={() => undefined}
          />
          <PreferenceCard
            title={copy.panel.preferences.title}
            description={copy.panel.preferences.description}
            checked={consent.preferences}
            onChange={(v) => setConsent((c) => ({ ...c, preferences: v }))}
          />
          <PreferenceCard
            title={copy.panel.personalized.title}
            description={copy.panel.personalized.description}
            checked={consent.personalizedExperience}
            onChange={(v) => setConsent((c) => ({ ...c, personalizedExperience: v }))}
          />
          <PreferenceCard
            title={copy.panel.analytics.title}
            description={copy.panel.analytics.description}
            checked={consent.analytics}
            onChange={(v) => setConsent((c) => ({ ...c, analytics: v }))}
          />
          <PreferenceCard
            title={copy.panel.marketing.title}
            description={copy.panel.marketing.description}
            checked={consent.marketing}
            onChange={(v) => setConsent((c) => ({ ...c, marketing: v }))}
          />
        </div>
      </section>

      {/* ── Actions ── */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          className="inline-flex items-center gap-2 rounded-full bg-[color:var(--accent,#C9A227)] px-6 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90"
        >
          {saved ? <Check className="h-4 w-4" /> : null}
          {saved ? copy.panel.savedConfirmation : copy.panel.save}
        </button>
        <button
          type="button"
          onClick={() => {
            setConsent({
              essential: true,
              preferences: false,
              analytics: false,
              marketing: false,
              personalizedExperience: false,
              updatedAt: "",
            });
          }}
          className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
        >
          {copy.panel.keepEssential}
        </button>
      </div>
    </div>
  );
}

function PreferenceCard({
  title,
  description,
  checked,
  disabled = false,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={[
        "flex items-start justify-between gap-4 rounded-2xl border p-5 transition-colors",
        disabled
          ? "border-white/8 bg-white/[0.02] cursor-default"
          : "border-white/10 bg-white/[0.04] cursor-pointer hover:border-white/16 hover:bg-white/[0.06]",
      ].join(" ")}
    >
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-semibold text-white">{title}</div>
        <div className="mt-1.5 text-sm leading-relaxed text-white/55">{description}</div>
      </div>
      <div className="relative mt-0.5 flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <div
          className={[
            "h-6 w-11 rounded-full border transition-colors",
            checked
              ? "border-[color:var(--accent,#C9A227)]/40 bg-[color:var(--accent,#C9A227)]"
              : "border-white/16 bg-white/10",
            disabled ? "opacity-50" : "",
          ].join(" ")}
        />
        <div
          className={[
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all",
            checked ? "start-[22px]" : "start-0.5",
          ].join(" ")}
        />
      </div>
    </label>
  );
}
