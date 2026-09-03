import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, ArrowRight } from "lucide-react";
import {
  COMPANY,
  henryWebRoot,
  isRecoverableSupabaseAuthError,
  normalizeTrustedRedirect,
} from "@henryco/config";
import { resolveSenderIdentity } from "@henryco/email";
import { getAuthCopy, translateSurfaceLabel } from "@henryco/i18n";
import AuthShell from "@/components/auth/AuthShell";
import { getAccountAppLocale } from "@/lib/locale-server";
import { createSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account verified — Henry Onyx" };

/**
 * Premium landing the user lands on after the email-confirmation callback
 * succeeds. The callback route does the actual session exchange + profile
 * creation; this page is purely the "your account is live" UX, now rendered on
 * the shared AuthShell so it sits inside the same onyx-and-seam scene as login.
 *
 * If the user arrives here without a session (deep-linked or back-button),
 * we route them to login — the verification still went through, they just
 * need to authenticate the browser.
 */
export default async function VerifiedPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
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

  const safeNext = normalizeTrustedRedirect(params.next);
  const continueHref = safeNext === "/" ? "/" : safeNext;
  const fullName =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()) ||
    null;
  const accountsSender = resolveSenderIdentity("auth");

  const locale = await getAccountAppLocale();
  const authCopy = getAuthCopy(locale);
  const t = (text: string) => translateSurfaceLabel(locale, text);

  const firstName = fullName ? fullName.split(" ")[0] : null;
  const heading = firstName
    ? `${t("You’re in,")} ${firstName}.`
    : t("Your Henry Onyx account is verified.");

  const unlocks = [
    t("Care booking, tracking, and concierge messaging"),
    t("Marketplace orders, payments, and seller tools"),
    t("Studio briefs, projects, and milestone updates"),
    t("Jobs, Learn, Property, Logistics — one identity"),
  ];

  return (
    <AuthShell
      wordmark={COMPANY.group.name}
      brandEyebrow={authCopy.scene.eyebrow}
      brandLine={authCopy.scene.line}
      eyebrow={t("Henry Onyx Accounts")}
      title={heading}
      subtitle={t(
        "Your email is confirmed and your customer profile is ready. Move freely across Care, Marketplace, Studio, Jobs, Learn, Logistics, and Property — one Henry Onyx account, one trusted session.",
      )}
    >
      <div className="auth-success">
        <span className="auth-success-icon" aria-hidden>
          <CheckCircle2 size={22} />
        </span>
        <div>
          <p style={{ fontWeight: 600 }}>{t("What your Henry Onyx account unlocks")}</p>
          <ul className="mt-3 grid gap-2">
            {unlocks.map((line) => (
              <li key={line} className="flex items-start gap-2 text-sm leading-relaxed">
                <span aria-hidden>—</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-7 flex flex-col gap-3">
        <Link
          href={continueHref}
          className="auth-provider"
          style={{
            background:
              "linear-gradient(180deg, #e0bf4e 0%, var(--acct-gold, #c9a227) 46%, var(--acct-gold-strong, #a88718) 100%)",
            color: "var(--acct-ink-on-gold, #1a1408)",
            border: 0,
            fontWeight: 650,
          }}
        >
          {t("Continue to my Henry Onyx account")}
          <ArrowRight size={15} aria-hidden />
        </Link>
        <Link href={henryWebRoot()} className="auth-provider">
          {t("Explore Henry Onyx")}
        </Link>
      </div>

      <p className="auth-alt">
        {t("Need help? Reach")}{" "}
        <span style={{ color: "var(--acct-ink)" }}>{accountsSender.email}</span>{" "}
        {t("any time.")}
      </p>
    </AuthShell>
  );
}
