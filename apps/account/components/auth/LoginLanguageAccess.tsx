"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import {
  getConsentCopy,
  getLocaleDisplayLabel,
  getUserSelectableLocales,
  isPublicSelectorLocale,
  type AppLocale,
} from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";

export default function LoginLanguageAccess({ initialLocale }: { initialLocale: AppLocale }) {
  const locale = useHenryCoLocale();
  const copy = getConsentCopy(locale);
  const [selectedLocale, setSelectedLocale] = useState<AppLocale>(initialLocale);
  const [pending, setPending] = useState(false);
  const localeOptions = getUserSelectableLocales(initialLocale);

  async function handleChange(nextLocale: AppLocale) {
    setSelectedLocale(nextLocale);
    setPending(true);

    try {
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: nextLocale }),
      });
    } finally {
      window.location.reload();
    }
  }

  return (
    <div className="mb-6 flex justify-center">
      <label className="inline-flex items-center gap-3 rounded-full border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] px-4 py-2.5 text-sm text-[var(--acct-muted)]">
        <Globe className="h-4 w-4 text-[var(--acct-gold)]" />
        <span className="font-medium text-[var(--acct-ink)]">{copy.language.label}</span>
        <select
          value={selectedLocale}
          onChange={(event) => void handleChange(event.target.value as AppLocale)}
          disabled={pending}
          aria-label={copy.language.label}
          dir="auto"
          className="bg-transparent text-[var(--acct-ink)] outline-none"
        >
          {localeOptions.map((code) => (
            <option key={code} value={code} dir="auto">
              {isPublicSelectorLocale(code) ? getLocaleDisplayLabel(code) : `${getLocaleDisplayLabel(code)} - Scaffold`}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
