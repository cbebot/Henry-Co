import { PublicShell } from "@/components/public-shell";
import { getSharedAccountJobsUrl } from "@/lib/account";

const accountJobsUrl = getSharedAccountJobsUrl();

export default function HelpPage() {
  return (
    <PublicShell primaryCta={{ label: "Open account summary", href: accountJobsUrl }} secondaryCta={{ label: "Open candidate module", href: "/candidate" }}>
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-10 sm:px-6 lg:px-8">
        <div className="jobs-panel rounded-[2.2rem] p-8">
          <p className="jobs-kicker">Help</p>
          <h1 className="mt-3 jobs-heading">Straight answers for candidates and employers.</h1>
        </div>
        {[
          {
            question: "How do saved jobs and applications sync into the HenryCo account?",
            answer:
              "Jobs activity is written into the shared customer activity, notifications, support, and document spine so the unified HenryCo account can render your hiring history without backfill work.",
          },
          {
            question: "What makes an employer verified?",
            answer:
              "Verification state combines profile quality, identity proof, website confidence, response discipline, and moderation review. It is visible on employer pages and recruiter surfaces.",
          },
          {
            question: "Why might WhatsApp not deliver?",
            answer:
              "Meta may block proactive business-initiated delivery without an approved template or an open customer service window. When that happens, HenryCo Jobs keeps email and in-app notifications active and logs the exact failure reason.",
          },
        ].map((item) => (
          <div key={item.question} className="jobs-panel rounded-[2rem] p-6">
            <h2 className="text-lg font-semibold">{item.question}</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--jobs-muted)]">{item.answer}</p>
          </div>
        ))}
      </div>
    </PublicShell>
  );
}
