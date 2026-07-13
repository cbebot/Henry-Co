import {
  Banknote,
  Briefcase,
  Building2,
  GraduationCap,
  ShieldCheck,
  Store,
  type LucideIcon,
} from "lucide-react";

type Props = {
  approved: boolean;
};

type Row = {
  label: string;
  icon: LucideIcon;
};

const UNLOCKS: Row[] = [
  { label: "Wallet withdrawals & payouts", icon: Banknote },
  { label: "Sell on the marketplace", icon: Store },
  { label: "Post jobs as a verified employer", icon: Briefcase },
  { label: "List and manage property", icon: Building2 },
  { label: "Verified instructor & learner credentials on Learn", icon: GraduationCap },
  { label: "Reach higher trust tiers", icon: ShieldCheck },
];

export function UnlocksRail({ approved }: Props) {
  return (
    <div className="acct-ver__unlocks" aria-labelledby="acct-ver-unlocks-head">
      <p
        id="acct-ver-unlocks-head"
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--acct-muted)",
          margin: 0,
        }}
      >
        What approval unlocks
      </p>
      <div className="acct-ver__unlocks-grid" role="list">
        {UNLOCKS.map((u) => {
          const Icon = u.icon;
          return (
            <div
              key={u.label}
              className="acct-ver__unlock"
              data-state={approved ? "unlocked" : "locked"}
              role="listitem"
            >
              <span className="acct-ver__unlock-icon" aria-hidden>
                <Icon size={16} aria-hidden />
              </span>
              <span className="acct-ver__unlock-text">{u.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
