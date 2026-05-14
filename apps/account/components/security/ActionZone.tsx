import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type Props = {
  kicker: string;
  title: string;
  icon: LucideIcon;
  children: ReactNode;
};

export function ActionZone({ kicker, title, icon: Icon, children }: Props) {
  return (
    <section className="acct-sec__action" aria-label={title}>
      <p className="acct-sec__action-kicker">
        <Icon size={14} aria-hidden />
        {kicker}
      </p>
      <h3 className="acct-sec__action-title">{title}</h3>
      {children}
    </section>
  );
}
