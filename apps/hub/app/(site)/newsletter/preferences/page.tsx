import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { describeTopicGroupings } from "@henryco/newsletter";
import { loadPreferencesByToken } from "@/lib/newsletter/service";
import NewsletterPreferencesClient from "./NewsletterPreferencesClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manage newsletter preferences — Henry Onyx",
  description:
    "Update which Henry Onyx newsletters you receive, pause promotional sends, or unsubscribe entirely.",
};

type SearchParams = {
  token?: string;
};

export default async function NewsletterPreferencesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const token = params.token;
  if (!token) {
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-16 text-[color:var(--home-ink)]">
        <h1 className="home-display">Preference link missing</h1>
        <p className="mt-3 text-[color:var(--home-ink-65)]">
          Open the &ldquo;Manage preferences&rdquo; link from any Henry Onyx email to land here with a
          valid token. If your link has expired, subscribe again and we&rsquo;ll issue a new one.
        </p>
      </main>
    );
  }

  const load = await loadPreferencesByToken(token);
  if (!load.ok) {
    if (load.code === "not_found") return notFound();
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-16 text-[color:var(--home-ink)]">
        <h1 className="home-display">
          {load.code === "expired_token" ? "Link expired" : "Link not valid"}
        </h1>
        <p className="mt-3 text-[color:var(--home-ink-65)]">{load.message}</p>
      </main>
    );
  }

  const groups = describeTopicGroupings();
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-16 text-[color:var(--home-ink)]">
      <header className="mb-8">
        <p className="home-eyebrow text-[color:var(--home-accent-text)]">
          Preference center
        </p>
        <h1 className="home-display mt-3">Your newsletter preferences</h1>
        <p className="mt-3 text-[color:var(--home-ink-65)]">
          Signed in as <span className="font-medium text-[color:var(--home-ink)]">{load.subscriber.email}</span>. Changes
          apply to all Henry Onyx divisions.
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
