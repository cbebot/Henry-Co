import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
};

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="acct-empty py-12">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--acct-surface)]">
        <Icon size={24} className="text-[var(--acct-muted)]" />
      </div>
      <h3 className="text-sm font-semibold text-[var(--acct-ink)]">{title}</h3>
      <p className="mt-1 max-w-xs text-xs text-[var(--acct-muted)]">
        {description}
      </p>
      {action && (
        <a href={action.href} className="acct-button-primary mt-4 text-xs">
          {action.label}
        </a>
      )}
    </div>
  );
}
