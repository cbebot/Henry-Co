import { PageIntro } from "@/components/marketplace/shell";

export const dynamic = "force-dynamic";

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageIntro
        kicker="Help"
        title="Support that resolves, not deflects."
        description="Buyers can track split shipments, sellers see issue context clearly, and the support team works through disputes, returns, delivery delays, and finance escalations with the full history intact."
      />
      <div className="grid gap-5 lg:grid-cols-3">
        {[
          ["Order issues", "Get help with payment verification, split shipments, delivery delays, and missing items."],
          ["Seller help", "Work through onboarding questions, catalog requirements, payout timing, and moderation feedback."],
          ["Trust concerns", "Report suspicious listings, abuse, counterfeit risks, or review manipulation."],
        ].map(([title, body]) => (
          <article key={title} className="market-paper rounded-[1.75rem] p-6">
            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">{body}</p>
          </article>
        ))}
      </div>

      <form action="/api/marketplace" method="POST" className="market-paper rounded-[2rem] p-6 sm:p-8">
        <input type="hidden" name="intent" value="support_thread_create" />
        <input type="hidden" name="return_to" value="/help" />
        <div className="grid gap-4 md:grid-cols-2">
          <input name="contact_name" className="market-input rounded-2xl px-4 py-3" placeholder="Your name" />
          <input name="contact_email" type="email" className="market-input rounded-2xl px-4 py-3" placeholder="Email for replies" required />
          <input name="subject" className="market-input rounded-2xl px-4 py-3 md:col-span-2" placeholder="Support subject" required />
          <textarea name="message" rows={5} className="market-textarea rounded-[1.5rem] px-4 py-3 md:col-span-2" placeholder="Describe the issue, order, vendor, or trust concern in detail." required />
        </div>
        <button className="market-button-primary mt-4 rounded-full px-5 py-3 text-sm font-semibold">Open support thread</button>
      </form>
    </div>
  );
}
