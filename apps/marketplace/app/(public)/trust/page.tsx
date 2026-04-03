import { PageIntro } from "@/components/marketplace/shell";

export const dynamic = "force-dynamic";

export default function TrustPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageIntro
        kicker="Trust & Safety"
        title="Moderation, verification, fraud visibility, and operator accountability are first-class."
        description="HenryCo Marketplace is designed to make trust visible before checkout and operationally auditable after checkout. Vendors, products, reviews, disputes, payouts, and alerts all leave a clearer paper trail."
      />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Trust passports", "Every store and product surfaces verification level, SLA, dispute rate, and fulfillment health."],
          ["Moderation heat", "Low-quality metadata, aggressive price anomalies, repeat media, and complaints show up in operator queues."],
          ["Split-order clarity", "Buyers see which vendor owns which fulfillment segment before confusion turns into support load."],
          ["Audit trails", "Approvals, rejections, payout actions, and dispute decisions are designed to be logged server-side."],
        ].map(([title, body]) => (
          <article key={title} className="market-paper rounded-[1.75rem] p-6">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--market-ink)]">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">{body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
