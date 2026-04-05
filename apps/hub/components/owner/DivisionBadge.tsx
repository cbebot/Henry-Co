import { divisionLabel, divisionColor } from "@/lib/format";

export default function DivisionBadge({ division }: { division: string | null | undefined }) {
  const slug = division || "unknown";
  const color = divisionColor(slug);
  const label = divisionLabel(slug);

  return (
    <span
      className="acct-chip"
      style={{
        background: `${color}18`,
        color,
      }}
    >
      {label}
    </span>
  );
}
