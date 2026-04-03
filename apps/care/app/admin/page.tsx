import {
  Settings,
  Tags,
  MessageSquareQuote,
  PackageSearch,
  Building2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const cards = [
  {
    id: "settings",
    icon: Settings,
    title: "Public Content Settings",
    text: "Hero copy, about text, support phone, support email, pickup hours, and pricing notes.",
  },
  {
    id: "pricing",
    icon: Tags,
    title: "Pricing Control",
    text: "Create, edit, reorder, feature, and disable pricing items without redeploying the site.",
  },
  {
    id: "reviews",
    icon: MessageSquareQuote,
    title: "Review Approval",
    text: "Approve customer reviews before they go live on the public homepage.",
  },
  {
    id: "bookings",
    icon: PackageSearch,
    title: "Bookings & Tracking",
    text: "Manage incoming bookings, update statuses, and keep the tracking experience clean.",
  },
  {
    id: "divisions",
    icon: Building2,
    title: "Division Management",
    text: "Grow Henry & Co. by adding more business divisions to the ecosystem over time.",
  },
];

export default function CareAdminPage() {
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] p-8">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[color:var(--accent)]/10 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#F2D77A]">
            <ShieldCheck className="h-4 w-4" />
            Admin shell ready
          </div>

          <h1 className="mt-4 text-4xl font-black tracking-[-0.03em]">
            Control center for Fabric Care
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/65 sm:text-base">
            This is the right base. From here, we wire real CRUD for settings, pricing, reviews,
            bookings, and company divisions without rebuilding the public experience from scratch.
          </p>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.id}
              id={card.id}
              className="rounded-[28px] border border-white/10 bg-white/[0.04] p-7 transition hover:-translate-y-1 hover:border-[color:var(--accent)]/25 hover:bg-white/[0.05]"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10">
                <Icon className="h-6 w-6 text-[#F2D77A]" />
              </div>

              <h2 className="mt-5 text-2xl font-bold tracking-[-0.02em]">{card.title}</h2>
              <p className="mt-3 text-sm leading-7 text-white/65">{card.text}</p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/55">
                <Sparkles className="h-4 w-4 text-[#F2D77A]" />
                Ready for live wiring
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
