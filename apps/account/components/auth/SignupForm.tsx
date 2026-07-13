"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  formatSurfaceTemplate,
  getActiveCountries,
  getAuthCopy,
  getSurfaceCopy,
  translateSurfaceLabel,
} from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { henryWebRoot, normalizeTrustedRedirect } from "@henryco/config";
import { mapAccountAuthMessage } from "@/lib/auth-copy";
import { CheckCircle2, Mail, ShieldCheck, Sparkles } from "lucide-react";
import AuthField from "./AuthField";
import PasswordField from "./PasswordField";
import AuthSubmit from "./AuthSubmit";
import AuthErrorNotice from "./AuthErrorNotice";

/**
 * SignupForm — create-a-Henry-Onyx-account.
 *
 * Presentation runs through the shared auth primitives (AuthField /
 * PasswordField ×2 / AuthSubmit / AuthErrorNotice) and the auth.css register;
 * the bespoke fields (country / phone / contact preference / terms) are styled
 * with utilities keyed to the same --acct-* / gold tokens so they sit in the
 * same visual world as the primitives.
 *
 * The security spine is verbatim from the prior form: submission POSTs the
 * server route `/api/auth/signup` (which enforces the IP rate-limit — never a
 * client Supabase call); the `next` param is laundered through
 * normalizeTrustedRedirect (open-redirect guard) both for the login hand-off
 * and for the value handed to the server route; resend POSTs `/api/auth/resend`.
 * All field logic and every input attribute are unchanged. Errors go through
 * the stable mapAccountAuthMessage vocabulary.
 */

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

