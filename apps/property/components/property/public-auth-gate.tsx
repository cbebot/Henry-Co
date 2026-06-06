import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { getPropertyPublicLocale } from "@/lib/locale-server";

/**
 * Premium sign-in prompt for flows that require a HenryCo session
 * (inquiries, viewings, submissions). Editorial border-l ribbon — no
 * heavy panel chrome. `title`/`description` arrive pre-translated from the
 * caller; the static chrome strings are translated here (one place, DRY).
 */
export async function PropertyPublicAuthGate({
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
  const locale = await getPropertyPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  return (
    <div
      className="border-l-2 border-[var(--property-accent-strong)]/55 pl-5 sm:pl-6"
      data-property-auth-gate="required"
    >
      <div className="flex items-center gap-2">
        <Lock className="h-3.5 w-3.5 text-[var(--property-accent-strong)]" aria-hidden />
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--property-accent-strong)]">
          {t("Henry Onyx account required")}
        </p>
      </div>
      <h3 className="mt-3 max-w-md text-[1.25rem] font-semibold leading-snug tracking-[-0.015em] text-[var(--property-ink)] sm:text-[1.4rem]">
        {title}
      </h3>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--property-ink-soft)]">
        {description}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={loginHref}
          className="property-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--property-accent-strong)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--home-canvas)] active:translate-y-[0.5px]"
        >
          {t("Sign in to continue")}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href={signupHref}
          className="property-button-secondary inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--property-accent-strong)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--home-canvas)] active:translate-y-[0.5px]"
        >
          {t("Create account")}
        </Link>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-[var(--property-ink-soft)]">
        {t(
          "You’ll return to this page after signing in. Henry Onyx uses one account across divisions so inquiries and listings stay traceable and secure.",
        )}
      </p>
    </div>
  );
}
