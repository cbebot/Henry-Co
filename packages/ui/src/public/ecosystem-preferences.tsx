"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { getSharedCookieDomain } from "@henryco/config";
import {
  getLocaleDisplayLabel,
  getUserSelectableLocales,
  isPublicSelectorLocale,
  normalizeLocale,
  isRtlLocale,
  type AppLocale,
  type EcosystemConsentCopy,
} from "@henryco/i18n";
import { ShieldCheck, X } from "lucide-react";

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

  const localeOptions = useMemo(() => getUserSelectableLocales(localeChoice), [localeChoice]);

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

  const closePanel = useCallback(() => {
    setShowPanel(false);
    if (!consent.updatedAt) setShowBanner(true);
  }, [consent.updatedAt]);

  useEffect(() => {
    if (!showPanel) return undefined;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closePanel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closePanel, showPanel]);

  if (!ready) return null;

  const accentStyle = { ["--accent" as string]: "#C9A227" } as CSSProperties;
  const rtlDir = isRtlLocale(localeChoice) ? "rtl" : "ltr";

  return (
    <div style={accentStyle} dir={rtlDir}>
      {showBanner ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] px-3 pb-[max(env(safe-area-inset-bottom,0px),0.875rem)] sm:px-5">
          <div className="pointer-events-auto mx-auto w-full max-w-4xl rounded-2xl border border-zinc-200/90 bg-white/95 p-3.5 text-zinc-950 shadow-[0_22px_70px_-36px_rgba(0,0,0,0.58)] backdrop-blur-2xl dark:border-white/12 dark:bg-[#0b1018]/95 dark:text-white sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-[color:var(--accent)]">
                <ShieldCheck className="h-4 w-4" />
                {copy.banner.eyebrow}
              </div>
                <div className="mt-2 text-base font-semibold text-zinc-950 dark:text-white">{copy.banner.title}</div>
                <div className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-white/66">{copy.banner.body}</div>
                <div className="mt-3 grid gap-2 sm:max-w-xs">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
                  {copy.language.label}
                </label>
                <select
                  value={localeChoice}
                  onChange={(e) => setLocaleChoice(normalizeLocale(e.target.value) as AppLocale)}
                  dir="auto"
                    className="h-10 rounded-xl border border-zinc-200/90 bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 dark:border-white/12 dark:bg-black/25 dark:text-white"
                >
                  {localeOptions.map((code) => (
                    <option key={code} value={code} dir="auto" className="bg-[#0B1020] text-white">
                      {getLocaleOptionLabel(code)}
                    </option>
                  ))}
                </select>
                  <p className="text-xs text-zinc-500 dark:text-white/48">{copy.language.hint}</p>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2.5">
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
                  className="rounded-full border border-zinc-200/90 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:border-white/12 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08]"
              >
                {copy.banner.essentialOnly}
              </button>
              <button
                type="button"
                onClick={() => setShowPanel(true)}
                  className="rounded-full border border-amber-500/25 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-500/15 dark:border-[color:var(--accent)]/25 dark:text-[color:var(--accent)]"
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
                  className="rounded-full bg-[color:var(--accent)] px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-105"
              >
                {copy.banner.acceptAll}
              </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showPanel ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/35 px-3 pb-[max(env(safe-area-inset-bottom,0px),0.75rem)] pt-6 backdrop-blur-[2px] sm:items-end sm:justify-start sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="henryco-privacy-panel-title"
          onClick={closePanel}
        >
          <div
            className="max-h-[min(82vh,42rem)] w-full overflow-y-auto rounded-2xl border border-zinc-200/90 bg-white p-4 text-zinc-950 shadow-[0_30px_90px_-42px_rgba(0,0,0,0.65)] outline-none dark:border-white/12 dark:bg-[#0b1018] dark:text-white sm:max-w-[27rem] sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-[color:var(--accent)]">
                  {copy.panel.eyebrow}
                </div>
                <div id="henryco-privacy-panel-title" className="mt-1.5 text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
                  {copy.panel.title}
                </div>
                <div className="mt-1 text-xs leading-5 text-zinc-500 dark:text-white/55">{lastUpdated}</div>
              </div>

              <button
                type="button"
                onClick={closePanel}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200/90 bg-zinc-50 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 focus:outline-none focus:ring-2 focus:ring-amber-500/30 dark:border-white/12 dark:bg-white/[0.04] dark:text-white/70 dark:hover:bg-white/[0.08] dark:hover:text-white"
                aria-label={copy.panel.close}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid gap-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
                {copy.language.label}
              </label>
              <select
                value={localeChoice}
                onChange={(e) => setLocaleChoice(normalizeLocale(e.target.value) as AppLocale)}
                dir="auto"
                className="h-10 rounded-xl border border-zinc-200/90 bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 dark:border-white/12 dark:bg-black/25 dark:text-white"
              >
                  {localeOptions.map((code) => (
                    <option key={code} value={code} dir="auto" className="bg-[#0B1020] text-white">
                      {getLocaleOptionLabel(code)}
                    </option>
                  ))}
              </select>
            </div>

            <div className="mt-4 grid gap-2.5">
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

            <div className="mt-5 flex flex-wrap justify-end gap-2.5">
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
                className="rounded-full border border-zinc-200/90 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:border-white/12 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08]"
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
                className="rounded-full bg-[color:var(--accent)] px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-105"
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
    <label
      className={[
        "flex items-start justify-between gap-3 rounded-xl border p-3.5 transition",
        disabled
          ? "cursor-default border-zinc-200/80 bg-zinc-50/80 dark:border-white/8 dark:bg-white/[0.025]"
          : "cursor-pointer border-zinc-200/90 bg-white hover:border-zinc-300 hover:bg-zinc-50 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-white/16 dark:hover:bg-white/[0.07]",
      ].join(" ")}
    >
      <div className="min-w-0">
        <div className="text-sm font-semibold text-zinc-950 dark:text-white">{title}</div>
        <div className="mt-1 text-xs leading-5 text-zinc-600 dark:text-white/60">{description}</div>
      </div>

      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 accent-[color:var(--accent)] focus:ring-2 focus:ring-amber-500/20 dark:border-white/20"
      />
    </label>
  );
}
