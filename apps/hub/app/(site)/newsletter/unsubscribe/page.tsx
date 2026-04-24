import type { Metadata } from "next";
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
      <main className="mx-auto w-full max-w-xl px-5 py-16 text-[color:var(--foreground)]">
        <h1 className="text-2xl font-semibold">Unsubscribe link missing</h1>
        <p className="mt-3 text-[color:var(--muted-foreground)]">
          Open the &ldquo;Unsubscribe&rdquo; link from any HenryCo email to land here with a valid
          token.
        </p>
      </main>
    );
  }

  const result = await unsubscribeByToken(token);
  if (!result.ok) {
    return (
      <main className="mx-auto w-full max-w-xl px-5 py-16 text-[color:var(--foreground)]">
        <h1 className="text-2xl font-semibold">We couldn&rsquo;t unsubscribe you</h1>
        <p className="mt-3 text-[color:var(--muted-foreground)]">{result.message}</p>
        <p className="mt-4 text-sm text-[color:var(--muted-foreground)]">
          If this keeps happening, reply &ldquo;unsubscribe&rdquo; to any HenryCo email and our team
          will honor it manually.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-xl px-5 py-16 text-[color:var(--foreground)]">
      <h1 className="text-2xl font-semibold">You&rsquo;re unsubscribed</h1>
      <p className="mt-3 text-[color:var(--muted-foreground)]">
        {result.email} won&rsquo;t receive HenryCo newsletters. Transactional messages (receipts,
        shipping, verification, security) still send because we have to.
      </p>
      <p className="mt-4 text-sm text-[color:var(--muted-foreground)]">
        Changed your mind?{" "}
        <a href="/newsletter" className="underline decoration-dotted underline-offset-4">
          Subscribe again
        </a>
        .
      </p>
    </main>
  );
}
