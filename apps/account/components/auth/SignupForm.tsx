"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ButtonPendingContent } from "@henryco/ui";
import { normalizeTrustedRedirect } from "@henryco/config";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { mapAccountAuthMessage } from "@/lib/auth-copy";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";

const COUNTRIES = [
  { code: "NG", name: "Nigeria", dial: "+234" },
  { code: "GH", name: "Ghana", dial: "+233" },
  { code: "KE", name: "Kenya", dial: "+254" },
  { code: "ZA", name: "South Africa", dial: "+27" },
  { code: "GB", name: "United Kingdom", dial: "+44" },
  { code: "US", name: "United States", dial: "+1" },
  { code: "CA", name: "Canada", dial: "+1" },
  { code: "AE", name: "United Arab Emirates", dial: "+971" },
  { code: "DE", name: "Germany", dial: "+49" },
  { code: "FR", name: "France", dial: "+33" },
];

const CONTACT_PREFS = [
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "phone", label: "Phone call" },
  { value: "in_app", label: "In-app only" },
];

function buildLoginHref(next: string | null) {
  const safeNext = normalizeTrustedRedirect(next);
  return safeNext === "/" ? "/login" : `/login?next=${encodeURIComponent(safeNext)}`;
}

export default function SignupForm() {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) { setError("Full name is required."); return; }
    if (!email.trim()) { setError("Email is required."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match. Check the confirmation field."); return; }
    if (!termsAccepted) { setError("Please accept the terms and privacy policy."); return; }

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
          },
        },
      });

      if (authError) { setError(mapAccountAuthMessage(authError.message, "sign_up")); return; }
      setSuccess(true);
    } catch {
      setError("We couldn't create your account right now. Please try again.");
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
        <h2 className="text-lg font-semibold">Check your email</h2>
        <p className="mt-2 text-sm text-[var(--acct-muted)]">
          We&apos;ve sent a verification link to <strong>{email}</strong>. Click it to activate your account.
        </p>
        <button onClick={() => router.push(buildLoginHref(next))} className="acct-button-secondary mt-4">
          Back to sign in
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
          <label className="mb-1.5 block text-sm font-medium">Full name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="acct-input"
            placeholder="Your full name"
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="acct-input"
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="acct-input pr-10"
              placeholder="Min. 8 characters"
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
          <label className="mb-1.5 block text-sm font-medium">Confirm password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="acct-input pr-10"
              placeholder="Re-enter your password"
              required
              minLength={8}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--acct-muted)]"
              aria-label={showPassword ? "Hide passwords" : "Show passwords"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Country</label>
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
            <label className="mb-1.5 block text-sm font-medium">Phone number</label>
            <div className="flex gap-2">
              <span className="flex items-center rounded-l-[var(--acct-radius)] border border-r-0 border-[var(--acct-line)] bg-[var(--acct-surface)] px-3 text-sm text-[var(--acct-muted)]">
                {selectedCountry?.dial}
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                className="acct-input rounded-l-none"
                placeholder="8012345678"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Preferred contact method</label>
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
            I agree to the HenryCo{" "}
            <a href="https://henrycogroup.com/terms" className="text-[var(--acct-gold)] hover:underline" target="_blank" rel="noopener">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="https://henrycogroup.com/privacy" className="text-[var(--acct-gold)] hover:underline" target="_blank" rel="noopener">
              Privacy Policy
            </a>
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="acct-button-primary mt-6 w-full rounded-xl py-3"
      >
        <ButtonPendingContent pending={loading} pendingLabel="Creating account..." spinnerLabel="Creating account">
          Create account
        </ButtonPendingContent>
      </button>
    </form>
  );
}
