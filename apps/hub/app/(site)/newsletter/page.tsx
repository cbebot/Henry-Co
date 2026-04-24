import type { Metadata } from "next";
import { describeTopicGroupings } from "@henryco/newsletter";
import NewsletterSignupClient from "./NewsletterSignupClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Newsletters — Henry & Co.",
  description:
    "Subscribe to HenryCo newsletters. Pick what's useful, skip what isn't. Unsubscribe any time.",
};

export default function NewsletterPage() {
  const groups = describeTopicGroupings();
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-16 text-[color:var(--foreground)]">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
          Editorial
        </p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight md:text-4xl">
          Newsletters, chosen carefully
        </h1>
        <p className="mt-4 max-w-2xl text-[color:var(--muted-foreground)]">
          We&rsquo;d rather send less and have it matter. Pick one or more topics below. You can
          manage preferences or unsubscribe from every email we send.
        </p>
      </header>

      <NewsletterSignupClient groups={groups} />

      <section className="mt-16 border-t border-[color:var(--border)] pt-8">
        <h2 className="text-lg font-semibold">What we promise</h2>
        <ul className="mt-4 space-y-3 text-sm text-[color:var(--muted-foreground)]">
          <li>&bull; We only email you topics you explicitly opted into.</li>
          <li>&bull; We suppress sends when we see active support, trust, or billing issues.</li>
          <li>&bull; We don&rsquo;t invent stats, testimonials, or urgency.</li>
          <li>&bull; Every email carries a working unsubscribe link.</li>
        </ul>
      </section>
    </main>
  );
}
