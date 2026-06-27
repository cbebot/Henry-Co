import { CheckCircle2, FileUp, FlagTriangleRight, Receipt, Sparkles, ShieldCheck } from "lucide-react";
import { useHenryCoLocale } from "@henryco/i18n/react";
import {
  getStudioMessagingCopy,
  type StudioMessagingCopy,
} from "@henryco/i18n";
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
  const locale = useHenryCoLocale();
  const copy = getStudioMessagingCopy(locale);
  const meta = message.metadata || {};
  const headline = headlineForMessage(message, copy.systemMessage);
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
        {renderTypeIcon(message.messageType)}
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

const TYPE_ICON_CLS = "h-3.5 w-3.5 shrink-0";

function renderTypeIcon(type: StudioMessage["messageType"]) {
  switch (type) {
    case "milestone_update":
      return <FlagTriangleRight className={TYPE_ICON_CLS} aria-hidden />;
    case "file_share":
      return <FileUp className={TYPE_ICON_CLS} aria-hidden />;
    case "payment_update":
      return <Receipt className={TYPE_ICON_CLS} aria-hidden />;
    case "approval_request":
      return <ShieldCheck className={TYPE_ICON_CLS} aria-hidden />;
    case "system":
      return <Sparkles className={TYPE_ICON_CLS} aria-hidden />;
    default:
      return <CheckCircle2 className={TYPE_ICON_CLS} aria-hidden />;
  }
}

function headlineForMessage(
  message: StudioMessage,
  copy: StudioMessagingCopy["systemMessage"],
): string {
  const meta = (message.metadata || {}) as Record<string, unknown>;
  const team =
    typeof meta.actor === "string" && meta.actor
      ? String(meta.actor)
      : copy.studioTeam;

  switch (message.messageType) {
    case "milestone_update": {
      const title = typeof meta.milestone_title === "string" ? meta.milestone_title : copy.theMilestone;
      const status = typeof meta.status === "string" ? meta.status : "updated";
      const verb =
        status === "approved"
          ? copy.verbComplete
          : status === "in_progress"
            ? copy.verbStarted
            : status === "blocked"
              ? copy.verbBlocked
              : copy.verbUpdated;
      return copy.milestoneHeadline
        .replace("{title}", title)
        .replace("{verb}", verb)
        .replace("{team}", team);
    }
    case "file_share": {
      const label = typeof meta.label === "string" ? meta.label : copy.aFile;
      return copy.fileShared.replace("{team}", team).replace("{label}", label);
    }
    case "payment_update": {
      const label = typeof meta.label === "string" ? meta.label : copy.theInvoice;
      const status = typeof meta.status === "string" ? meta.status : copy.verbUpdated;
      return copy.paymentHeadline.replace("{label}", label).replace("{status}", status);
    }
    case "approval_request": {
      const label = typeof meta.label === "string" ? meta.label : copy.anApproval;
      return copy.approvalRequested.replace("{team}", team).replace("{label}", label);
    }
    case "system":
      return message.body || copy.projectUpdate;
    default:
      return message.body || copy.update;
  }
}
