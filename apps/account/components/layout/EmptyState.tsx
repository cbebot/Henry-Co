import { type LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
};

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="acct-empty acct-card p-8">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--acct-surface)]">
        <Icon size={24} className="text-[var(--acct-muted)]" />
      </div>
      <h3 className="text-base font-semibold text-[var(--acct-ink)]">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-[var(--acct-muted)]">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
