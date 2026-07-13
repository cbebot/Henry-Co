import { forwardRef, type InputHTMLAttributes } from "react";
import Link from "next/link";

/**
 * AuthField — a labelled input in the Henry Onyx auth register.
 *
 * Directive-less on purpose: it holds no state, so it composes into either a
 * server page or a client form. All input attributes (value/onChange/
 * autoComplete/inputMode/…) pass straight through to the native <input>.
 */
type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  /** Optional trailing link on the label row (e.g. "Forgot password?"). */
  link?: { href: string; label: string };
  /** Optional helper line under the field. */
  hint?: string;
  /** Error visual state; the message renders in AuthErrorNotice above the form. */
  invalid?: boolean;
  /** Extra classes on the <input> (e.g. affix padding). */
  inputClassName?: string;
};

const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(function AuthField(
  { label, link, hint, invalid, inputClassName, id, name, ...rest },
  ref,
) {
  const inputId = id || name;
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
      <input
        ref={ref}
        id={inputId}
        name={name}
        aria-invalid={invalid || undefined}
        aria-describedby={hintId}
        className={`auth-input${invalid ? " has-error" : ""}${inputClassName ? ` ${inputClassName}` : ""}`}
        {...rest}
      />
      {hint ? (
        <p id={hintId} className="auth-field-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export default AuthField;
