import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { isRecoverableSupabaseAuthError, normalizeTrustedRedirect } from "@henryco/config";
import { resolveSenderIdentity } from "@henryco/email";
import Logo from "@/components/brand/Logo";
import { createSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account verified — Henry & Co." };

/**
 * Premium landing the user lands on after the email-confirmation callback
 * succeeds. The callback route does the actual session exchange + profile
 * creation; this page is purely the "your account is live" UX.
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--acct-bg)] px-4 py-10">
      <div className="w-full max-w-xl acct-fade-in">
        <div className="mb-8 flex items-center justify-center">
          <Logo size={48} />
        </div>
        <div className="acct-card overflow-hidden p-0">
          <div className="border-b border-[var(--acct-line)] px-6 py-6 sm:px-8 sm:py-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--acct-green-soft)]">
                <CheckCircle2 size={24} className="text-[var(--acct-green)]" />
              </div>
              <div className="min-w-0">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--acct-gold)]">
                  HenryCo Accounts
                </p>
                <h1 className="acct-display mt-2 text-2xl leading-tight text-[var(--acct-ink)] sm:text-3xl">
                  {fullName ? `You&rsquo;re in, ${fullName.split(" ")[0]}.` : "Your HenryCo account is verified."}
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-[var(--acct-muted)]">
                  Your email is confirmed and your customer profile is ready. From here you can move freely across Care, Marketplace, Studio, Jobs, Learn, Logistics, and Property — one HenryCo account, one trusted session.
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8 sm:py-7">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--acct-muted)]">
              What your HenryCo account unlocks
            </p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                "Care booking, tracking, and concierge messaging",
                "Marketplace orders, payments, and seller tools",
                "Studio briefs, projects, and milestone updates",
                "Jobs, Learn, Property, Logistics — one identity",
              ].map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-2.5 rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-bg)] px-3.5 py-3 text-sm leading-relaxed text-[var(--acct-ink)]"
                >
                  <Sparkles size={14} className="mt-0.5 shrink-0 text-[var(--acct-gold)]" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href={continueHref}
                className="acct-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              >
                Continue to my HenryCo account
                <ArrowRight size={14} />
              </Link>
              <Link
                href="https://henrycogroup.com"
                className="acct-button-secondary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              >
                Explore HenryCo
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-[var(--acct-muted)]">
          Need help? Reach <span className="text-[var(--acct-ink)]">{accountsSender.email}</span> any time.
        </p>
      </div>
    </div>
  );
}
