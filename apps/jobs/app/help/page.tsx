import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { BRAND_EMAILS } from "@henryco/config";
import { translateSurfaceLabel } from "@henryco/i18n";
import { PublicShell } from "@/components/public-shell";
import { getSharedAccountJobsUrl } from "@/lib/account";
import { getJobsViewer } from "@/lib/auth";
import { getJobsPublicLocale } from "@/lib/locale-server";

const accountJobsUrl = getSharedAccountJobsUrl();

const sections: { id: string; question: string; answer: string }[] = [
  {
    id: "apply",
    question: "How does applying work?",
    answer:
      "Open any role, read the full description, then sign in with your Henry Onyx account when you are ready. You will send one application from your candidate profile—cover note, availability, and pay expectations if you choose. After you submit, the role moves into your Applications list with a visible stage (reviewing, shortlisted, interview, and so on). You can always see whether you already applied.",
  },
  {
    id: "shortlist",
    question: "What does “saved” or shortlist mean?",
    answer:
      "Saving a job is a private bookmark. It does not tell the employer you are interested yet. It keeps the role in your Saved jobs list so you can compare options and come back when you have time to write a strong application.",
  },
  {
    id: "stages",
    question: "What do the application stages mean?",
    answer:
      "Stages are the hiring team’s way of showing progress. “Reviewing” means your application is in the queue. “Shortlisted” usually means you passed an early fit check and they want a closer look or conversation. “Interview” is active conversations. “Offer” and “hired” are self-explanatory; “rejected” closes the lane for that role—we still encourage you to refine your profile and try other fits.",
  },
  {
    id: "verification",
    question: "What does employer verification mean?",
    answer:
      "Verified employers have passed a review of identity and intent—not just a paid badge. If someone is still “pending,” they may be new or mid-review. We still moderate individual posts so a verified label is not a free pass to post anything.",
  },
  {
    id: "review",
    question: "Why was my post or employer profile held for review?",
    answer:
      "Usually for quality or safety: unclear job details, mismatch with the company, or patterns that look like spam. Employers get a reason when we need a fix. Candidates see fewer broken or misleading roles as a result.",
  },
  {
    id: "sync",
    question: "Where do my jobs show up in Henry Onyx?",
    answer:
      "Applications, saved roles, and updates all appear in your Henry Onyx account. Jobs is the best place to track your hiring activity, and the account dashboard shows your activity across all Henry Onyx services.",
  },
  {
    id: "whatsapp",
    question: "Why might WhatsApp updates not arrive?",
    answer:
      "Messaging apps sometimes hold or delay messages outside an active conversation window. Email and in-app notifications are always on — contact support if WhatsApp updates are missing.",
  },
];

export const dynamic = "force-dynamic";

export default async function HelpPage() {
  const locale = await getJobsPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const viewer = await getJobsViewer();

  return (
    <PublicShell
      primaryCta={{ label: t("Browse jobs"), href: "/jobs" }}
      secondaryCta={
        viewer.user
          ? { label: t("Candidate hub"), href: "/candidate" }
          : { label: t("Join to apply"), href: "/jobs" }
      }
    >
      <div className="mx-auto max-w-5xl space-y-14 px-4 py-12 sm:px-6 lg:px-8">
        <section>
          <p className="jobs-kicker">{t("Help")}</p>
          <h1 className="mt-4 jobs-display max-w-3xl text-balance">
            {t("Straight answers about Jobs.")}
          </h1>
          {/* READING-02: hero body in the editorial serif reading face
              (--jobs-muted already aliases to the ink-70 equivalent). */}
          <p className="hc-font-reading mt-5 max-w-2xl text-pretty text-base leading-8 text-[var(--jobs-muted)]">
            {t("Candidates and employers use the same platform with different workspaces. If something here does not match what you see on screen, contact")}{" "}
            <a
              className="font-semibold text-[var(--jobs-accent)] underline-offset-4 hover:underline"
              href={`mailto:${BRAND_EMAILS.jobs}`}
            >
              {BRAND_EMAILS.jobs}
            </a>
            .
          </p>
          <nav aria-label={t("Topics")} className="mt-7 flex flex-wrap gap-2 text-sm">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-full border border-[var(--jobs-line)] bg-[var(--jobs-paper-soft)] px-3.5 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-[var(--jobs-muted)] transition hover:border-[var(--jobs-accent)] hover:text-[var(--jobs-ink)]"
              >
                {t(s.question.replace(/\?$/, ""))}
              </a>
            ))}
          </nav>
        </section>

        <section>
          <p className="jobs-kicker">{t("Topics")}</p>
          <ul className="mt-6 divide-y divide-[var(--jobs-line)] border-y border-[var(--jobs-line)]">
            {sections.map((item, i) => (
              <li
                key={item.id}
                id={item.id}
                className="scroll-mt-28 grid gap-3 py-6 sm:grid-cols-[auto,1fr] sm:gap-8"
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-accent)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-[var(--jobs-ink)]">
                    {t(item.question)}
                  </h2>
                  {/* READING-02: FAQ answers read in the serif face (hub
                      home-faq precedent); ink stays host-owned. */}
                  <p className="hc-font-reading text-pretty mt-2 max-w-3xl text-sm leading-7 text-[var(--jobs-muted)]">
                    {t(item.answer)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-[var(--jobs-line)] pt-10">
          <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr] lg:items-end">
            <div>
              <p className="jobs-kicker">{t("Henry Onyx account")}</p>
              <h2 className="mt-3 jobs-heading max-w-xl text-balance">
                {t("Jobs activity lives alongside the rest of your account.")}
              </h2>
              {/* READING-02: section intro in the serif reading face. */}
              <p className="hc-font-reading text-pretty mt-3 max-w-xl text-sm leading-7 text-[var(--jobs-muted)]">
                {t("Wallet, documents, and other services may live under the same Henry Onyx account. The hub gives you the full picture without bouncing between sites.")}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link
                href={accountJobsUrl}
                className="jobs-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition hover:-translate-y-0.5"
              >
                {t("Open account hub")}
                <ExternalLink className="h-4 w-4" />
              </Link>
              <Link
                href="/jobs"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--jobs-line)] px-5 py-3 text-sm font-semibold text-[var(--jobs-ink)] transition hover:border-[var(--jobs-accent)]/40"
              >
                {t("Back to jobs")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
