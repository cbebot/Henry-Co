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
      <span className="h-px flex-1 bg-white/[0.06]" aria-hidden />
      <span className="rounded-full border border-white/[0.06] bg-[#0A0E1A] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">
        {formatDateSeparator(iso)}
      </span>
      <span className="h-px flex-1 bg-white/[0.06]" aria-hidden />
    </div>
  );
}
