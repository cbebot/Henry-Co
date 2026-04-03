"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }

    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowser();
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) { setError(updateErr.message); return; }
      setSuccess(true);
      setTimeout(() => router.push("/"), 2000);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="acct-card p-6 text-center sm:p-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--acct-green-soft)]">
          <svg className="h-6 w-6 text-[var(--acct-green)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold">Password updated</h2>
        <p className="mt-2 text-sm text-[var(--acct-muted)]">Redirecting to your dashboard...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="acct-card p-6 sm:p-8">
      {error && (
        <div className="mb-4 rounded-xl bg-[var(--acct-red-soft)] px-4 py-3 text-sm text-[var(--acct-red)]">{error}</div>
      )}
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">New password</label>
          <div className="relative">
            <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
              className="acct-input pr-10" placeholder="Min. 8 characters" required minLength={8} />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--acct-muted)]">
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Confirm password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
            className="acct-input" placeholder="Repeat new password" required />
        </div>
      </div>
      <button type="submit" disabled={loading} className="acct-button-primary mt-6 w-full rounded-xl py-3">
        {loading ? <Loader2 size={18} className="animate-spin" /> : "Set new password"}
      </button>
    </form>
  );
}
