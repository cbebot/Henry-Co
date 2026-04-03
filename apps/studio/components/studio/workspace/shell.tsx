import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { StudioNavItem } from "@/lib/studio/navigation";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function StudioWorkspaceShell({
  kicker,
  title,
  description,
  nav,
  actions,
  children,
}: {
  kicker: string;
  title: string;
  description: string;
  nav: StudioNavItem[];
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto grid max-w-[88rem] gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[260px,1fr] lg:px-10">
      <aside className="studio-panel rounded-[2rem] p-4">
        <div className="studio-kicker">{kicker}</div>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[var(--studio-ink)]">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">{description}</p>
        <nav className="mt-6 space-y-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={joinClassNames(
                "flex items-center justify-between rounded-[1.4rem] px-4 py-3 text-sm font-semibold transition",
                item.active
                  ? "bg-[linear-gradient(135deg,#113743,#1d6973)] text-white"
                  : "border border-[var(--studio-line)] bg-black/10 text-[var(--studio-ink)]"
              )}
            >
              <span>{item.label}</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          ))}
        </nav>
      </aside>

      <main className="space-y-6">
        <section className="studio-panel rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="studio-kicker">{kicker}</div>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--studio-ink)]">
                {title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
                {description}
              </p>
            </div>
            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
          </div>
        </section>
        {children}
      </main>
    </div>
  );
}

export function StudioMetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <article className="studio-panel rounded-[1.75rem] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
        {label}
      </p>
      <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[var(--studio-ink)]">
        {value}
      </p>
      <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">{hint}</p>
    </article>
  );
}

export function StudioEmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="studio-panel rounded-[1.75rem] p-8 text-center">
      <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--studio-ink)]">
        {title}
      </h3>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[var(--studio-ink-soft)]">
        {body}
      </p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </section>
  );
}
