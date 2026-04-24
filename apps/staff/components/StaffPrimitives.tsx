import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Headphones,
  Heart,
  ShoppingBag,
  Palette,
  Briefcase,
  GraduationCap,
  Building2,
  Truck,
  Cog,
  DollarSign,
  Users,
  Settings,
  ShieldCheck,
  Activity,
  type LucideIcon,
} from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Headphones,
  Heart,
  ShoppingBag,
  Palette,
  Briefcase,
  GraduationCap,
  Building2,
  Truck,
  Cog,
  DollarSign,
  Users,
  Settings,
  ShieldCheck,
  Activity,
};

export function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] || LayoutDashboard;
}

export function StaffPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="staff-kicker mb-1.5">{eyebrow}</p>}
        <h1 className="text-2xl font-bold tracking-tight text-[var(--staff-ink)] sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--staff-muted)]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  );
}

export function StaffPanel({
  title,
  children,
  className = "",
  id,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div id={id} className={`staff-card p-5 sm:p-6 ${className}`}>
      {title && (
        <h2 className="mb-4 text-sm font-semibold tracking-tight text-[var(--staff-ink)]">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}

export function StaffEmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--staff-accent-soft)]">
        <Icon className="h-7 w-7 text-[var(--staff-accent)]" />
      </div>
      <h3 className="text-base font-semibold text-[var(--staff-ink)]">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--staff-muted)]">
        {description}
      </p>
    </div>
  );
}

export function StaffMetricCard({
  label,
  value,
  subtitle,
  icon: Icon,
  href,
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  href?: string;
}) {
  const content = (
    <>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--staff-gold-soft)]">
        <Icon className="h-5 w-5 text-[var(--staff-gold)]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-[var(--staff-muted)]">{label}</p>
        <p className="mt-0.5 text-2xl font-bold tracking-tight text-[var(--staff-ink)]">
          {value}
        </p>
        {subtitle && (
          <p className="mt-0.5 text-xs text-[var(--staff-muted)]">{subtitle}</p>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className="staff-card flex items-start gap-4 p-5 transition-all hover:border-[var(--staff-gold)]/35 hover:bg-[var(--staff-gold-soft)]"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="staff-card flex items-start gap-4 p-5">
      {content}
    </div>
  );
}

export function StaffStatusBadge({
  label,
  tone = "info",
}: {
  label: string;
  tone?: "info" | "success" | "warning" | "critical";
}) {
  const colors: Record<string, string> = {
    info: "bg-[var(--staff-accent-soft)] text-[var(--staff-accent)]",
    success: "bg-[var(--staff-success-soft)] text-[var(--staff-success)]",
    warning: "bg-[var(--staff-warning-soft)] text-[var(--staff-warning)]",
    critical: "bg-[var(--staff-critical-soft)] text-[var(--staff-critical)]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[tone]}`}
    >
      {label}
    </span>
  );
}

export function StaffQuickLink({
  href,
  label,
  description,
  icon: Icon,
}: {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <a
      href={href}
      className="group flex items-start gap-4 rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] p-4 transition-all hover:border-[var(--staff-gold)]/30 hover:bg-[var(--staff-gold-soft)]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--staff-accent-soft)] transition-colors group-hover:bg-[var(--staff-gold-soft)]">
        <Icon className="h-5 w-5 text-[var(--staff-accent)] transition-colors group-hover:text-[var(--staff-gold)]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--staff-ink)]">{label}</p>
        <p className="mt-0.5 text-xs text-[var(--staff-muted)]">{description}</p>
      </div>
    </a>
  );
}
