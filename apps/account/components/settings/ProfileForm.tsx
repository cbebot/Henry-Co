"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatSurfaceTemplate, getSurfaceCopy, translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { ButtonPendingContent, HenryCoActivityIndicator } from "@henryco/ui";
import {
  getActiveCountries,
  getCountry,
  getLocaleDisplayLabel,
  getUserSelectableLocales,
  isPublicSelectorLocale,
  normalizeLocale,
  type AppLocale,
} from "@henryco/i18n";
import { Camera } from "lucide-react";
import UserAvatar from "@/components/layout/UserAvatar";

const COUNTRIES = getActiveCountries().map((country) => ({
  code: country.code,
  name: country.name,
  currency: country.currencyCode,
  timezone: country.timezone,
  availability: country.availability,
}));

const CONTACT_PREFS = [
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "phone", label: "Phone" },
  { value: "in_app", label: "In-app" },
];

type Props = {
  profile: Record<string, string | null> | null;
  email: string | null;
  effectiveLocale: AppLocale;
};

export default function ProfileForm({ profile, email, effectiveLocale }: Props) {
  const locale = useHenryCoLocale();
  const surfaceCopy = getSurfaceCopy(locale);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const profileLanguage = profile?.language ? normalizeLocale(profile.language) : null;
  const currentLanguage = normalizeLocale(effectiveLocale);
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [country, setCountry] = useState(profile?.country || "NG");
  const [contactPref, setContactPref] = useState(profile?.contact_preference || "email");
  // Initialize from the server-resolved effective locale (cookie > profile > accept-language > default).
  // profileLanguage is only consulted for selector options, not the initial selection.
  const [language, setLanguage] = useState(currentLanguage);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const selectedCountry = getCountry(country) || getCountry("NG")!;
  const selectedAvailability = selectedCountry.availability;
  const languageOptions = getUserSelectableLocales(currentLanguage, profileLanguage).map((localeOption) => ({
    value: localeOption,
    label: isPublicSelectorLocale(localeOption)
      ? getLocaleDisplayLabel(localeOption)
      : `${getLocaleDisplayLabel(localeOption)} - Scaffold`,
  }));

  useEffect(() => {
    setFullName(profile?.full_name || "");
    setPhone(profile?.phone || "");
    setCountry(profile?.country || "NG");
    setContactPref(profile?.contact_preference || "email");
    setLanguage(currentLanguage);
    setAvatarUrl(profile?.avatar_url || "");
  }, [
    currentLanguage,
    profile?.avatar_url,
    profile?.contact_preference,
    profile?.country,
    profile?.full_name,
    profile?.phone,
    profileLanguage,
  ]);

  function localizeProfileError(message: string) {
    switch (message) {
      case "Unauthorized":
        return t("Please sign in to continue.");
      case "Upload failed":
      case "No file provided":
        return t("Upload failed");
      case "We couldn’t save your changes. Please try again.":
      case "We couldn't save your changes. Please try again.":
        return t("We couldn’t save your changes. Please try again.");
      default:
        return t(message);
    }
  }

  const availabilityLabel =
    selectedAvailability === "active"
      ? t("Active")
      : selectedAvailability === "limited"
        ? t("Limited")
        : selectedAvailability === "coming_soon"
          ? t("Coming soon")
          : selectedAvailability === "language_only"
            ? t("Language only")
            : t("Unavailable");

  const availabilityNotes =
    selectedAvailability === "active"
      ? [t("Services may vary by region.")]
      : selectedAvailability === "limited"
        ? [
            t("Services may vary by region."),
            t("Some HenryCo divisions are not yet available in this country."),
          ]
        : selectedAvailability === "coming_soon"
          ? [
              t("Some HenryCo divisions are not yet available in this country."),
              t("Language preference does not guarantee local service availability."),
            ]
          : [
              t("Language preference does not guarantee local service availability."),
              t("Some HenryCo divisions are not yet available in this country."),
            ];

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    try {
      const form = new FormData();
      form.append("avatar", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setAvatarUrl(data.avatar_url);
      setMessage({ type: "success", text: t("Photo updated") });
      router.refresh();
    } catch (err: unknown) {
      setMessage({
        type: "error",
        text: err instanceof Error ? localizeProfileError(err.message) : t("Upload failed"),
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: phone.trim(),
          country,
          contact_preference: contactPref,
          language,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "We couldn’t save your changes. Please try again.");

      setMessage({ type: "success", text: t("Profile updated") });
      router.refresh();
    } catch (err: unknown) {
      setMessage({
        type: "error",
        text:
          err instanceof Error
            ? localizeProfileError(err.message)
            : t("We couldn’t save your changes. Please try again."),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-[var(--acct-green-soft)] text-[var(--acct-green)]"
              : "bg-[var(--acct-red-soft)] text-[var(--acct-red)]"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative">
          <UserAvatar
            name={fullName || email || "Account"}
            src={avatarUrl}
            size={80}
            roundedClassName="rounded-2xl"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--acct-gold)] text-white shadow-lg transition-transform hover:scale-110"
          >
            {uploading ? <HenryCoActivityIndicator size="sm" label={t("Uploading photo")} /> : <Camera size={14} />}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--acct-ink)]">{t("Profile photo")}</p>
          <p className="text-xs text-[var(--acct-muted)]">{t("JPG, PNG or WebP. Max 5 MB.")}</p>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">{t("Email")}</label>
        <input type="email" value={email || ""} disabled className="acct-input opacity-60" />
        <p className="mt-1 text-xs text-[var(--acct-muted)]">{t("Contact support to change your email")}</p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">{t("Full name")}</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="acct-input"
          placeholder={t("Your full name")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">{surfaceCopy.accountForms.countryLabel}</label>
          <select value={country} onChange={(e) => setCountry(e.target.value)} className="acct-select">
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">{surfaceCopy.accountForms.phoneLabel}</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="acct-input"
            placeholder="+234..."
          />
        </div>
      </div>

      <div className="rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg)] px-4 py-3 text-xs leading-relaxed text-[var(--acct-muted)]">
        <span className="font-semibold text-[var(--acct-ink)]">{t("Regional defaults")}:</span>{" "}
        {selectedCountry.name} · {selectedCountry.currencyCode} display · {selectedCountry.timezone}.
        {selectedCountry.currencyCode === "NGN"
          ? ` ${t("Wallet settlement also runs in NGN.")}`
          : ` ${formatSurfaceTemplate(surfaceCopy.accountForms.regionalDefaultsNgnOnly, {
              currency: selectedCountry.currencyCode,
            })}`}
      </div>

      <div className="rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg)] px-4 py-3 text-xs leading-relaxed text-[var(--acct-muted)]">
        <span className="font-semibold text-[var(--acct-ink)]">{t("Service availability")}:</span>{" "}
        {availabilityLabel}. {availabilityNotes.join(" ")}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">{t("Language")}</label>
        <select
          value={language}
          onChange={(e) => setLanguage(normalizeLocale(e.target.value) as AppLocale)}
          dir="auto"
          className="acct-select"
        >
          {languageOptions.map((languageOption) => (
            <option key={languageOption.value} value={languageOption.value} dir="auto">
              {languageOption.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-[var(--acct-muted)]">
          {t("Language preference does not guarantee local service availability.")}
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">{surfaceCopy.accountForms.preferredContactLabel}</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CONTACT_PREFS.map((pref) => (
            <button
              key={pref.value}
              type="button"
              onClick={() => setContactPref(pref.value)}
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                contactPref === pref.value
                  ? "border-[var(--acct-gold)] bg-[var(--acct-gold-soft)] text-[var(--acct-gold)]"
                  : "border-[var(--acct-line)] bg-[var(--acct-bg)] text-[var(--acct-muted)] hover:border-[var(--acct-gold)]/40"
              }`}
            >
              {t(pref.label)}
            </button>
          ))}
        </div>
      </div>

      <button type="submit" disabled={loading} className="acct-button-primary rounded-xl">
        <ButtonPendingContent pending={loading} pendingLabel={t("Saving profile...")} spinnerLabel={t("Saving profile...")}>
          {t("Save changes")}
        </ButtonPendingContent>
      </button>
    </form>
  );
}
