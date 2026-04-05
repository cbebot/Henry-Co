import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

export function OwnerPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <section className="acct-card relative overflow-hidden p-6 sm:p-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--owner-accent)_0%,rgba(201,162,39,0.2)_100%)]" />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl">
          <p className="acct-kicker text-[var(--owner-accent)]">{eyebrow}</p>
          <h1 className="acct-display mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--acct-ink)] sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--acct-muted)] sm:text-[0.95rem]">
            {description}
          </p>
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}

export function OwnerPanel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`acct-card p-5 sm:p-6 ${className}`.trim()}>
      <div className="owner-section-header">
        <div>
          <h2 className="text-lg font-semibold text-[var(--acct-ink)]">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-[var(--acct-muted)]">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function OwnerNotice({
  tone = "info",
  title,
  body,
}: {
  tone?: "info" | "warning" | "critical" | "good";
  title: string;
  body: string;
}) {
  const toneClass =
    tone === "critical"
      ? "border-[var(--acct-red)]/20 bg-[var(--acct-red-soft)] text-[var(--acct-red)]"
      : tone === "warning"
        ? "border-[var(--acct-orange)]/20 bg-[var(--acct-orange-soft)] text-[var(--acct-orange)]"
        : tone === "good"
          ? "border-[var(--acct-green)]/20 bg-[var(--acct-green-soft)] text-[var(--acct-green)]"
          : "border-[var(--acct-blue)]/20 bg-[var(--acct-blue-soft)] text-[var(--acct-blue)]";

  return (
    <div className={`rounded-[1.35rem] border px-4 py-3 ${toneClass}`.trim()}>
      <div className="text-sm font-semibold">{title}</div>
      <p className="mt-1 text-sm leading-6 opacity-90">{body}</p>
    </div>
  );
}

export function OwnerQuickLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-[1.2rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-4 py-3 text-sm font-medium text-[var(--acct-ink)] transition-all hover:border-[var(--owner-accent)]/30 hover:shadow-[var(--acct-shadow)]"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--owner-accent-soft)] text-[var(--owner-accent)]">
        <Icon size={18} />
      </span>
      <span className="flex-1">{label}</span>
      <ArrowUpRight size={16} className="text-[var(--acct-muted)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  );
}
