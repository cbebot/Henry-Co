import { redirect } from "next/navigation";
import { normalizeTrustedRedirect } from "@henryco/config";
import { readVerifiedOAuthLinkIntent } from "@henryco/auth/server/oauth-link-intent";
import { translateSurfaceLabel } from "@henryco/i18n";

import Logo from "@/components/brand/Logo";
import { getAccountAppLocale } from "@/lib/locale-server";

import { LinkAccountClient } from "./LinkAccountClient";

/**
 * V3-02 S1 / Addendum A1 — OAuth account-linking confirmation.
 *
 * Reached only via the callback's link-intent diversion. The intent
 * cookie carries the email + provider; the user signs in with their
 * existing password to confirm the link. On success the OAuth
 * identity attaches to the existing user and they are routed onward.
 */

export const dynamic = "force-dynamic";
export const metadata = { title: "Confirm account link — Henry Onyx" };

type LinkAccountSearchParams = {
  intent?: string;
  provider?: string;
  next?: string;
};

export default async function LinkAccountPage({
  searchParams,
}: {
  searchParams: Promise<LinkAccountSearchParams>;
}) {
  const params = await searchParams;
  const intent = await readVerifiedOAuthLinkIntent();
  if (!intent) {
    // No valid intent in scope → fall back to /auth/choose so the
    // user is not stranded. The chooser will surface the
    // link_window_expired error via the error cookie when relevant.
    redirect("/auth/choose");
  }

  const locale = await getAccountAppLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const safeNext = normalizeTrustedRedirect(params.next ?? "/");
  const providerLabel =
    params.provider ??
    intent.provider.charAt(0).toUpperCase() + intent.provider.slice(1);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--acct-bg)] px-4 py-12">
      <div className="acct-panel w-full max-w-md p-8 acct-fade-in">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size={40} />
          <p className="mt-4 text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--acct-gold)]">
            {t("HenryCo Accounts")}
          </p>
          <h1 className="acct-display mt-3 text-xl text-[var(--acct-ink)]">
            {t("Confirm to link")} {providerLabel}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--acct-muted)]">
            {t("An account already exists for")} <span className="font-medium text-[var(--acct-ink)]">{intent.email}</span>.{" "}
            {t("Sign in with your existing password to attach")} {providerLabel} {t("to it.")}
          </p>
        </div>
        <LinkAccountClient
          email={intent.email}
          provider={intent.provider}
          next={safeNext}
          copy={{
            passwordLabel: t("Password"),
            submitLabel: t("Confirm and link"),
            cancelLabel: t("Use a different account"),
            incorrectMessage: t("That password didn't match. Try again."),
            genericMessage: t("We couldn't verify that. Please try again."),
          }}
        />
      </div>
    </div>
  );
}
