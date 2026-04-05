import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { getSharedAccountJobsUrl } from "@/lib/account";
import { getJobsViewer } from "@/lib/auth";

const accountJobsUrl = getSharedAccountJobsUrl();

const sections: { id: string; question: string; answer: string }[] = [
  {
    id: "apply",
    question: "How does applying work?",
    answer:
      "Open any role, read the full description, then sign in with your HenryCo account when you are ready. You will send one application from your candidate profile—cover note, availability, and pay expectations if you choose. After you submit, the role moves into your Applications list with a visible stage (reviewing, shortlisted, interview, and so on). You can always see whether you already applied.",
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
    question: "Where do my jobs show up in HenryCo?",
    answer:
      "Applications, saved roles, and updates all appear in your HenryCo account. Jobs is the best place to track your hiring activity, and the account dashboard shows your activity across all HenryCo services.",
  },
  {
    id: "whatsapp",
    question: "Why might WhatsApp updates not arrive?",
    answer:
      "Messaging platforms sometimes block business messages without an approved template or an open support window. Email and in-app notifications stay on, and we log delivery issues so support can help.",
  },
];

export const dynamic = "force-dynamic";

export default async function HelpPage() {
  const viewer = await getJobsViewer();

  return (
    <PublicShell
      primaryCta={{ label: "Browse jobs", href: "/jobs" }}
      secondaryCta={
        viewer.user ? { label: "Candidate hub", href: "/candidate" } : { label: "Join to apply", href: "/jobs" }
      }
    >
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="jobs-panel rounded-[2.2rem] p-8">
          <p className="jobs-kicker">Help</p>
          <h1 className="mt-3 jobs-heading text-balance">Straight answers about Jobs</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--jobs-muted)]">
            Candidates and employers use the same platform with different workspaces. If something here does not match
            what you see on screen, contact{" "}
            <a className="font-semibold text-[var(--jobs-accent)] underline" href="mailto:jobs@henrycogroup.com">
              jobs@henrycogroup.com
            </a>
            .
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-sm">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-full border border-[var(--jobs-line)] bg-[var(--jobs-paper-soft)] px-3 py-1 font-medium text-[var(--jobs-ink)] transition hover:bg-[var(--jobs-accent-soft)]"
              >
                {s.question.replace(/\?$/, "")}
              </a>
            ))}
          </div>
        </div>

        {sections.map((item) => (
          <div key={item.id} id={item.id} className="jobs-panel scroll-mt-28 rounded-[2rem] p-6">
            <h2 className="text-lg font-semibold">{item.question}</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--jobs-muted)]">{item.answer}</p>
          </div>
        ))}

        <div className="jobs-panel rounded-[2rem] p-6">
          <h2 className="text-lg font-semibold">HenryCo account</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--jobs-muted)]">
            Wallet, documents, and other services may live under the same account. For the full account overview, open
            your HenryCo account hub.
          </p>
          <Link href={accountJobsUrl} className="mt-4 inline-flex text-sm font-semibold text-[var(--jobs-accent)]">
            Open account hub →
          </Link>
        </div>
      </div>
    </PublicShell>
  );
}
