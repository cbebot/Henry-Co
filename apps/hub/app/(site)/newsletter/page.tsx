import type { Metadata } from "next";
import { describeTopicGroupings } from "@henryco/newsletter";
import { getHubNewsletterCopy } from "@henryco/i18n";
import { getHubPublicLocale } from "@/lib/locale-server";
import NewsletterSignupClient from "./NewsletterSignupClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getHubPublicLocale();
  const copy = getHubNewsletterCopy(locale).page;
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
  };
}

export default async function NewsletterPage() {
  const locale = await getHubPublicLocale();
  const copy = getHubNewsletterCopy(locale).page;
  const groups = describeTopicGroupings();
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-16 text-[color:var(--foreground)]">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
          {copy.kicker}
        </p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight md:text-4xl">
          {copy.title}
        </h1>
        <p className="mt-4 max-w-2xl text-[color:var(--muted-foreground)]">
          {copy.intro}
        </p>
      </header>

      <NewsletterSignupClient groups={groups} />

      <section className="mt-16 border-t border-[color:var(--border)] pt-8">
        <h2 className="text-lg font-semibold">{copy.promiseHeading}</h2>
        <ul className="mt-4 space-y-3 text-sm text-[color:var(--muted-foreground)]">
          <li>&bull; {copy.promiseOptIn}</li>
          <li>&bull; {copy.promiseSuppress}</li>
          <li>&bull; {copy.promiseNoInvent}</li>
          <li>&bull; {copy.promiseUnsubscribe}</li>
        </ul>
      </section>
    </main>
  );
}