function buildSignupNext(next: string | null) {
  return normalizeTrustedRedirect(next);
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "cooldown">("idle");
  const [resendError, setResendError] = useState<string | null>(null);
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

  // Success-panel copy — these strings were hardcoded EN in the prior form and
  // are now localized through the sanctioned one-off path (translateSurfaceLabel).
  const stepInboxTitle = translateSurfaceLabel(locale, "Check your inbox.");
  const stepInboxBody = translateSurfaceLabel(
    locale,
    "The email is from Henry Onyx Accounts. If it isn’t in your inbox after a minute, look in spam or promotions.",
  );
  const stepVerifyTitle = translateSurfaceLabel(locale, "Tap “Verify my Henry Onyx account.”");
  const stepVerifyBody = translateSurfaceLabel(
    locale,
    "The link is single-use and expires after a short window for your security.",
  );
  const stepContinueTitle = translateSurfaceLabel(locale, "Continue to your Henry Onyx workspace.");
  const stepContinueBody = translateSurfaceLabel(
    locale,
    "We’ll route you to the right place across Care, Marketplace, Studio and more.",
  );
  const resendSentLabel = translateSurfaceLabel(locale, "Verification email sent again");
  const resendSendingLabel = translateSurfaceLabel(locale, "Sending verification email…");
  const resendLabel = translateSurfaceLabel(locale, "Resend verification email");
  const trustPill = translateSurfaceLabel(
    locale,
    "One secure Henry Onyx account works across every service.",
  );

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
      const fullPhone = phone.trim() ? `${selectedCountry?.dial || ""}${phone.trim().replace(/^0+/, "")}` : null;

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          fullName: fullName.trim(),
          country,
          phone: fullPhone,
          contactPreference: contactPref,
          currency: selectedCountry?.currency || "NGN",
          timezone: selectedCountry?.timezone || "Africa/Lagos",
          next: buildSignupNext(next),
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; message?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        setError(mapAccountAuthMessage(payload?.message, "sign_up", locale));
        return;
      }

      setSuccess(true);
    } catch {
      setError(surfaceCopy.accountForms.createAccountUnavailable);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendStatus === "sending" || resendStatus === "cooldown") return;
    setResendError(null);
    setResendStatus("sending");
    try {
      const response = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), next }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setResendError(payload?.error || surfaceCopy.accountForms.createAccountUnavailable);
        setResendStatus("idle");
        return;
      }
      setResendStatus("sent");
      // Soft cooldown so users can't spam-click; Supabase also rate-limits server-side.
      window.setTimeout(() => setResendStatus("idle"), 30_000);
    } catch {
      setResendError(surfaceCopy.accountForms.createAccountUnavailable);
      setResendStatus("idle");
    }
  };

  if (success) {
    const steps = [
      { title: stepInboxTitle, body: stepInboxBody },
      { title: stepVerifyTitle, body: stepVerifyBody },
      { title: stepContinueTitle, body: stepContinueBody },
    ];

    return (
      <div className="auth-rise">
        <div className="auth-success">
          <span className="auth-success-icon" aria-hidden>
            <Mail size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-base font-semibold leading-tight">
              {surfaceCopy.accountForms.checkEmailTitle}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed">
              {formatSurfaceTemplate(surfaceCopy.accountForms.verificationSent, { email })}
            </p>
          </div>
        </div>

        <ol className="mt-6 space-y-4 border-l border-[var(--acct-line)] pl-5 text-sm leading-relaxed text-[var(--acct-ink)]">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="-ml-[27px] mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--acct-gold-soft)] text-[10px] font-semibold text-[var(--gold-strong,#a88718)]">
                {index + 1}
              </span>
              <span>
                <strong className="font-semibold text-[var(--acct-ink)]">{step.title}</strong>{" "}
                <span className="text-[var(--acct-muted)]">{step.body}</span>
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row-reverse sm:items-center">
          <button
            type="button"
            onClick={() => router.push(buildLoginHref(next))}
            className="auth-submit sm:flex-1"
            style={{ marginTop: 0 }}
          >
            {surfaceCopy.accountForms.backToSignIn}
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendStatus === "sending" || resendStatus === "sent"}
            className="auth-provider sm:flex-1"
          >
            {resendStatus === "sent" ? (
              <>
                <CheckCircle2 size={15} aria-hidden />
                {resendSentLabel}
              </>
            ) : resendStatus === "sending" ? (
              resendSendingLabel
            ) : (
              <>
                <Sparkles size={15} aria-hidden />
                {resendLabel}
              </>
            )}
          </button>
        </div>
        {resendError ? (
          <p className="mt-3 text-xs text-[var(--acct-red-text,#b42318)]">{resendError}</p>
        ) : null}

        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--acct-line)] bg-[var(--acct-bg-soft,var(--acct-bg))] px-3 py-1.5 text-[11px] font-medium text-[var(--acct-muted)]">
          <ShieldCheck size={13} className="text-[var(--gold-strong,#a88718)]" aria-hidden />
          {trustPill}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="auth-stagger" noValidate>
      <AuthErrorNotice message={error} />

      <div className="auth-fieldset">
        <AuthField
          label={authCopy.signup.fullNameLabel}
          name="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder={surfaceCopy.accountForms.fullNamePlaceholder}
          autoComplete="name"
          required
          invalid={Boolean(error)}
        />

        <AuthField
          label={authCopy.signup.emailLabel}
          name="email"
          type="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={surfaceCopy.accountForms.emailPlaceholder}
          autoComplete="email"
          required
          invalid={Boolean(error)}
        />

        <PasswordField
          label={authCopy.signup.passwordLabel}
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={surfaceCopy.accountForms.minPasswordPlaceholder}
          autoComplete="new-password"
          minLength={8}
          required
          invalid={Boolean(error)}
          showLabel={authCopy.scene.showPassword}
          hideLabel={authCopy.scene.hidePassword}
        />

        <PasswordField
          label={authCopy.signup.confirmPasswordLabel}
          name="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={surfaceCopy.accountForms.confirmPasswordPlaceholder}
          autoComplete="new-password"
          minLength={8}
          required
          invalid={Boolean(error)}
          showLabel={authCopy.scene.showPassword}
          hideLabel={authCopy.scene.hidePassword}
        />

        <div className="grid gap-[1.05rem] sm:grid-cols-2">
          <div className="auth-field">
            <div className="auth-field-row">
              <label className="auth-label" htmlFor="country">
                {surfaceCopy.accountForms.countryLabel}
              </label>
            </div>
            <select
              id="country"
              className="auth-input"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="auth-field">
            <div className="auth-field-row">
              <label className="auth-label" htmlFor="phone">
                {surfaceCopy.accountForms.phoneLabel}
              </label>
            </div>
            <div className="flex">
              <span className="inline-flex items-center rounded-l-[0.9rem] border border-r-0 border-[var(--acct-line)] bg-[var(--acct-surface,var(--acct-bg-soft,var(--acct-bg)))] px-3 text-sm text-[var(--acct-muted)]">
                {selectedCountry?.dial}
              </span>
              <input
                id="phone"
                type="tel"
                name="phone"
                inputMode="tel"
                autoComplete="tel-national"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                className="auth-input rounded-l-none"
                placeholder={surfaceCopy.accountForms.phonePlaceholder}
              />
            </div>
          </div>
        </div>

        <p className="rounded-[0.9rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft,var(--acct-bg))] px-4 py-3 text-xs leading-relaxed text-[var(--acct-muted)]">
          {selectedCountry?.currency === "NGN"
            ? surfaceCopy.accountForms.regionalDefaultsLocal
            : formatSurfaceTemplate(surfaceCopy.accountForms.regionalDefaultsNgnOnly, {
                currency: selectedCountry?.currency || "NGN",
              })}
        </p>

        <div className="auth-field">
          <div className="auth-field-row">
            <span className="auth-label">{surfaceCopy.accountForms.preferredContactLabel}</span>
          </div>
          <div
            className="grid grid-cols-2 gap-2"
            role="group"
            aria-label={surfaceCopy.accountForms.preferredContactLabel}
          >
            {CONTACT_PREFS.map((pref) => {
              const active = contactPref === pref.value;
              return (
                <button
                  key={pref.value}
                  type="button"
                  onClick={() => setContactPref(pref.value)}
                  aria-pressed={active}
                  className={`rounded-[0.9rem] border px-3 py-2.5 text-sm font-medium transition-all ${
                    active
                      ? "border-[var(--gold,#c9a227)] bg-[var(--acct-gold-soft)] text-[var(--gold-strong,#a88718)]"
                      : "border-[var(--acct-line)] bg-[var(--acct-bg-soft,var(--acct-bg))] text-[var(--acct-muted)] hover:border-[color-mix(in_srgb,var(--acct-line)_40%,var(--acct-muted))]"
                  }`}
                >
                  {pref.label}
                </button>
              );
            })}
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-[var(--acct-line)] accent-[var(--gold,#c9a227)]"
          />
          <span className="text-xs leading-relaxed text-[var(--acct-muted)]">
            {surfaceCopy.accountForms.termsAgreementStart}{" "}
            <a href={henryWebRoot("/terms")} className="auth-field-link" target="_blank" rel="noopener">
              {surfaceCopy.accountForms.termsLink}
            </a>{" "}
            {surfaceCopy.accountForms.termsAgreementMiddle}{" "}
            <a href={henryWebRoot("/privacy")} className="auth-field-link" target="_blank" rel="noopener">
              {surfaceCopy.accountForms.privacyLink}
            </a>
          </span>
        </label>
      </div>

      <AuthSubmit
        label={authCopy.signup.submitButton}
        pendingLabel={surfaceCopy.accountForms.createAccountBusy}
        pending={loading}
      />
    </form>
  );
}
