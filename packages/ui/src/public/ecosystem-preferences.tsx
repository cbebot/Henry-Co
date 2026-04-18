"use client";

import { useEffect, useMemo, useState } from "react";
import { getSharedCookieDomain } from "@henryco/config";
import {
  PUBLIC_SELECTOR_LOCALES,
  getLocaleDisplayLabel,
  isPublicSelectorLocale,
  normalizeLocale,
  isRtlLocale,
  type AppLocale,
  type EcosystemConsentCopy,
} from "@henryco/i18n";
import { ShieldCheck } from "lucide-react";

const LEGACY_LS = "henryco-care-cookie-consent";
const LEGACY_COOKIE = "henryco_care_cookie_consent";
const STORAGE_KEY = "henryco-ecosystem-consent";
const COOKIE_KEY = "henryco_ecosystem_consent";
export const HENRYCO_OPEN_PREFERENCES_EVENT = "henryco:open-preferences";

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
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
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

function migrateLegacyConsent(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const local = window.localStorage.getItem(LEGACY_LS);
    const cookie = readCookie(LEGACY_COOKIE);
    const raw = local || (cookie ? decodeURIComponent(cookie) : "");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    const migrated: ConsentState = {
      essential: true,
      preferences: Boolean(parsed.preferences),
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      personalizedExperience: Boolean(
        (parsed as { personalizedExperience?: boolean }).personalizedExperience
      ),
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    };
    const host = window.location.hostname;
    persistConsent(migrated, host);
    window.localStorage.removeItem(LEGACY_LS);
    document.cookie = `${LEGACY_COOKIE}=; path=/; max-age=0`;
    return JSON.stringify(migrated);
  } catch {
    return null;
  }
}

const BANNER_DELAY_MS = 4000;

