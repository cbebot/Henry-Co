"use client";

import { useState } from "react";
import { ButtonPendingContent } from "@henryco/ui";
import { Eye, EyeOff } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { mapAccountAuthMessage } from "@/lib/auth-copy";

export default function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }
    if (password.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setMessage({ type: "error", text: mapAccountAuthMessage(error.message, "change_password") });
      } else {
        setMessage({ type: "success", text: "Your password has been updated." });
        setPassword("");
        setConfirmPassword("");
      }
    } catch {
      setMessage({ type: "error", text: "We couldn't update your password right now. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
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

      <div>
        <label className="mb-1.5 block text-sm font-medium">New password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="acct-input pr-10"
            placeholder="Min. 8 characters"
            required
            minLength={8}
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
        <label className="mb-1.5 block text-sm font-medium">Confirm new password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="acct-input"
          placeholder="Repeat new password"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="acct-button-primary rounded-xl"
      >
        <ButtonPendingContent pending={loading} pendingLabel="Updating password..." spinnerLabel="Updating password">
          Update password
        </ButtonPendingContent>
      </button>
    </form>
  );
}
