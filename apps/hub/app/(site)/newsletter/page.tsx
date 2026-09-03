import type { Metadata } from "next";
import { describeTopicGroupings } from "@henryco/newsletter";
import { getHubPublicCopy } from "@henryco/i18n/server";
import { getHubPublicLocale } from "../../../lib/locale-server";
import NewsletterSignupClient from "./NewsletterSignupClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Newsletters — Henry Onyx",
  description:
    "Subscribe to Henry Onyx newsletters. Pick what's useful, skip what isn't. Unsubscribe any time.",
};

export default async function NewsletterPage() {
  const locale = await getHubPublicLocale();
  const copy = getHubPublicCopy(locale).newsletter;
  const groups = describeTopicGroupings();

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-16 text-[color:var(--home-ink)]">
      <header className="mb-10">
        <p className="home-eyebrow text-[color:var(--home-accent-text)]">{copy.eyebrow}</p>
        <h1 className="home-display mt-3">{copy.title}</h1>
        <p className="home-lede mt-4 max-w-2xl">{copy.intro}</p>
      </header>

      <NewsletterSignupClient groups={groups} copy={copy.form} />

      <section className="mt-16 border-t border-[color:var(--home-line)] pt-8">
        <h2 className="home-title">{copy.promiseTitle}</h2>
        <ul className="mt-4 space-y-3 text-sm text-[color:var(--home-ink-65)]">
          {copy.promises.map((promise) => (
            <li key={promise} className="flex gap-3">
              <span
                aria-hidden
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--home-accent)]"
              />
              <span>{promise}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