export function EcosystemPreferences({
  copy,
  initialLocale,
  localeApiPath = "/api/locale",
  bannerDelayMs = BANNER_DELAY_MS,
}: {
  copy: EcosystemConsentCopy;
  initialLocale: AppLocale;
  /** Same-origin path for POST `{ locale }` (sets shared cookie). */
  localeApiPath?: string;
  /** Delay before showing the consent banner to new visitors (ms). Set 0 to show immediately. */
  bannerDelayMs?: number;
}) {
  const [ready, setReady] = useState(false);
  const [consent, setConsent] = useState<ConsentState>(DEFAULT_CONSENT);
  const [showBanner, setShowBanner] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [localeChoice, setLocaleChoice] = useState<AppLocale>(initialLocale);

  useEffect(() => {
    setLocaleChoice(initialLocale);
  }, [initialLocale]);

  useEffect(() => {
    try {
      let raw = migrateLegacyConsent();

      if (!raw && typeof window !== "undefined") {
        const local = window.localStorage.getItem(STORAGE_KEY);
        const cookie = readCookie(COOKIE_KEY);
        raw = local || (cookie ? decodeURIComponent(cookie) : "") || null;
      }

      if (!raw) {
        const delay = bannerDelayMs > 0 ? bannerDelayMs : 0;
        const timer = setTimeout(() => setShowBanner(true), delay);
        setReady(true);
        return () => clearTimeout(timer);
      }

      const parsed = JSON.parse(raw) as Partial<ConsentState>;
      setConsent({
        essential: true,
        preferences: Boolean(parsed.preferences),
        analytics: Boolean(parsed.analytics),
        marketing: Boolean(parsed.marketing),
        personalizedExperience: Boolean(parsed.personalizedExperience),
        updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
      });
    } catch {
      setShowBanner(true);
    } finally {
      setReady(true);
    }
    return undefined;
  }, [bannerDelayMs]);

  useEffect(() => {
    function handleOpen() {
      setShowPanel(true);
    }
    window.addEventListener(HENRYCO_OPEN_PREFERENCES_EVENT, handleOpen);
    return () => window.removeEventListener(HENRYCO_OPEN_PREFERENCES_EVENT, handleOpen);
  }, []);

  const lastUpdated = useMemo(() => {
    if (!consent.updatedAt) return copy.panel.lastUpdatedNever;
    const date = new Date(consent.updatedAt);
    if (Number.isNaN(date.getTime())) return consent.updatedAt;
    const localeTag: Record<string, string> = {
      en: "en-NG", fr: "fr-FR", ig: "en-NG", yo: "en-NG", ha: "en-NG",
      ar: "ar-EG", es: "es-ES", pt: "pt-BR", de: "de-DE", it: "it-IT", zh: "zh-CN", hi: "hi-IN",
    };
    return `${copy.panel.lastUpdated}: ${date.toLocaleDateString(localeTag[initialLocale] || "en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })}`;
  }, [consent.updatedAt, copy.panel.lastUpdated, copy.panel.lastUpdatedNever, initialLocale]);

  const localeOptions = useMemo(() => {
    if (isPublicSelectorLocale(localeChoice)) return PUBLIC_SELECTOR_LOCALES;
    return [localeChoice, ...PUBLIC_SELECTOR_LOCALES.filter((code) => code !== localeChoice)];
  }, [localeChoice]);

  function getLocaleOptionLabel(locale: AppLocale) {
    const base = getLocaleDisplayLabel(locale);
    return isPublicSelectorLocale(locale) ? base : `${base} - Scaffold`;
  }

  async function persistLocale(locale: AppLocale) {
    try {
      await fetch(localeApiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
    } catch {
      /* non-fatal */
    }
  }

  function save(next: Omit<ConsentState, "updatedAt">) {
    const payload: ConsentState = {
      ...next,
      essential: true,
      updatedAt: new Date().toISOString(),
    };
    setConsent(payload);
    if (typeof window !== "undefined") {
      persistConsent(payload, window.location.hostname);
    }
    setShowBanner(false);
    setShowPanel(false);
    void persistLocale(localeChoice);
  }

  if (!ready) return null;

  const accentStyle = { ["--accent" as string]: "#C9A227" } as React.CSSProperties;
  const rtlDir = isRtlLocale(localeChoice) ? "rtl" : "ltr";

  return (
    <div style={accentStyle} dir={rtlDir}>
      {showBanner ? (
        <div className="fixed inset-x-0 bottom-4 z-[70] mx-auto w-[min(100%-1.5rem,960px)] rounded-[2rem] border border-white/10 bg-[#050816]/94 p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-2xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
                <ShieldCheck className="h-4 w-4" />
                {copy.banner.eyebrow}
              </div>
              <div className="mt-3 text-lg font-semibold text-white">{copy.banner.title}</div>
              <div className="mt-2 text-sm leading-7 text-white/66">{copy.banner.body}</div>
              <div className="mt-4 grid gap-2 sm:max-w-xs">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
                  {copy.language.label}
                </label>
                <select
                  value={localeChoice}
                  onChange={(e) => setLocaleChoice(normalizeLocale(e.target.value) as AppLocale)}
                  dir="auto"
                  className="h-11 rounded-xl border border-white/12 bg-black/30 px-3 text-sm text-white outline-none"
                >
                  {localeOptions.map((code) => (
                    <option key={code} value={code} dir="auto" className="bg-[#0B1020] text-white">
                      {getLocaleOptionLabel(code)}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-white/48">{copy.language.hint}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  save({
                    essential: true,
                    preferences: false,
                    analytics: false,
                    marketing: false,
                    personalizedExperience: false,
                  })
                }
                className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white"
              >
                {copy.banner.essentialOnly}
              </button>
              <button
                type="button"
                onClick={() => setShowPanel(true)}
                className="rounded-full border border-[color:var(--accent)]/20 bg-[color:var(--accent)]/10 px-4 py-3 text-sm font-semibold text-[color:var(--accent)]"
              >
                {copy.banner.customize}
              </button>
              <button
                type="button"
                onClick={() =>
                  save({
                    essential: true,
                    preferences: true,
                    analytics: true,
                    marketing: true,
                    personalizedExperience: true,
                  })
                }
                className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-black"
              >
                {copy.banner.acceptAll}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setShowPanel(true)}
        className="fixed bottom-5 left-5 z-[65] rounded-full border border-white/10 bg-[#050816]/88 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/78 shadow-[0_16px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl"
      >
        {copy.fab}
      </button>

      {showPanel ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/58 p-4 sm:items-center">
          <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#050816] p-6 text-white shadow-[0_36px_120px_rgba(0,0,0,0.34)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
                  {copy.panel.eyebrow}
                </div>
                <div className="mt-2 text-2xl font-bold tracking-[-0.04em] text-white">{copy.panel.title}</div>
                <div className="mt-2 text-sm leading-7 text-white/62">{lastUpdated}</div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowPanel(false);
                  if (!consent.updatedAt) setShowBanner(true);
                }}
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white"
              >
                {copy.panel.close}
              </button>
            </div>

            <div className="mt-4 grid gap-2 sm:max-w-xs">
              <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
                {copy.language.label}
              </label>
              <select
                value={localeChoice}
                onChange={(e) => setLocaleChoice(normalizeLocale(e.target.value) as AppLocale)}
                dir="auto"
                className="h-11 rounded-xl border border-white/12 bg-black/30 px-3 text-sm text-white outline-none"
              >
                  {localeOptions.map((code) => (
                    <option key={code} value={code} dir="auto" className="bg-[#0B1020] text-white">
                      {getLocaleOptionLabel(code)}
                    </option>
                  ))}
              </select>
            </div>

            <div className="mt-6 grid gap-4">
              <PreferenceRow
                title={copy.panel.essential.title}
                description={copy.panel.essential.description}
                checked
                disabled
                onChange={() => undefined}
              />
              <PreferenceRow
                title={copy.panel.preferences.title}
                description={copy.panel.preferences.description}
                checked={consent.preferences}
                onChange={(checked) => setConsent((c) => ({ ...c, preferences: checked }))}
              />
              <PreferenceRow
                title={copy.panel.personalized.title}
                description={copy.panel.personalized.description}
                checked={consent.personalizedExperience}
                onChange={(checked) =>
                  setConsent((c) => ({ ...c, personalizedExperience: checked }))
                }
              />
              <PreferenceRow
                title={copy.panel.analytics.title}
                description={copy.panel.analytics.description}
                checked={consent.analytics}
                onChange={(checked) => setConsent((c) => ({ ...c, analytics: checked }))}
              />
              <PreferenceRow
                title={copy.panel.marketing.title}
                description={copy.panel.marketing.description}
                checked={consent.marketing}
                onChange={(checked) => setConsent((c) => ({ ...c, marketing: checked }))}
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  save({
                    essential: true,
                    preferences: false,
                    analytics: false,
                    marketing: false,
                    personalizedExperience: false,
                  })
                }
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white"
              >
                {copy.panel.keepEssential}
              </button>
              <button
                type="button"
                onClick={() =>
                  save({
                    essential: true,
                    preferences: consent.preferences,
                    analytics: consent.analytics,
                    marketing: consent.marketing,
                    personalizedExperience: consent.personalizedExperience,
                  })
                }
                className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-black"
              >
                {copy.panel.save}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PreferenceRow({
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
    <label className="flex items-start justify-between gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
      <div>
        <div className="text-lg font-semibold text-white">{title}</div>
        <div className="mt-2 text-sm leading-7 text-white/66">{description}</div>
      </div>

      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-5 w-5 rounded border-white/20 accent-[color:var(--accent)]"
      />
    </label>
  );
}
