const STATUS_STYLES: Record<string, string> = {
  active: "acct-chip-green",
  published: "acct-chip-green",
  paid: "acct-chip-green",
  approved: "acct-chip-green",
  completed: "acct-chip-green",
  open: "acct-chip-blue",
  pending: "acct-chip-orange",
  sent: "acct-chip-orange",
  in_progress: "acct-chip-blue",
  new: "acct-chip-blue",
  draft: "acct-chip-purple",
  inactive: "acct-chip-red",
  closed: "acct-chip-red",
  overdue: "acct-chip-red",
  cancelled: "acct-chip-red",
  rejected: "acct-chip-red",
  suspended: "acct-chip-red",
};

export default function StatusBadge({ status }: { status: string | null | undefined }) {
  const normalized = (status || "unknown").toLowerCase().replace(/\s+/g, "_");
  const style = STATUS_STYLES[normalized] || "acct-chip-purple";
  const label = (status || "Unknown").replace(/_/g, " ");

  return (
    <span className={`acct-chip ${style} capitalize`}>
      {label}
    </span>
  );
}
