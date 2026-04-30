import Link from "next/link";
import { ArrowRight, BadgeAlert, ClipboardList, MessageSquare, ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default function HelpPage() {
  const channels = [
    {
      icon: ClipboardList,
      title: "Order issues",
      body: "Get help with payment verification, split shipments, delivery delays, and missing items.",
    },
    {
      icon: BadgeAlert,
      title: "Seller help",
      body: "Work through onboarding questions, catalog requirements, payout timing, and moderation feedback.",
    },
    {
      icon: ShieldAlert,
      title: "Trust concerns",
      body: "Report suspicious listings, abuse, counterfeit risks, or review manipulation.",
    },
  ] as const;

  return (
    <main className="mx-auto max-w-7xl space-y-14 px-4 py-10 sm:px-6 lg:px-8">
      <section>
        <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
          <div>
            <p className="market-kicker text-[10.5px] uppercase tracking-[0.32em]">Help</p>
            <h1 className="mt-4 text-balance text-[2.2rem] font-semibold leading-[1.06] tracking-[-0.025em] text-[var(--market-ink)] sm:text-[2.7rem] md:text-[3.1rem]">
              Support that resolves, not deflects.
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--market-muted)]">
              Buyers can track split shipments, sellers see issue context clearly, and the support
              team works through disputes, returns, delivery delays, and finance escalations with
              the full history intact.
            </p>
          </div>
          <ul className="grid gap-3 text-sm">
            {[
              { label: "History", value: "Order, payout, and dispute trail" },
              { label: "Routing", value: "Buyer · seller · trust paths" },
              { label: "Continuity", value: "One thread per concern" },
            ].map((item) => (
              <li
                key={item.label}
                className="flex items-baseline gap-3 border-b border-[var(--market-line)] py-3 last:border-b-0"
              >
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                  {item.label}
                </span>
                <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--market-ink)]">
                  {item.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <p className="market-kicker text-[10.5px] uppercase tracking-[0.28em]">Choose the path</p>
        <ul className="mt-8 grid gap-10 lg:grid-cols-3 lg:divide-x lg:divide-[var(--market-line)]">
          {channels.map((item, i) => {
            const Icon = item.icon;
            return (
              <li key={item.title} className={i > 0 ? "lg:pl-10" : ""}>
                <Icon className="h-5 w-5 text-[var(--market-brass)]" aria-hidden />
                <h2 className="mt-4 text-lg font-semibold tracking-tight text-[var(--market-ink)]">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">{item.body}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <div className="grid gap-10 xl:grid-cols-[1.05fr,0.95fr] xl:items-start">
          <div>
            <p className="market-kicker text-[10.5px] uppercase tracking-[0.28em]">
              Open a support thread
            </p>
            <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-ink)] sm:text-[1.85rem]">
              Tell us what happened, attach the order if relevant.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--market-muted)]">
              Subject + a clear description routes faster than a one-line message. Order numbers,
              vendor names, and timestamps help support reach the right desk on the first reply.
            </p>
          </div>
          <form
            action="/api/marketplace"
            method="POST"
            className="grid gap-4 rounded-[1.8rem] border border-[var(--market-line)] bg-[var(--market-bg-soft)] p-6 sm:p-8"
          >
            <input type="hidden" name="intent" value="support_thread_create" />
            <input type="hidden" name="return_to" value="/help" />
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-1 text-sm">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                  Your name
                </span>
                <input
                  name="contact_name"
                  className="market-input rounded-2xl px-4 py-3"
                  placeholder="First and last name"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                  Reply email
                </span>
                <input
                  name="contact_email"
                  type="email"
                  required
                  className="market-input rounded-2xl px-4 py-3"
                  placeholder="email@example.com"
                />
              </label>
              <label className="grid gap-1 text-sm md:col-span-2">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                  Subject
                </span>
                <input
                  name="subject"
                  required
                  className="market-input rounded-2xl px-4 py-3"
                  placeholder="e.g. Refund stuck after split shipment delivery"
                />
              </label>
              <label className="grid gap-1 text-sm md:col-span-2">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                  Detail
                </span>
                <textarea
                  name="message"
                  rows={5}
                  className="market-textarea rounded-[1.5rem] px-4 py-3"
                  placeholder="Describe the issue, order, vendor, or trust concern in detail."
                  required
                />
              </label>
            </div>
            <button className="market-button-primary inline-flex w-fit items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold">
              <MessageSquare className="h-4 w-4" /> Open support thread
            </button>
          </form>
        </div>
      </section>

      <section className="border-t border-[var(--market-line)] pt-10">
        <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr] lg:items-end">
          <div>
            <p className="market-kicker text-[10.5px] uppercase tracking-[0.28em]">Already a buyer?</p>
            <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-ink)] sm:text-[1.85rem]">
              Account threads keep order context attached.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--market-muted)]">
              Open a thread from inside your order so the agent sees the full payment and shipment
              picture without you re-typing it.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link
              href="/account/orders"
              className="market-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            >
              View my orders
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/trust"
              className="market-button-secondary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            >
              Trust standards
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
