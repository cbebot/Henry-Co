import Link from "next/link";
import { Lock } from "lucide-react";

/**
 * Premium sign-in prompt for flows that require a HenryCo session (inquiries, viewings, submissions).
 */
export function PropertyPublicAuthGate({
  title,
  description,
  loginHref,
  signupHref,
}: {
  title: string;
  description: string;
  loginHref: string;
  signupHref: string;
}) {
  return (
    <div
      className="rounded-[2rem] border border-[var(--property-line)] bg-[rgba(0,0,0,0.22)] p-6 sm:p-8"
      data-property-auth-gate="required"
    >
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--property-line)] bg-[rgba(255,255,255,0.04)] text-[var(--property-accent-strong)]">
          <Lock className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="property-kicker">HenryCo account</p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-[var(--property-ink)]">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--property-ink-soft)]">{description}</p>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link href={loginHref} className="property-button-primary inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold">
              Sign in to continue
            </Link>
            <Link href={signupHref} className="property-button-secondary inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold">
              Create account
            </Link>
          </div>
          <p className="text-xs leading-relaxed text-[var(--property-ink-soft)]">
            You’ll return to this page after signing in. HenryCo uses one account across divisions so inquiries and
            listings stay traceable and secure.
          </p>
        </div>
      </div>
    </div>
  );
}
