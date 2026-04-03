"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";

type ConsentState = {
  essential: true;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

const STORAGE_KEY = "henryco-care-cookie-consent";
const COOKIE_KEY = "henryco_care_cookie_consent";
const OPEN_EVENT = "henryco-care:open-cookie-preferences";

const DEFAULT_CONSENT: ConsentState = {
  essential: true,
  preferences: false,
  analytics: false,
  marketing: false,
  updatedAt: "",
};

function persistConsent(value: ConsentState) {
  const serialized = JSON.stringify(value);
  window.localStorage.setItem(STORAGE_KEY, serialized);
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(serialized)}; path=/; max-age=31536000; samesite=lax`;
}

function readCookie(name: string) {
  const prefix = `${name}=`;
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);
}

export default function CookiePreferences() {
  const [ready, setReady] = useState(false);
  const [consent, setConsent] = useState<ConsentState>(DEFAULT_CONSENT);
  const [showBanner, setShowBanner] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    try {
      const local = window.localStorage.getItem(STORAGE_KEY);
      const cookie = readCookie(COOKIE_KEY);
      const raw = local || (cookie ? decodeURIComponent(cookie) : "");

      if (!raw) {
        setShowBanner(true);
        setReady(true);
        return;
      }

      const parsed = JSON.parse(raw) as Partial<ConsentState>;
      setConsent({
        essential: true,
        preferences: Boolean(parsed.preferences),
        analytics: Boolean(parsed.analytics),
        marketing: Boolean(parsed.marketing),
        updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
      });
    } catch {
      setShowBanner(true);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    function handleOpen() {
      setShowPanel(true);
    }

    window.addEventListener(OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_EVENT, handleOpen);
  }, []);

  const lastUpdated = useMemo(() => {
    if (!consent.updatedAt) return "Not yet saved";
    const date = new Date(consent.updatedAt);
    if (Number.isNaN(date.getTime())) return consent.updatedAt;
    return date.toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, [consent.updatedAt]);

  function save(next: Omit<ConsentState, "updatedAt">) {
    const payload: ConsentState = {
      ...next,
      essential: true,
      updatedAt: new Date().toISOString(),
    };
    setConsent(payload);
    persistConsent(payload);
    setShowBanner(false);
    setShowPanel(false);
  }

  if (!ready) return null;

  return (
    <>
      {showBanner ? (
        <div className="fixed inset-x-0 bottom-4 z-[70] mx-auto w-[min(100%-1.5rem,960px)] rounded-[2rem] border border-white/10 bg-[#07111d]/94 p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-2xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
                <ShieldCheck className="h-4 w-4" />
                Cookie preferences
              </div>
              <div className="mt-3 text-lg font-semibold text-white">
                Choose how this device stores preference and measurement settings.
              </div>
              <div className="mt-2 text-sm leading-7 text-white/66">
                Essential cookies keep booking, tracking, session security, and theme behavior
                working. Optional categories help HenryCo Care remember preferences and measure
                friction without making the experience feel noisy.
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
                  })
                }
                className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white"
              >
                Essential only
              </button>
              <button
                type="button"
                onClick={() => setShowPanel(true)}
                className="rounded-full border border-[color:var(--accent)]/20 bg-[color:var(--accent)]/10 px-4 py-3 text-sm font-semibold text-[color:var(--accent)]"
              >
                Customize
              </button>
              <button
                type="button"
                onClick={() =>
                  save({
                    essential: true,
                    preferences: true,
                    analytics: true,
                    marketing: true,
                  })
                }
                className="care-button-primary rounded-full px-5 py-3 text-sm font-semibold"
              >
                Accept all
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setShowPanel(true)}
        className="fixed bottom-5 left-5 z-[65] rounded-full border border-white/10 bg-[#07111d]/88 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/78 shadow-[0_16px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl"
      >
        Privacy
      </button>

      {showPanel ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/58 p-4 sm:items-center">
          <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#06101a] p-6 text-white shadow-[0_36px_120px_rgba(0,0,0,0.34)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
                  Privacy controls
                </div>
                <div className="mt-2 text-2xl font-bold tracking-[-0.04em] text-white">
                  Review privacy preferences for this device
                </div>
                <div className="mt-2 text-sm leading-7 text-white/62">
                  Last updated: {lastUpdated}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowPanel(false);
                  if (!consent.updatedAt) setShowBanner(true);
                }}
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <PreferenceRow
                title="Essential"
                description="Required for booking forms, security, session integrity, and core navigation."
                checked
                disabled
                onChange={() => undefined}
              />
              <PreferenceRow
                title="Preferences"
                description="Stores layout and experience choices so the product feels consistent between visits."
                checked={consent.preferences}
                onChange={(checked) => setConsent((current) => ({ ...current, preferences: checked }))}
              />
              <PreferenceRow
                title="Analytics"
                description="Measures service demand, page quality, and booking friction so the product can improve."
                checked={consent.analytics}
                onChange={(checked) => setConsent((current) => ({ ...current, analytics: checked }))}
              />
              <PreferenceRow
                title="Marketing"
                description="Allows remarketing or outreach touchpoints when those programs are enabled."
                checked={consent.marketing}
                onChange={(checked) => setConsent((current) => ({ ...current, marketing: checked }))}
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
                  })
                }
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white"
              >
                Keep essential only
              </button>
              <button
                type="button"
                onClick={() =>
                  save({
                    essential: true,
                    preferences: consent.preferences,
                    analytics: consent.analytics,
                    marketing: consent.marketing,
                  })
                }
                className="care-button-primary rounded-full px-5 py-3 text-sm font-semibold"
              >
                Save preferences
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
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
