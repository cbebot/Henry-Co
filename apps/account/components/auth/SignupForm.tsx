"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ButtonPendingContent } from "@henryco/ui";
import { formatSurfaceTemplate, getActiveCountries, getAuthCopy, getSurfaceCopy } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { normalizeTrustedRedirect } from "@henryco/config";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { mapAccountAuthMessage } from "@/lib/auth-copy";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";

const COUNTRIES = getActiveCountries().map((country) => ({
  code: country.code,
  name: country.name,
  dial: country.phonePrefix,
  currency: country.currencyCode,
  timezone: country.timezone,
}));

function buildLoginHref(next: string | null) {
  const safeNext = normalizeTrustedRedirect(next);
  return safeNext === "/" ? "/login" : `/login?next=${encodeURIComponent(safeNext)}`;
}

export default function SignupForm() {
  const locale = useHenryCoLocale();
  const authCopy = getAuthCopy(locale);
  const surfaceCopy = getSurfaceCopy(locale);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [country, setCountry] = useState("NG");
  const [phone, setPhone] = useState("");
  const [contactPref, setContactPref] = useState("email");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const selectedCountry = COUNTRIES.find((c) => c.code === country);
  const CONTACT_PREFS = [
    { value: "email", label: surfaceCopy.accountForms.contactEmail },
    { value: "whatsapp", label: surfaceCopy.accountForms.contactWhatsapp },
    { value: "phone", label: surfaceCopy.accountForms.contactPhone },
    { value: "in_app", label: surfaceCopy.accountForms.contactInApp },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) { setError(surfaceCopy.accountForms.fullNameRequired); return; }
    if (!email.trim()) { setError(surfaceCopy.accountForms.emailRequired); return; }
    if (password.length < 8) { setError(authCopy.errors.passwordTooShort); return; }
    if (password !== confirmPassword) { setError(surfaceCopy.accountForms.passwordsDoNotMatch); return; }
    if (!termsAccepted) { setError(surfaceCopy.accountForms.acceptTermsRequired); return; }

    setLoading(true);
    try {
      const supabase = createSupabaseBrowser();
      const fullPhone = phone.trim() ? `${selectedCountry?.dial || ""}${phone.trim().replace(/^0+/, "")}` : null;

      const { error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            country,
            phone: fullPhone,
            contact_preference: contactPref,
            currency: selectedCountry?.currency || "NGN",
            timezone: selectedCountry?.timezone || "Africa/Lagos",
          },
        },
      });

      if (authError) { setError(mapAccountAuthMessage(authError.message, "sign_up", locale)); return; }
      setSuccess(true);
    } catch {
      setError(surfaceCopy.accountForms.createAccountUnavailable);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="acct-card p-6 text-center sm:p-8 acct-fade-in">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--acct-green-soft)]">
          <CheckCircle2 size={24} className="text-[var(--acct-green)]" />
        </div>
        <h2 className="text-lg font-semibold">{surfaceCopy.accountForms.checkEmailTitle}</h2>
        <p className="mt-2 text-sm text-[var(--acct-muted)]">
          {formatSurfaceTemplate(surfaceCopy.accountForms.verificationSent, { email })}
        </p>
        <button onClick={() => router.push(buildLoginHref(next))} className="acct-button-secondary mt-4">
          {surfaceCopy.accountForms.backToSignIn}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="acct-card p-6 sm:p-8 acct-fade-in">
      {error && (
        <div className="mb-4 rounded-xl bg-[var(--acct-red-soft)] px-4 py-3 text-sm text-[var(--acct-red)]">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">{authCopy.signup.fullNameLabel}</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="acct-input"
            placeholder={surfaceCopy.accountForms.fullNamePlaceholder}
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">{authCopy.signup.emailLabel}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="acct-input"
            placeholder={surfaceCopy.accountForms.emailPlaceholder}
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">{authCopy.signup.passwordLabel}</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="acct-input pr-10"
              placeholder={surfaceCopy.accountForms.minPasswordPlaceholder}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--acct-muted)]"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">{authCopy.signup.confirmPasswordLabel}</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="acct-input pr-10"
              placeholder={surfaceCopy.accountForms.confirmPasswordPlaceholder}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--acct-muted)]"
              aria-label={showPassword ? surfaceCopy.accountForms.hidePasswords : surfaceCopy.accountForms.showPasswords}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">{surfaceCopy.accountForms.countryLabel}</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="acct-select"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">{surfaceCopy.accountForms.phoneLabel}</label>
            <div className="flex gap-2">
              <span className="flex items-center rounded-l-[var(--acct-radius)] border border-r-0 border-[var(--acct-line)] bg-[var(--acct-surface)] px-3 text-sm text-[var(--acct-muted)]">
                {selectedCountry?.dial}
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                className="acct-input rounded-l-none"
                placeholder={surfaceCopy.accountForms.phonePlaceholder}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg)] px-4 py-3 text-xs leading-relaxed text-[var(--acct-muted)]">
          {selectedCountry?.currency === "NGN"
            ? surfaceCopy.accountForms.regionalDefaultsLocal
            : formatSurfaceTemplate(surfaceCopy.accountForms.regionalDefaultsNgnOnly, {
                currency: selectedCountry?.currency || "NGN",
              })}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">{surfaceCopy.accountForms.preferredContactLabel}</label>
          <div className="grid grid-cols-2 gap-2">
            {CONTACT_PREFS.map((pref) => (
              <button
                key={pref.value}
                type="button"
                onClick={() => setContactPref(pref.value)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                  contactPref === pref.value
                    ? "border-[var(--acct-gold)] bg-[var(--acct-gold-soft)] text-[var(--acct-gold)]"
                    : "border-[var(--acct-line)] bg-[var(--acct-bg)] text-[var(--acct-muted)] hover:border-[var(--acct-gold)]/40"
                }`}
              >
                {pref.label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-[var(--acct-line)] accent-[var(--acct-gold)]"
          />
          <span className="text-xs leading-relaxed text-[var(--acct-muted)]">
            {surfaceCopy.accountForms.termsAgreementStart}{" "}
            <a href="https://henrycogroup.com/terms" className="text-[var(--acct-gold)] hover:underline" target="_blank" rel="noopener">
              {surfaceCopy.accountForms.termsLink}
            </a>{" "}
            {surfaceCopy.accountForms.termsAgreementMiddle}{" "}
            <a href="https://henrycogroup.com/privacy" className="text-[var(--acct-gold)] hover:underline" target="_blank" rel="noopener">
              {surfaceCopy.accountForms.privacyLink}
            </a>
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="acct-button-primary mt-6 w-full rounded-xl py-3"
      >
        <ButtonPendingContent pending={loading} pendingLabel={surfaceCopy.accountForms.createAccountBusy} spinnerLabel={authCopy.signup.submitButton}>
          {authCopy.signup.submitButton}
        </ButtonPendingContent>
      </button>
    </form>
  );
}
