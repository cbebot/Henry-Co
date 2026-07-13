"use client";

import { useId, useState, type InputHTMLAttributes } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

/**
 * PasswordField — the ONE canonical password input for the auth set.
 *
 * Replaces the four hand-rolled show/hide toggles that had drifted across
 * LoginForm / SignupForm (×2) / ResetPasswordForm with inconsistent a11y. The
 * toggle carries a localized aria-label and aria-pressed; the visibility state
 * is local and never leaves the field. All native input attributes pass
 * through, so callers keep autoComplete/minLength/required exactly as before.
 */
type PasswordFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  /** Trailing label-row link, e.g. "Forgot password?". */
  link?: { href: string; label: string };
  hint?: string;
  invalid?: boolean;
  /** Localized a11y label for the reveal toggle when the field is masked. */
  showLabel: string;
  /** Localized a11y label for the toggle when the field is revealed. */
  hideLabel: string;
};

export default function PasswordField({
  label,
  link,
  hint,
  invalid,
  showLabel,
  hideLabel,
  id,
  name,
  ...rest
}: PasswordFieldProps) {
  const [revealed, setRevealed] = useState(false);
  const autoId = useId();
  const inputId = id || name || autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;

  return (
    <div className="auth-field">
      <div className="auth-field-row">
        <label className="auth-label" htmlFor={inputId}>
          {label}
        </label>
        {link ? (
          <Link href={link.href} className="auth-field-link">
            {link.label}
          </Link>
        ) : null}
      </div>
      <div className="auth-field-affix">
        <input
          id={inputId}
          name={name}
          type={revealed ? "text" : "password"}
          aria-invalid={invalid || undefined}
          aria-describedby={hintId}
          className={`auth-input auth-input-affix${invalid ? " has-error" : ""}`}
          {...rest}
        />
        <button
          type="button"
          className="auth-field-toggle"
          onClick={() => setRevealed((v) => !v)}
          aria-label={revealed ? hideLabel : showLabel}
          aria-pressed={revealed}
        >
          {revealed ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
        </button>
      </div>
      {hint ? (
        <p id={hintId} className="auth-field-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
