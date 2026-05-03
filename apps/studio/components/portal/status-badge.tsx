import type { StatusTone } from "@/lib/portal/status";
import { toneToClasses, toneToDot } from "@/lib/portal/status";

export function StatusBadge({
  label,
  tone,
  size = "md",
}: {
  label: string;
  tone: StatusTone;
  size?: "sm" | "md";
}) {
  const padding = size === "sm" ? "px-2 py-0.5 text-[10.5px]" : "px-2.5 py-1 text-[11px]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase tracking-[0.14em] ${padding} ${toneToClasses(
        tone
      )}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${toneToDot(tone)}`} />
      {label}
    </span>
  );
}
