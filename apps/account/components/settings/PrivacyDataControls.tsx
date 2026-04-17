"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, ShieldCheck, Trash2 } from "lucide-react";
import { formatSurfaceTemplate, getSurfaceCopy } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import {
  buildHenryCoConsentState,
  DEFAULT_HENRYCO_CONSENT,
  persistHenryCoConsent,
  readStoredHenryCoConsent,
  type HenryCoConsentState,
} from "@henryco/ui/public";

function buildSupportPrefill(subject: string, message: string) {
  const params = new URLSearchParams({
    category: "account",
    subject,
    message,
  });
  return `/support/new?${params.toString()}`;
}

function Toggle({
  label,
  description,
  checked,
  disabled = false,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
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
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-[var(--acct-gold)]" : "bg-[var(--acct-line)]"
        } ${disabled ? "opacity-60" : ""}`}
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

export default function PrivacyDataControls() {
  const locale = useHenryCoLocale();
  const copy = getSurfaceCopy(locale);
  // Lazy initializer: readStoredHenryCoConsent() returns null in SSR (isBrowser guard),
  // so server and initial client render both start from DEFAULT. Any stored consent is
  // picked up immediately on client before first paint — no useEffect cascade needed.
  const [consent, setConsent] = useState<HenryCoConsentState>(
    () => readStoredHenryCoConsent() ?? DEFAULT_HENRYCO_CONSENT
  );
  const [saved, setSaved] = useState(false);

  const lastUpdated = useMemo(() => {
    if (!consent.updatedAt) return copy.privacyControls.notYetSaved;

    const date = new Date(consent.updatedAt);
    if (Number.isNaN(date.getTime())) return consent.updatedAt;

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, [consent.updatedAt, copy.privacyControls.notYetSaved]);

  function saveConsent() {
    const nextConsent = buildHenryCoConsentState({
      ...consent,
      updatedAt: new Date().toISOString(),
    });
    setConsent(nextConsent);
    if (typeof window !== "undefined") {
      persistHenryCoConsent(nextConsent, window.location.hostname);
    }
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2400);
  }

  return (
    <section
      id="privacy-controls"
      className="acct-card space-y-4 p-5 scroll-mt-28"
      aria-labelledby="privacy-controls-title"
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--acct-gold-soft)] text-[var(--acct-gold)]">
          <ShieldCheck size={18} />
        </div>
        <div>
          <p className="acct-kicker">{copy.privacyControls.kicker}</p>
          <h2 id="privacy-controls-title" className="mt-1 text-lg font-semibold text-[var(--acct-ink)]">
            {copy.privacyControls.title}
          </h2>
          <p className="mt-2 text-sm leading-7 text-[var(--acct-muted)]">
            {copy.privacyControls.description}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--acct-muted)]">
            {formatSurfaceTemplate(copy.privacyControls.lastSaved, { date: lastUpdated })}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Toggle
          label={copy.privacyControls.essentialLabel}
          description={copy.privacyControls.essentialDescription}
          checked
          disabled
          onChange={() => undefined}
        />
        <Toggle
          label={copy.privacyControls.preferencesLabel}
          description={copy.privacyControls.preferencesDescription}
          checked={consent.preferences}
          onChange={(value) => setConsent((current) => ({ ...current, preferences: value }))}
        />
        <Toggle
          label={copy.privacyControls.personalizedExperienceLabel}
          description={copy.privacyControls.personalizedExperienceDescription}
          checked={consent.personalizedExperience}
          onChange={(value) =>
            setConsent((current) => ({ ...current, personalizedExperience: value }))
          }
        />
        <Toggle
          label={copy.privacyControls.analyticsLabel}
          description={copy.privacyControls.analyticsDescription}
          checked={consent.analytics}
          onChange={(value) => setConsent((current) => ({ ...current, analytics: value }))}
        />
        <Toggle
          label={copy.privacyControls.marketingLabel}
          description={copy.privacyControls.marketingDescription}
          checked={consent.marketing}
          onChange={(value) => setConsent((current) => ({ ...current, marketing: value }))}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={saveConsent} className="acct-button-primary rounded-xl">
          {saved ? copy.privacyControls.saved : copy.privacyControls.save}
        </button>
        <button
          type="button"
          onClick={() => {
            const essentialOnly = buildHenryCoConsentState({
              updatedAt: new Date().toISOString(),
            });
            setConsent(essentialOnly);
            if (typeof window !== "undefined") {
              persistHenryCoConsent(essentialOnly, window.location.hostname);
            }
          }}
          className="rounded-xl border border-[var(--acct-line)] px-4 py-2 text-sm font-semibold text-[var(--acct-ink)] transition-colors hover:bg-[var(--acct-surface)]"
        >
          {copy.privacyControls.essentialOnly}
        </button>
      </div>

      <div className="rounded-[1.4rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-4">
        <p className="text-sm font-semibold text-[var(--acct-ink)]">{copy.privacyControls.manualRequestsTitle}</p>
        <p className="mt-2 text-sm leading-7 text-[var(--acct-muted)]">
          {copy.privacyControls.manualRequestsBody}
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={buildSupportPrefill(
              copy.privacyControls.exportSubject,
              copy.privacyControls.exportMessage
            )}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--acct-line)] bg-[var(--acct-surface)] px-4 py-2 text-sm font-semibold text-[var(--acct-ink)] transition-colors hover:bg-[var(--acct-bg)]"
          >
            <Download size={16} />
            {copy.privacyControls.requestDataExport}
          </Link>
          <Link
            href={buildSupportPrefill(
              copy.privacyControls.deletionSubject,
              copy.privacyControls.deletionMessage
            )}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--acct-line)] bg-[var(--acct-surface)] px-4 py-2 text-sm font-semibold text-[var(--acct-ink)] transition-colors hover:bg-[var(--acct-bg)]"
          >
            <Trash2 size={16} />
            {copy.privacyControls.requestDeletionReview}
          </Link>
        </div>
      </div>
    </section>
  );
}
