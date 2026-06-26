import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { describeTopicGroupings } from "@henryco/newsletter";
import { getHubNewsletterCopy } from "@henryco/i18n";
import { getHubPublicLocale } from "@/lib/locale-server";
import { loadPreferencesByToken } from "@/lib/newsletter/service";
import NewsletterPreferencesClient from "./NewsletterPreferencesClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getHubPublicLocale();
  const copy = getHubNewsletterCopy(locale).prefPage;
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
  };
}

type SearchParams = {
  token?: string;
};

export default async function NewsletterPreferencesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const locale = await getHubPublicLocale();
  const copy = getHubNewsletterCopy(locale).prefPage;
  const token = params.token;
  if (!token) {
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-16 text-[color:var(--foreground)]">
        <h1 className="text-2xl font-semibold">{copy.missingTitle}</h1>
        <p className="mt-3 text-[color:var(--muted-foreground)]">
          {copy.missingBody}
        </p>
      </main>
    );
  }

  const load = await loadPreferencesByToken(token);
  if (!load.ok) {
    if (load.code === "not_found") return notFound();
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-16 text-[color:var(--foreground)]">
        <h1 className="text-2xl font-semibold">
          {load.code === "expired_token" ? copy.expiredTitle : copy.notValidTitle}
        </h1>
        <p className="mt-3 text-[color:var(--muted-foreground)]">{load.message}</p>
      </main>
    );
  }

  const groups = describeTopicGroupings();
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-16 text-[color:var(--foreground)]">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
          {copy.kicker}
        </p>
        <h1 className="mt-3 text-2xl font-semibold">{copy.title}</h1>
        <p className="mt-3 text-[color:var(--muted-foreground)]">
          {copy.signedInPrefix} <span className="font-medium">{load.subscriber.email}</span>.{" "}
          {copy.signedInSuffix}
        </p>
      </header>
      <NewsletterPreferencesClient
        token={token}
        initialTopicKeys={load.topicKeys}
        initialStatus={load.subscriber.status}
        locale={load.subscriber.locale}
        country={load.subscriber.country}
        groups={groups}
        email={load.subscriber.email}
      />
    </main>
  );
}
