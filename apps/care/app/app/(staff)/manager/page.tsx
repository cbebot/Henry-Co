import { ClipboardList, PackageCheck, Truck, Users } from "lucide-react";

const blocks = [
  { title: "Daily operations", icon: ClipboardList, text: "Monitor intake and enforce clean operational discipline." },
  { title: "Status supervision", icon: PackageCheck, text: "Move orders through pickup → cleaning → QA → delivery." },
  { title: "Rider coordination", icon: Truck, text: "Keep pickup and delivery aligned with schedules." },
  { title: "Team oversight", icon: Users, text: "Managers own flow and service consistency — not owner controls." },
];

export default function ManagerPage() {
  return (
    <main className="space-y-8">
      <div className="care-card rounded-[36px] p-10">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--accent)]">Manager</div>
        <h1 className="mt-4 text-5xl font-black tracking-tight">Operations & Execution</h1>
        <p className="mt-4 max-w-3xl text-white/68">
          Your manager dashboard stays focused: execution, coordination, quality. That’s what keeps your permissions clean.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {blocks.map((b) => {
          const Icon = b.icon;
          return (
            <div key={b.title} className="care-card rounded-[32px] p-8">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent)]/12">
                <Icon className="h-6 w-6 text-[color:var(--accent)]" />
              </div>
              <div className="mt-5 text-xl font-semibold">{b.title}</div>
              <p className="mt-3 text-sm leading-7 text-white/68">{b.text}</p>
            </div>
          );
        })}
      </div>
    </main>
  );
}