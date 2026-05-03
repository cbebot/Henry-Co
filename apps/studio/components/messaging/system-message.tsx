import { CheckCircle2, FileUp, FlagTriangleRight, Receipt, Sparkles, ShieldCheck } from "lucide-react";
import type { StudioMessage } from "@/lib/messaging/types";
import { formatMessageTimestamp } from "@/lib/messaging/utils";

type Props = { message: StudioMessage };

/**
 * Centred horizontal-rule pill for project-event messages
 * (milestone updates, file shares, payment status, approvals,
 * welcome). The visual separates them clearly from human
 * conversation while keeping them in the timeline.
 */
export function SystemMessage({ message }: Props) {
  const meta = message.metadata || {};
  const Icon = iconForType(message.messageType);
  const headline = headlineForMessage(message);
  const subtle = formatMessageTimestamp(message.createdAt);

  return (
    <div
      className="my-3 flex w-full items-center gap-3 px-2"
      data-message-id={message.id}
      data-message-type={message.messageType}
      role="note"
      aria-label={headline}
    >
      <span className="h-px flex-1 bg-[#d4b14e]/15" aria-hidden />
      <span
        className="inline-flex items-center gap-2 rounded-full border border-[#d4b14e]/25 bg-[#d4b14e]/[0.08] px-3 py-1.5 text-[12px] italic leading-tight text-[#d4b14e]"
        style={{
          textShadow: "0 1px 0 rgba(0,0,0,0.25)",
        }}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="font-medium not-italic tracking-[0.005em]">{headline}</span>
        <span className="text-[#d4b14e]/55 not-italic">·</span>
        <time
          className="text-[#d4b14e]/65 not-italic tabular-nums"
          dateTime={message.createdAt}
        >
          {subtle}
        </time>
      </span>
      <span className="h-px flex-1 bg-[#d4b14e]/15" aria-hidden />
      {Boolean(message.body) && message.metadata && "showBody" in (meta as Record<string, unknown>) && (meta as Record<string, unknown>).showBody === true ? (
        <p className="sr-only">{message.body}</p>
      ) : null}
    </div>
  );
}

function iconForType(type: StudioMessage["messageType"]) {
  switch (type) {
    case "milestone_update":
      return FlagTriangleRight;
    case "file_share":
      return FileUp;
    case "payment_update":
      return Receipt;
    case "approval_request":
      return ShieldCheck;
    case "system":
      return Sparkles;
    default:
      return CheckCircle2;
  }
}

function headlineForMessage(message: StudioMessage): string {
  const meta = (message.metadata || {}) as Record<string, unknown>;
  const team =
    typeof meta.actor === "string" && meta.actor
      ? String(meta.actor)
      : "the Studio team";

  switch (message.messageType) {
    case "milestone_update": {
      const title = typeof meta.milestone_title === "string" ? meta.milestone_title : "the milestone";
      const status = typeof meta.status === "string" ? meta.status : "updated";
      const verb =
        status === "approved"
          ? "marked complete"
          : status === "in_progress"
            ? "started"
            : status === "blocked"
              ? "flagged blocked"
              : "updated";
      return `${title} ${verb} by ${team}`;
    }
    case "file_share": {
      const label = typeof meta.label === "string" ? meta.label : "a file";
      return `${team} shared ${label}`;
    }
    case "payment_update": {
      const label = typeof meta.label === "string" ? meta.label : "the invoice";
      const status = typeof meta.status === "string" ? meta.status : "updated";
      return `${label} ${status}`;
    }
    case "approval_request": {
      const label = typeof meta.label === "string" ? meta.label : "an approval";
      return `${team} requested ${label}`;
    }
    case "system":
      return message.body || "Project update";
    default:
      return message.body || "Update";
  }
}
