import { redirect } from "next/navigation";
import { COMPANY, normalizeTrustedRedirect } from "@henryco/config";
import { readVerifiedOAuthLinkIntent } from "@henryco/auth/server/oauth-link-intent";
import { getAuthCopy, translateSurfaceLabel } from "@henryco/i18n";

import AuthShell from "@/components/auth/AuthShell";
import { getAccountAppLocale } from "@/lib/locale-server";

import { LinkAccountClient } from "./LinkAccountClient";

/**
 * V3-02 S1 / Addendum A1 — OAuth account-linking confirmation.
 *
 * Reached only via the callback's link-intent diversion. The intent
 * cookie carries the email + provider; the user signs in with their
 * existing password to confirm the link. On success the OAuth
 * identity attaches to the existing user and they are routed onward.
 *
 * Presentation now runs on the shared AuthShell; the security spine is
 * untouched — the signed intent still gates the page and supplies the email.
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
  const authCopy = getAuthCopy(locale);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const safeNext = normalizeTrustedRedirect(params.next ?? "/");
  const providerLabel =
    params.provider ??
    intent.provider.charAt(0).toUpperCase() + intent.provider.slice(1);

  return (
    <AuthShell
      wordmark={COMPANY.group.name}
      brandEyebrow={authCopy.scene.eyebrow}
      brandLine={authCopy.scene.line}
      eyebrow={t("Henry Onyx Accounts")}
      title={`${t("Confirm to link")} ${providerLabel}`}
      subtitle={`${t("An account already exists for")} ${intent.email}. ${t("Sign in with your existing password to attach")} ${providerLabel} ${t("to it.")}`}
    >
      <LinkAccountClient
        email={intent.email}
        provider={intent.provider}
        next={safeNext}
        copy={{
          passwordLabel: authCopy.login.passwordLabel,
          submitLabel: t("Confirm and link"),
          submitBusyLabel: t("Confirming…"),
          cancelLabel: t("Use a different account"),
          incorrectMessage: t("That password didn't match. Try again."),
          genericMessage: t("We couldn't verify that. Please try again."),
          showPassword: authCopy.scene.showPassword,
          hidePassword: authCopy.scene.hidePassword,
        }}
      />
    </AuthShell>
  );
}
