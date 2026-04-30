import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Mail, MailX } from "lucide-react";
import { unsubscribeByToken } from "@/lib/newsletter/service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Unsubscribe — Henry & Co.",
  description: "One-click unsubscribe from HenryCo newsletters.",
};

type SearchParams = {
  token?: string;
};

export default async function NewsletterUnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const token = params.token;

  if (!token) {
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-20 text-[color:var(--foreground)]">
        <p className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[color:var(--muted-foreground)]">
          <MailX className="h-3.5 w-3.5" />
          Newsletter
        </p>
        <h1 className="mt-5 text-balance text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
          Unsubscribe link missing.
        </h1>
        <p className="mt-4 max-w-xl text-pretty text-base leading-[1.7] text-[color:var(--muted-foreground)]">
          Open the &ldquo;Unsubscribe&rdquo; link from any HenryCo email to land here with a valid
          token. If your link has expired, contact us and we&rsquo;ll honor it manually.
        </p>
        <div className="mt-7 flex flex-wrap gap-3 text-sm">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] px-5 py-2.5 font-semibold text-[color:var(--foreground)] transition hover:border-[color:var(--foreground)]/40"
          >
            Contact support
          </Link>
          <Link
            href="/newsletter"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 font-semibold text-[color:var(--foreground)] underline-offset-4 hover:underline"
          >
            Back to newsletters
          </Link>
        </div>
      </main>
    );
  }

  const result = await unsubscribeByToken(token);

  if (!result.ok) {
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-20 text-[color:var(--foreground)]">
        <p className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[color:var(--muted-foreground)]">
          <MailX className="h-3.5 w-3.5" />
          Newsletter
        </p>
        <h1 className="mt-5 text-balance text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
          We couldn&rsquo;t unsubscribe you.
        </h1>
        <p className="mt-4 max-w-xl text-pretty text-base leading-[1.7] text-[color:var(--muted-foreground)]">
          {result.message}
        </p>
        <div className="mt-6 border-l-2 border-[color:var(--border)] pl-5 text-sm leading-7 text-[color:var(--muted-foreground)]">
          If this keeps happening, reply &ldquo;unsubscribe&rdquo; to any HenryCo email and our team
          will honor it manually.
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-20 text-[color:var(--foreground)]">
      <p className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[color:var(--muted-foreground)]">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Newsletter
      </p>
      <h1 className="mt-5 text-balance text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
        You&rsquo;re unsubscribed.
      </h1>
      <p className="mt-4 max-w-xl text-pretty text-base leading-[1.7] text-[color:var(--muted-foreground)]">
        {result.email} won&rsquo;t receive HenryCo newsletters. Transactional messages (receipts,
        shipping, verification, security) still send because we have to.
      </p>

      <div className="mt-8 border-t border-[color:var(--border)] pt-6">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
          Changed your mind?
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <Link
            href="/newsletter"
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] px-5 py-2.5 font-semibold text-[color:var(--foreground)] transition hover:border-[color:var(--foreground)]/40"
          >
            <Mail className="h-3.5 w-3.5" />
            Subscribe again
          </Link>
          <Link
            href="/preferences"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 font-semibold text-[color:var(--foreground)] underline-offset-4 hover:underline"
          >
            Manage all preferences
          </Link>
        </div>
      </div>
    </main>
  );
}
