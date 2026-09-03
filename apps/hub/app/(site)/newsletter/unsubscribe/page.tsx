import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Mail, MailX } from "lucide-react";
import { getHubPublicCopy } from "@henryco/i18n/server";
import { getHubPublicLocale } from "../../../../lib/locale-server";
import { unsubscribeByToken } from "@/lib/newsletter/service";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getHubPublicLocale().catch(() => "en" as const);
  const copy = getHubPublicCopy(locale).newsletterUnsubscribe;
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
  };
}

type SearchParams = {
  token?: string;
};

export default async function NewsletterUnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [params, locale] = await Promise.all([
    searchParams,
    getHubPublicLocale().catch(() => "en" as const),
  ]);
  const copy = getHubPublicCopy(locale).newsletterUnsubscribe;
  const token = params.token;

  if (!token) {
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-20 text-[color:var(--home-ink)]">
        <p className="home-eyebrow flex items-center gap-2 text-[color:var(--home-ink-50)]">
          <MailX className="h-3.5 w-3.5 text-[color:var(--home-accent-text)]" />
          {copy.eyebrow}
        </p>
        <h1 className="home-display-xl mt-5">
          {copy.missingTitle}
        </h1>
        <p className="mt-4 max-w-xl text-pretty text-base leading-[1.7] text-[color:var(--home-ink-65)]">
          {copy.missingBody}
        </p>
        <div className="mt-7 flex flex-wrap gap-3 text-sm">
          <Link
            href="/contact"
            className="home-focus inline-flex items-center gap-2 rounded-full border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-04)] px-5 py-2.5 font-semibold text-[color:var(--home-ink)] transition hover:border-[color:var(--home-accent)] hover:bg-[color:var(--home-surface-07)]"
          >
            {copy.missingCtaContact}
          </Link>
          <Link
            href="/newsletter"
            className="home-focus inline-flex items-center gap-2 rounded-full px-4 py-2.5 font-semibold text-[color:var(--home-accent-text)] underline-offset-4 hover:underline"
          >
            {copy.missingCtaBack}
          </Link>
        </div>
      </main>
    );
  }

  const result = await unsubscribeByToken(token);

  if (!result.ok) {
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-20 text-[color:var(--home-ink)]">
        <p className="home-eyebrow flex items-center gap-2 text-[color:var(--home-ink-50)]">
          <MailX className="h-3.5 w-3.5 text-[color:var(--home-accent-text)]" />
          {copy.eyebrow}
        </p>
        <h1 className="home-display-xl mt-5">
          {copy.errorTitle}
        </h1>
        <p className="mt-4 max-w-xl text-pretty text-base leading-[1.7] text-[color:var(--home-ink-65)]">
          {result.message}
        </p>
        <div className="mt-6 border-l-2 border-[color:var(--home-accent)] pl-5 text-sm leading-7 text-[color:var(--home-ink-65)]">
          {copy.errorManualNote}
        </div>
      </main>
    );
  }

  const successBody = copy.successBody.replace("{{email}}", result.email ?? "");

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-20 text-[color:var(--home-ink)]">
      <p className="home-eyebrow flex items-center gap-2 text-[color:var(--home-ink-50)]">
        <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--home-accent-text)]" />
        {copy.eyebrow}
      </p>
      <h1 className="home-display-xl mt-5">
        {copy.successTitle}
      </h1>
      <p className="mt-4 max-w-xl text-pretty text-base leading-[1.7] text-[color:var(--home-ink-65)]">
        {successBody}
      </p>

      <div className="mt-8 border-t border-[color:var(--home-line)] pt-6">
        <p className="home-eyebrow text-[color:var(--home-ink-50)]">
          {copy.changedMind}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <Link
            href="/newsletter"
            className="home-focus inline-flex items-center gap-2 rounded-full border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-04)] px-5 py-2.5 font-semibold text-[color:var(--home-ink)] transition hover:border-[color:var(--home-accent)] hover:bg-[color:var(--home-surface-07)]"
          >
            <Mail className="h-3.5 w-3.5" />
            {copy.ctaSubscribeAgain}
          </Link>
          <Link
            href="/preferences"
            className="home-focus inline-flex items-center gap-2 rounded-full px-4 py-2.5 font-semibold text-[color:var(--home-accent-text)] underline-offset-4 hover:underline"
          >
            {copy.ctaManagePrefs}
          </Link>
        </div>
      </div>
    </main>
  );
}
