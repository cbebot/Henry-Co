import type { AttentionItem } from "@henryco/command-contract";
import { prioritySort } from "@henryco/command-contract";
import { AttentionCard } from "./AttentionCard";

/** A priority-sorted list of attention rows, with a calm empty state. */
export function AttentionFeed({
  items,
  emptyHint,
}: {
  items: readonly AttentionItem[];
  emptyHint?: string;
}) {
  const sorted = prioritySort(items);

  if (sorted.length === 0) {
    return (
      <div className="rounded-[var(--cc-radius)] border border-dashed border-[var(--cc-line)] bg-[var(--cc-panel)] px-5 py-12 text-center">
        <p className="text-sm font-medium text-[var(--cc-ink-soft)]">Nothing needs attention here.</p>
        {emptyHint ? <p className="mt-1.5 text-xs text-[var(--cc-faint)]">{emptyHint}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {sorted.map((item) => (
        <AttentionCard key={item.id} item={item} />
      ))}
    </div>
  );
}
