import { redirect } from "next/navigation";
import { isRecoverableSupabaseAuthError, normalizeTrustedRedirect } from "@henryco/config";
import {
  Briefcase,
  Building2,
  Crown,
  ShieldCheck,
  Sparkles,
  UserCircle,
} from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { readAndClearOAuthErrorCookie } from "@henryco/auth/server/oauth-error-cookie";
import Logo from "@/components/brand/Logo";
import { RoleChooserBadges } from "@/components/auth/RoleChooserBadges";
import { getAccountAppLocale } from "@/lib/locale-server";
import { loadDashboardOptions } from "@/lib/post-auth-routing";
import { createSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Choose your workspace — Henry Onyx" };

const OPTION_ICON: Record<string, typeof UserCircle> = {
  customer: UserCircle,
  staff: Briefcase,
  owner: Crown,
};

const OPTION_ACCENT: Record<string, { ring: string; tint: string; ink: string }> = {
  customer: {
    ring: "ring-[var(--acct-div-account)]/15",
    tint: "bg-[var(--acct-bg-soft)]",
    ink: "text-[var(--acct-div-account)]",
  },
  staff: {
    ring: "ring-[var(--acct-div-staff)]/20",
    tint: "bg-[var(--acct-blue-soft)]/40",
    ink: "text-[var(--acct-div-staff)]",
  },
  owner: {
    ring: "ring-[var(--acct-gold)]/30",
    tint: "bg-[var(--acct-gold-soft)]",
    ink: "text-[var(--acct-gold)]",
  },
};

/**
 * Premium role-chooser landing. Shown when an authenticated user has access
 * to more than one Henry Onyx dashboard space (e.g. they are a customer
 * AND a staff member). Each option is a full-width card on mobile, side-by-side
 * on tablet+, and submits a POST to `/api/auth/choose` so the cross-subdomain
 * redirect can set the remember-choice cookie before issuing the 303.
 *
 * Notes
 *   - Defense in depth: the POST handler revalidates the picked option
 *     against the live access snapshot before honoring it. The form
 *     values here are only a UX hint, not a trust boundary.
 *   - The Sign out link clears both the session and the remember-choice
 *     cookie so the user gets a clean state.
 */
export default async function ChoosePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const locale = await getAccountAppLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const supabase = await createSupabaseServer();
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] | null = null;

  try {
    const auth = await supabase.auth.getUser();
    user = auth.data.user;
  } catch (error) {
    if (!isRecoverableSupabaseAuthError(error)) throw error;
  }

  if (!user) {
    const safeNext = normalizeTrustedRedirect(params.next);
    const loginHref = safeNext === "/" ? "/login" : `/login?next=${encodeURIComponent(safeNext)}`;
    redirect(loginHref);
  }

  const options = await loadDashboardOptions(user);

  // No ambiguity — never park a single-lane user on the chooser.
  if (options.length <= 1) {
    redirect(options[0]?.href || "/");
  }

  // Read + clear the OAuth error cookie (Addendum A6). Surfaced as
  // an inline notice on top of the chooser; the URL stays clean.
  const oauthError = await readAndClearOAuthErrorCookie();
  const oauthErrorCopy =
    oauthError?.code === "cancelled"
      ? t("Sign-in was cancelled. Try again when you're ready.")
      : oauthError?.code === "session_exchange_failed"
        ? t("We couldn't complete that sign-in. Please try again.")
        : oauthError?.code === "link_required"
          ? t("Please confirm your password to link the new sign-in method.")
          : oauthError?.code === "link_window_expired"
            ? t("The link window expired. Start the sign-in again.")
            : oauthError
              ? t("We couldn't complete that sign-in. Please try again.")
              : null;

  const safeNext = normalizeTrustedRedirect(params.next);
  const fullName =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()) ||
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name.trim()) ||
    null;
  const greeting = fullName ? `${t("Signed in as")} ${fullName.split(" ")[0]}.` : t("Signed in to HenryCo.");

  return (
    <div className="flex min-h-screen items-start justify-center bg-[var(--acct-bg)] px-4 py-10 sm:items-center sm:py-16">
      <div className="w-full max-w-3xl acct-fade-in">
        <div className="mb-8 flex flex-col items-center text-center sm:mb-10">
          <Logo size={44} />
          <p className="mt-5 text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--acct-gold)]">
            {t("HenryCo Accounts")}
          </p>
          <h1 className="acct-display mt-3 text-2xl leading-tight text-[var(--acct-ink)] sm:text-[28px]">
            {t("Choose your workspace")}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--acct-muted)]">
            {greeting} {t("You have access to more than one Henry Onyx space. Pick where you'd like to land — you can switch any time, and we can remember this choice on this browser.")}
          </p>
          {oauthErrorCopy ? (
            <p
              role="alert"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-100/70 px-4 py-1.5 text-xs font-medium text-amber-900"
              data-oauth-error={oauthError?.code}
            >
              {oauthErrorCopy}
            </p>
          ) : null}
        </div>

        <form
          method="POST"
          action="/api/auth/choose"
          className="space-y-3"
          aria-label={t("Pick a Henry Onyx dashboard")}
        >
          {safeNext !== "/" ? (
            <input type="hidden" name="next" value={safeNext} />
          ) : null}

          <div
            role="radiogroup"
            aria-label={t("Available dashboards")}
            className="grid gap-3 sm:gap-4"
          >
            {options.map((option, index) => {
              const Icon = OPTION_ICON[option.key] ?? Sparkles;
              const accent = OPTION_ACCENT[option.key] ?? OPTION_ACCENT.customer;
              return (
                <label
                  key={option.key}
                  className={`group relative flex cursor-pointer flex-col gap-3 rounded-[var(--acct-radius-lg)] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-5 shadow-[var(--acct-shadow)] transition focus-within:ring-2 focus-within:ring-[var(--acct-gold)]/40 hover:-translate-y-[1px] hover:border-[var(--acct-gold)]/40 hover:shadow-[var(--acct-shadow-lg)] sm:flex-row sm:items-center sm:gap-4 sm:p-6`}
                >
                  <input
                    type="radio"
                    name="dashboard"
                    value={option.key}
                    defaultChecked={index === 0}
                    className="peer sr-only"
                    aria-describedby={`option-${option.key}-desc`}
                  />
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${accent.ring} ${accent.tint}`}
                    aria-hidden="true"
                  >
                    <Icon size={22} className={accent.ink} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-[var(--acct-ink)]">
                        {option.title}
                      </h2>
                      {option.role === "super_admin" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--acct-gold-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--acct-gold)]">
                          <ShieldCheck size={10} />
                          {t("Executive")}
                        </span>
                      ) : option.role === "division_operator" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--acct-blue-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--acct-div-staff)]">
                          <Building2 size={10} />
                          {t("Division")}
                        </span>
                      ) : null}
                    </div>
                    <p
                      id={`option-${option.key}-desc`}
                      className="mt-1 text-sm leading-relaxed text-[var(--acct-muted)]"
                    >
                      {option.description}
                    </p>
                    <RoleChooserBadges tileKey={option.key} />
                    <p className="mt-2 truncate text-[11px] uppercase tracking-[0.18em] text-[var(--acct-muted)]/80">
                      {new URL(option.href).host}
                    </p>
                  </div>
                  <div
                    aria-hidden="true"
                    className="hidden h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--acct-line)] bg-[var(--acct-bg)] text-[var(--acct-muted)] transition peer-checked:border-[var(--acct-gold)] peer-checked:bg-[var(--acct-gold)] peer-checked:text-white sm:flex"
                  >
                    <span className="h-2 w-2 rounded-full bg-current" />
                  </div>
                </label>
              );
            })}
          </div>

          <div className="acct-panel mt-2 flex flex-col gap-3 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-3 text-[var(--acct-ink)]">
              <input
                type="checkbox"
                name="remember"
                value="1"
                defaultChecked
                className="h-4 w-4 rounded border-[var(--acct-line)] text-[var(--acct-gold)] focus:ring-[var(--acct-gold)]"
              />
              <span>
                {t("Remember my choice on this browser")}
                <span className="ml-2 text-xs text-[var(--acct-muted)]">
                  {t("(you can change this from your account settings)")}
                </span>
              </span>
            </label>
          </div>

          <div className="mt-2 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a
              href={`/api/auth/logout${safeNext !== "/" ? `?next=${encodeURIComponent(safeNext)}` : ""}`}
              className="acct-button-ghost self-center text-xs"
              data-test="chooser-signout"
            >
              {t("Sign out")}
            </a>
            <button
              type="submit"
              className="acct-button-primary inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold sm:min-w-[180px]"
            >
              {t("Continue")}
            </button>
          </div>
        </form>

        <p className="mt-8 text-center text-[11px] text-[var(--acct-muted)]">
          {t("You stay signed in across every Henry Onyx subdomain — switching spaces never asks for your password again.")}
        </p>
      </div>
    </div>
  );
}
