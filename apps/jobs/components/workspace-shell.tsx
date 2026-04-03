import Link from "next/link";
import {
  BriefcaseBusiness,
  Building2,
  ChartColumnBig,
  ShieldCheck,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { getSharedAccountJobsUrl, getSharedAccountOrigin } from "@/lib/account";

type NavItem = {
  href: string;
  label: string;
};

const AREA_META: Record<
  string,
  {
    icon: LucideIcon;
    label: string;
  }
> = {
  candidate: { icon: UserRound, label: "Candidate module" },
  employer: { icon: Building2, label: "Employer console" },
  recruiter: { icon: BriefcaseBusiness, label: "Recruiter console" },
  moderation: { icon: ShieldCheck, label: "Moderation" },
  analytics: { icon: ChartColumnBig, label: "Analytics" },
};

const accountJobsUrl = getSharedAccountJobsUrl();
const accountHomeUrl = getSharedAccountOrigin();

export function WorkspaceShell({
  area,
  title,
  subtitle,
  nav,
  activeHref,
  accent,
  children,
  rightRail,
}: {
  area: string;
  title: string;
  subtitle: string;
  nav: NavItem[];
  activeHref: string;
  accent: string;
  children: React.ReactNode;
  rightRail?: React.ReactNode;
}) {
  const areaMeta = AREA_META[area] ?? { icon: ChartColumnBig, label: "Jobs surface" };
  const Icon = areaMeta.icon;

  return (
    <div className="jobs-page px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1600px] gap-4 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="jobs-panel rounded-[2rem] p-5">
          <div className="rounded-[1.7rem] p-4 text-white" style={{ background: accent }}>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/15 p-3">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="jobs-kicker !text-white/70">{areaMeta.label}</div>
                <div className="text-lg font-semibold">{title}</div>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-white/78">{subtitle}</p>
          </div>

          <nav className="mt-5 space-y-1.5">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="jobs-sidebar-link" data-active={activeHref === item.href}>
                <Sparkles className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-5 rounded-[1.7rem] bg-[var(--jobs-paper-soft)] p-4">
            <div className="text-sm font-semibold">Shared HenryCo account</div>
            <p className="mt-2 text-sm leading-6 text-[var(--jobs-muted)]">
              Identity, notifications, files, and activity history are linked back into your central HenryCo account.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={accountJobsUrl} className="jobs-button-secondary rounded-full px-4 py-2 text-xs font-semibold">
                Account summary
              </a>
              <a href={accountHomeUrl} className="jobs-button-secondary rounded-full px-4 py-2 text-xs font-semibold">
                Account home
              </a>
            </div>
          </div>
        </aside>

        <section className="min-w-0">{children}</section>

        <aside className="space-y-4">{rightRail}</aside>
      </div>
    </div>
  );
}

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
