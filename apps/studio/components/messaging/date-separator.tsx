import { formatDateSeparator } from "@/lib/messaging/utils";

type Props = { iso: string };

/**
 * Day boundary separator. Centred pill, muted colour. Only appears
 * between messages on different days (the message-list inserts these).
 */
export function DateSeparator({ iso }: Props) {
  return (
    <div
      className="my-3 flex w-full items-center gap-3 px-2 select-none"
      role="separator"
      aria-label={formatDateSeparator(iso)}
    >
      <span className="h-px flex-1 bg-[var(--studio-thread-hover)]" aria-hidden />
      <span className="rounded-full border border-[var(--studio-thread-line)] bg-[var(--studio-thread-card)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--studio-thread-ink-muted)]">
        {formatDateSeparator(iso)}
      </span>
      <span className="h-px flex-1 bg-[var(--studio-thread-hover)]" aria-hidden />
    </div>
  );
}
