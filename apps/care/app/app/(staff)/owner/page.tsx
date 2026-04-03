import { BadgeCheck, Settings, ShieldCheck, Star, Users } from "lucide-react";

const cards = [
  { title: "Bookings & status control", icon: BadgeCheck, text: "Oversee all bookings and push status updates through the full pipeline." },
  { title: "Pricing control", icon: Settings, text: "Maintain live pricing without redeploys. Everything stays synchronized." },
  { title: "Review approvals", icon: Star, text: "Approve reviews so only real, trusted stories appear publicly." },
  { title: "Staff access control", icon: Users, text: "Role-based permissions — clean, strict, scalable." },
  { title: "Security", icon: ShieldCheck, text: "Owner-only actions remain isolated here for safety." },
];

export default function OwnerPage() {
  return (
    <main className="space-y-8">
      <div className="care-card rounded-[36px] p-10">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--accent)]">Owner</div>
        <h1 className="mt-4 text-5xl font-black tracking-tight">Care Division Command</h1>
        <p className="mt-4 max-w-3xl text-white/68">
          This is your control layer. The best long-term structure is **one staff foundation + role gates**,
          not duplicated dashboards everywhere.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.title} className="care-card rounded-[32px] p-8">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent)]/12">
                <Icon className="h-6 w-6 text-[color:var(--accent)]" />
              </div>
              <div className="mt-5 text-xl font-semibold">{c.title}</div>
              <p className="mt-3 text-sm leading-7 text-white/68">{c.text}</p>
            </div>
          );
        })}
      </div>
    </main>
  );
}