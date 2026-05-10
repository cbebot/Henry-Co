/**
 * Client-safe primitives extracted from `workspace-shell.tsx` so client
 * components can import them without dragging the server-only auth
 * helpers from the parent module.
 *
 * The async `WorkspaceShell` itself stays in workspace-shell.tsx (server
 * component); the synchronous primitives below live here so they can be
 * used from anywhere — server pages, client components, or both.
 */

export function SectionCard({
  title,
  body,
  actions,
  children,
}: {
  title: string;
  body?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="jobs-panel rounded-[2rem] p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="jobs-section-title">{title}</h2>
          {body ? <p className="mt-1 text-sm leading-7 text-[var(--jobs-muted)]">{body}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function StatTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="jobs-soft-panel rounded-[1.5rem] p-4">
      <div className="jobs-kicker">{label}</div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
      <p className="mt-2 text-sm leading-6 text-[var(--jobs-muted)]">{detail}</p>
    </div>
  );
}

export function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "good" | "warn" | "danger";
}) {
  const map = {
    neutral: "bg-[var(--jobs-accent-soft)] text-[var(--jobs-ink)]",
    good: "bg-[var(--jobs-success-soft)] text-[var(--jobs-success)]",
    warn: "bg-[var(--jobs-warning-soft)] text-[var(--jobs-warning)]",
    danger: "bg-[var(--jobs-danger-soft)] text-[var(--jobs-danger)]",
  } as const;

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${map[tone]}`}>{label}</span>;
}
