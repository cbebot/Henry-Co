"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PublicField, PublicInput } from "@henryco/ui/public-shell";
import { createCmsSupabaseBrowser } from "@/lib/supabase/browser";

type TotpFactor = { id: string; friendly_name: string | null; status: string };
type EnrollState = { factorId: string; qr: string; secret: string };

export function SecuritySettings() {
  const [email, setEmail] = useState<string | null>(null);
  const [factors, setFactors] = useState<TotpFactor[]>([]);
  const [loading, setLoading] = useState(true);

  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwdBusy, setPwdBusy] = useState(false);

  const [enroll, setEnroll] = useState<EnrollState | null>(null);
  const [enrollCode, setEnrollCode] = useState("");
  const [enrollMsg, setEnrollMsg] = useState<string | null>(null);
  const [enrollBusy, setEnrollBusy] = useState(false);

  const loadFactors = useCallback(async () => {
    const supabase = createCmsSupabaseBrowser();
    const [{ data: userData }, { data: factorData }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.mfa.listFactors(),
    ]);
    setEmail(userData.user?.email ?? null);
    setFactors((factorData?.totp ?? []) as TotpFactor[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Mount-time load of the owner email + enrolled authenticator factors.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadFactors();
  }, [loadFactors]);

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    setPwdMsg(null);
    if (pwd.length < 10) {
      setPwdMsg({ ok: false, text: "Use at least 10 characters." });
      return;
    }
    if (pwd !== pwd2) {
      setPwdMsg({ ok: false, text: "Passwords don't match." });
      return;
    }
    setPwdBusy(true);
    const supabase = createCmsSupabaseBrowser();
    const { error } = await supabase.auth.updateUser({ password: pwd });
    if (error) {
      setPwdMsg({ ok: false, text: error.message || "Couldn't update password." });
    } else {
      setPwdMsg({ ok: true, text: "Password updated." });
      setPwd("");
      setPwd2("");
    }
    setPwdBusy(false);
  }

  async function startEnroll() {
    setEnrollMsg(null);
    setEnrollBusy(true);
    const supabase = createCmsSupabaseBrowser();
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `Authenticator ${new Date().toISOString().slice(0, 10)}`,
    });
    if (error || !data) {
      setEnrollMsg(error?.message ?? "Couldn't start enrollment.");
      setEnrollBusy(false);
      return;
    }
    setEnroll({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    setEnrollBusy(false);
  }

  async function confirmEnroll(event: FormEvent) {
    event.preventDefault();
    if (!enroll) return;
    setEnrollMsg(null);
    const code = enrollCode.replace(/\s+/g, "");
    if (!/^\d{6}$/.test(code)) {
      setEnrollMsg("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setEnrollBusy(true);
    const supabase = createCmsSupabaseBrowser();
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: enroll.factorId,
      code,
    });
    if (error) {
      setEnrollMsg("That code didn't match — try the current one.");
      setEnrollBusy(false);
      return;
    }
    setEnroll(null);
    setEnrollCode("");
    setEnrollBusy(false);
    await loadFactors();
  }

  async function cancelEnroll() {
    if (enroll) {
      const supabase = createCmsSupabaseBrowser();
      await supabase.auth.mfa.unenroll({ factorId: enroll.factorId }).catch(() => undefined);
    }
    setEnroll(null);
    setEnrollCode("");
    setEnrollMsg(null);
  }

  async function removeFactor(id: string) {
    const supabase = createCmsSupabaseBrowser();
    await supabase.auth.mfa.unenroll({ factorId: id }).catch(() => undefined);
    await loadFactors();
  }

  const verified = factors.filter((f) => f.status === "verified");
  const cardClass =
    "rounded-2xl border border-[var(--hc-line)] bg-[var(--hc-surface)] p-6";

  return (
    <div className="grid max-w-2xl gap-5">
      {/* Password */}
      <section className={cardClass}>
        <h2 className="text-base font-semibold text-[var(--hc-ink)]">Password</h2>
        <p className="mt-1 text-sm leading-6 text-[var(--hc-ink-muted)]">
          {email ? (
            <>Signed in as <span className="font-medium text-[var(--hc-ink)]">{email}</span>. </>
          ) : null}
          Set a new password — it takes effect immediately.
        </p>
        <form onSubmit={changePassword} className="mt-4 space-y-3">
          <PublicField label="New password" htmlFor="new-pwd">
            <PublicInput
              id="new-pwd"
              type="password"
              autoComplete="new-password"
              placeholder="At least 10 characters"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
            />
          </PublicField>
          <PublicField
            label="Confirm password"
            htmlFor="new-pwd2"
            error={pwdMsg && !pwdMsg.ok ? pwdMsg.text : undefined}
          >
            <PublicInput
              id="new-pwd2"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat it"
              value={pwd2}
              onChange={(e) => setPwd2(e.target.value)}
              invalid={Boolean(pwdMsg && !pwdMsg.ok)}
            />
          </PublicField>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={pwdBusy}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--hc-accent)] px-5 text-sm font-semibold text-[#1a1408] transition-colors hover:bg-[var(--hc-accent-strong)] disabled:opacity-70"
            >
              {pwdBusy ? "Saving…" : "Update password"}
            </button>
            {pwdMsg?.ok ? (
              <span className="text-sm font-medium text-emerald-600">{pwdMsg.text}</span>
            ) : null}
          </div>
        </form>
      </section>

      {/* Authenticator (TOTP) */}
      <section className={cardClass}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--hc-ink)]">
              Authenticator app (2FA)
            </h2>
            <p className="mt-1 text-sm leading-6 text-[var(--hc-ink-muted)]">
              Add a time-based code from an app like Google Authenticator, 1Password, or Authy.
              Once enrolled, sign-in requires it.
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
              verified.length
                ? "bg-emerald-100 text-emerald-700"
                : "bg-[var(--owner-accent-soft)] text-[var(--hc-accent-text)]"
            }`}
          >
            {verified.length ? "On" : "Off"}
          </span>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-[var(--hc-ink-muted)]">Loading…</p>
        ) : enroll ? (
          <div className="mt-5 rounded-xl border border-[var(--hc-line)] bg-[var(--hc-bg-soft)] p-5">
            <p className="text-sm font-medium text-[var(--hc-ink)]">
              Scan this with your authenticator app
            </p>
            <div className="mt-3 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  enroll.qr.startsWith("data:")
                    ? enroll.qr
                    : `data:image/svg+xml;utf8,${encodeURIComponent(enroll.qr)}`
                }
                alt="Authenticator QR code"
                className="h-44 w-44 rounded-xl border border-[var(--hc-line)] bg-white p-2"
              />
              <div className="min-w-0">
                <p className="text-xs text-[var(--hc-ink-muted)]">Or enter this key manually:</p>
                <code className="mt-1 block break-all rounded-lg bg-[var(--hc-surface)] px-2 py-1 text-xs text-[var(--hc-ink)]">
                  {enroll.secret}
                </code>
              </div>
            </div>
            <form onSubmit={confirmEnroll} className="mt-4 space-y-3">
              <PublicField
                label="Enter the 6-digit code to confirm"
                htmlFor="enroll-code"
                error={enrollMsg ?? undefined}
              >
                <PublicInput
                  id="enroll-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  value={enrollCode}
                  onChange={(e) => setEnrollCode(e.target.value)}
                  invalid={Boolean(enrollMsg)}
                />
              </PublicField>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={enrollBusy}
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--hc-accent)] px-5 text-sm font-semibold text-[#1a1408] transition-colors hover:bg-[var(--hc-accent-strong)] disabled:opacity-70"
                >
                  {enrollBusy ? "Verifying…" : "Confirm & enable"}
                </button>
                <button
                  type="button"
                  onClick={cancelEnroll}
                  className="text-sm font-medium text-[var(--hc-ink-muted)] hover:text-[var(--hc-ink)]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : verified.length ? (
          <ul className="mt-4 space-y-2">
            {verified.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between rounded-xl border border-[var(--hc-line)] bg-[var(--hc-bg-soft)] px-4 py-3"
              >
                <span className="text-sm text-[var(--hc-ink)]">
                  {f.friendly_name || "Authenticator"}
                </span>
                <button
                  type="button"
                  onClick={() => removeFactor(f.id)}
                  className="text-xs font-medium text-rose-600 hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
            <li className="pt-1">
              <button
                type="button"
                onClick={startEnroll}
                disabled={enrollBusy}
                className="text-sm font-medium text-[var(--hc-accent-text)] hover:underline disabled:opacity-60"
              >
                + Add another authenticator
              </button>
            </li>
          </ul>
        ) : (
          <button
            type="button"
            onClick={startEnroll}
            disabled={enrollBusy}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--hc-line)] px-5 text-sm font-semibold text-[var(--hc-ink)] transition-colors hover:border-[var(--hc-accent)] disabled:opacity-70"
          >
            {enrollBusy ? "Starting…" : "Add authenticator"}
          </button>
        )}
        {enrollMsg && !enroll ? (
          <p className="mt-3 text-sm text-rose-600">{enrollMsg}</p>
        ) : null}
      </section>
    </div>
  );
}
