import type { ComponentType, ReactNode } from "react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function WorkspaceHero({
  eyebrow,
  title,
  description,
  actions,
  accent = "default",
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  accent?: "default" | "soft";
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[2.4rem] border p-8 shadow-[0_22px_80px_rgba(0,0,0,0.08)] backdrop-blur-2xl",
        accent === "soft"
          ? "border-white/10 bg-white/[0.05]"
          : "border-black/10 bg-white/80 dark:border-white/10 dark:bg-white/[0.04]"
      )}
    >
      <div className="pointer-events-none absolute -left-12 top-0 h-56 w-56 rounded-full bg-[color:var(--accent)]/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-7rem] right-[-6rem] h-60 w-60 rounded-full bg-[color:var(--accent-secondary)]/10 blur-3xl" />

      <div className="relative">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
          {eyebrow}
        </div>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-zinc-950 dark:text-white sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-4xl text-sm leading-8 text-zinc-600 dark:text-white/66 sm:text-base">
          {description}
        </p>

        {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}

export function WorkspaceMetricCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article className="rounded-[2rem] border border-black/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.04]">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10">
        <Icon className="h-5 w-5 text-[color:var(--accent)]" />
      </div>
      <div className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
        {label}
      </div>
      <div className="mt-2 text-4xl font-black tracking-[-0.05em] text-zinc-950 dark:text-white">
        {value}
      </div>
      <div className="mt-2 text-sm leading-6 text-zinc-600 dark:text-white/62">{note}</div>
    </article>
  );
}

export function WorkspacePanel({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[2.2rem] border border-black/10 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
        {eyebrow}
      </div>
      <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-zinc-950 dark:text-white">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/64">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function WorkspaceInfoTile({
  label,
  value,
  note,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
}) {
  return (
    <div className="rounded-[1.4rem] border border-black/10 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
        {label}
      </div>
      <div className="mt-2 break-words text-sm font-semibold text-zinc-950 dark:text-white">
        {value}
      </div>
      {note ? (
        <div className="mt-1 text-xs leading-6 text-zinc-500 dark:text-white/45">{note}</div>
      ) : null}
    </div>
  );
}

export function WorkspaceEmptyState({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[1.8rem] border border-dashed border-black/15 bg-black/[0.02] p-8 text-center dark:border-white/10 dark:bg-white/[0.03]">
      <div className="text-lg font-semibold text-zinc-950 dark:text-white">{title}</div>
      <div className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/62">{text}</div>
    </div>
  );
}

export function tonePillClasses(
  tone: "critical" | "warning" | "info" | "success" | "neutral"
) {
  if (tone === "critical") {
    return "border-red-300/30 bg-red-500/10 text-red-700 dark:text-red-100";
  }

  if (tone === "warning") {
    return "border-amber-300/30 bg-amber-500/10 text-amber-700 dark:text-amber-100";
  }

  if (tone === "success") {
    return "border-emerald-300/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100";
  }

  if (tone === "info") {
    return "border-cyan-300/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-100";
  }

  return "border-black/10 bg-black/[0.03] text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70";
}
