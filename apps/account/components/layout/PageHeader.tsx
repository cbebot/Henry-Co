import { type LucideIcon } from "lucide-react";

type PageHeaderProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
};

export default function PageHeader({ title, description, icon: Icon, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--acct-gold-soft)]">
            <Icon size={20} className="text-[var(--acct-gold)]" />
          </div>
        )}
        <div>
          <h1 className="acct-display text-xl sm:text-2xl">{title}</h1>
          {description && (
            <p className="mt-0.5 text-sm text-[var(--acct-muted)]">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
