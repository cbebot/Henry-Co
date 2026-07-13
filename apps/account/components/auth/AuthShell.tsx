import type { ReactNode } from "react";
import Link from "next/link";
import "./auth.css";

/**
 * AuthShell — the Henry Onyx auth scene.
 *
 * A gemstone split by a seam of light: an ONYX brand panel (constant across
 * themes) meets the form panel (active register) across the signature gold
 * seam. Server component — pure presentation; the security spine lives in each
 * page's server code and its form's client logic, both untouched by this shell.
 *
 * All copy arrives as props so every string stays inside the caller's localized
 * `getAuthCopy(locale)` / `translateSurfaceLabel` world — the shell hardcodes
 * nothing user-facing.
 */

export type AuthShellProps = {
  /** Small uppercase kicker above the title, e.g. copy.login.eyebrow. */
  eyebrow?: string;
  /** The form-side headline (Fraunces). */
  title: string;
  /** One supporting line under the title. */
  subtitle?: string;
  /** The form itself. */
  children: ReactNode;
  /** Footer line, e.g. "New here? Create account". */
  altAction?: ReactNode;
  /** Optional slot rendered above the title (e.g. a language switcher). */
  headerSlot?: ReactNode;

  /** Brand-panel eyebrow (defaults handled by caller copy). */
  brandEyebrow: string;
  /** Brand-panel editorial line; may contain an emphasized fragment. */
  brandLine: ReactNode;
  /** Wordmark label rendered next to the monogram. */
  wordmark: string;
  /** The rooms this one key opens — localized division labels. */
  ecosystem?: string[];
  /** Where the wordmark links (usually the marketing home). */
  homeHref?: string;
};

export default function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  altAction,
  headerSlot,
  brandEyebrow,
  brandLine,
  wordmark,
  ecosystem,
  homeHref = "/",
}: AuthShellProps) {
  return (
    <div className="auth-scene">
      <aside className="auth-brand">
        <Link href={homeHref} className="auth-brand-mark" aria-label={wordmark}>
          <span className="auth-brand-glyph" aria-hidden>
            H
          </span>
          <span>{wordmark}</span>
        </Link>

        <div className="auth-brand-lede">
          <p className="auth-brand-eyebrow">{brandEyebrow}</p>
          <p className="auth-brand-line">{brandLine}</p>
        </div>

        {ecosystem && ecosystem.length > 0 ? (
          <div className="auth-brand-eco" aria-hidden>
            {ecosystem.map((room) => (
              <span key={room}>{room}</span>
            ))}
          </div>
        ) : (
          <span />
        )}
      </aside>

      <div className="auth-seam" aria-hidden />

      <main className="auth-form-panel">
        <div className="auth-form-inner">
          {headerSlot}
          <div className="auth-rise">
            {eyebrow ? <p className="auth-eyebrow">{eyebrow}</p> : null}
            <h1 className="auth-title">{title}</h1>
            {subtitle ? <p className="auth-subtitle">{subtitle}</p> : null}
          </div>
          {children}
          {altAction ? <p className="auth-alt">{altAction}</p> : null}
        </div>
      </main>
    </div>
  );
}
