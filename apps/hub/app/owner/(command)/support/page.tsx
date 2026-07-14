import { MessageSquare, Radio, UserRound, VenetianMask } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import SupportReplyForm from "@/components/owner/SupportReplyForm";
import { getOwnerSupportCommandData } from "@/lib/owner-support-command";
import { getHubPublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

type SearchParams = { thread?: string; conversation?: string };

const PILL = "inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-semibold";

function statusTone(status: string): string {
  const s = status.toLowerCase();
  if (s === "escalated" || s === "open") return `${PILL} bg-[var(--acct-red-soft)] text-[var(--acct-red-text)]`;
  if (s === "in_progress") return `${PILL} bg-[var(--acct-orange-soft)] text-[var(--acct-orange-text)]`;
  return `${PILL} bg-[var(--acct-gold-soft)] text-[var(--acct-muted)]`;
}

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toISOString().slice(0, 16).replace("T", " ") + " UTC";
}

/**
 * /owner/support — Support Command.
 *
 * The owner's window into every conversation the company is having: who is
 * talking to the AI right now (by NAME, or "Anonymous visitor"), which of them
 * asked for a live person, and the Onyx Line threads waiting on a human — with
 * the owner able to reply into any thread himself. Handoff alerts (the bell)
 * deep-link here with ?thread= / ?conversation= to highlight the row.
 */
export default async function OwnerSupportCommandPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) || {};
  const highlightThread = typeof sp.thread === "string" ? sp.thread : "";
  const highlightConversation = typeof sp.conversation === "string" ? sp.conversation : "";
  const [data, locale] = await Promise.all([
    getOwnerSupportCommandData(),
    getHubPublicLocale(),
  ]);
  const t = (s: string) => translateSurfaceLabel(locale, s);

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow={t("Support Command")}
        title={t("Every conversation, one console")}
        description={t("Who is talking to the intelligence right now, who needs a live person, and the support threads waiting on the team — with your own reply box on every thread.")}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: t("Open threads"), value: data.metrics.openThreads, danger: data.metrics.openThreads > 0 },
          { label: t("Needs a live person"), value: data.metrics.handoffs, danger: data.metrics.handoffs > 0 },
          { label: t("AI conversations"), value: data.metrics.conversations },
          { label: t("Anonymous visitors"), value: data.metrics.anonymous },
        ].map((stat) => (
          <div key={stat.label} className="acct-card px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--acct-muted)]">{stat.label}</p>
            <p className={`mt-1 text-2xl font-bold ${stat.danger ? "text-[var(--acct-red-text)]" : "text-[var(--acct-ink)]"}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <OwnerPanel
        title={t("Threads waiting on a human")}
        description={t("Open Onyx Line support threads. Your reply posts as the team — the customer sees it in their support inbox immediately.")}
        action={
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--acct-muted)]">
            <MessageSquare className="h-3.5 w-3.5" aria-hidden />
            {data.metrics.openThreads} {t("open")}
          </span>
        }
      >
        {data.threads.length === 0 ? (
          <p className="text-sm text-[var(--acct-muted)]">
            {t("No open support threads. When a customer needs the team, the thread appears here and your bell rings.")}
          </p>
        ) : (
          <div className="space-y-4">
            {data.threads.map((thread) => (
              <div
                key={thread.id}
                className={`rounded-[1.25rem] border p-4 ${
                  highlightThread === thread.id
                    ? "border-[var(--acct-gold)] bg-[var(--acct-gold-soft)]"
                    : "border-[var(--acct-line)] bg-[var(--acct-bg-soft)]"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <UserRound className="h-4 w-4 shrink-0 text-[var(--acct-muted)]" aria-hidden />
                    <span className="truncate text-sm font-semibold text-[var(--acct-ink)]">{thread.userLabel}</span>
                    <span className="text-xs uppercase tracking-wide text-[var(--acct-muted)]">{thread.division}</span>
                  </div>
                  <span className={statusTone(thread.status)}>{thread.status.replace("_", " ")}</span>
                </div>
                <p className="mt-2 text-sm font-medium text-[var(--acct-ink)]">{thread.subject}</p>
                {thread.lastMessage ? (
                  <p className="mt-1 text-sm leading-6 text-[var(--acct-muted)]">
                    <span className="font-semibold uppercase text-[0.65rem] tracking-wide">
                      {thread.lastSenderType === "agent" ? t("Team") : t("Customer")}
                    </span>{" "}
                    · {thread.lastMessage}
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-[var(--acct-muted)]">{formatWhen(thread.updatedAt)}</p>
                <SupportReplyForm threadId={thread.id} />
              </div>
            ))}
          </div>
        )}
      </OwnerPanel>

      <OwnerPanel
        title={t("Intelligence conversations")}
        description={t("Live AI-support conversations across the ecosystem — named when signed in, Anonymous visitor when not. Escalated ones carry the radio mark.")}
        action={
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--acct-muted)]">
            <Radio className="h-3.5 w-3.5" aria-hidden />
            {data.metrics.handoffs} {t("handoffs")}
          </span>
        }
      >
        {data.conversations.length === 0 ? (
          <p className="text-sm text-[var(--acct-muted)]">
            {t("No AI conversations recorded yet. They appear the moment anyone talks to the intelligence on any division.")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="owner-table">
              <thead>
                <tr>
                  <th>{t("Person")}</th>
                  <th>{t("Division")}</th>
                  <th>{t("Status")}</th>
                  <th>{t("Last message")}</th>
                  <th>{t("When")}</th>
                </tr>
              </thead>
              <tbody>
                {data.conversations.map((conversation) => (
                  <tr
                    key={conversation.id}
                    className={
                      highlightConversation === conversation.id ? "bg-[var(--acct-gold-soft)]" : undefined
                    }
                  >
                    <td className="max-w-[min(220px,24vw)]">
                      <div className="flex items-center gap-1.5">
                        {conversation.anonymous ? (
                          <VenetianMask className="h-3.5 w-3.5 shrink-0 text-[var(--acct-muted)]" aria-hidden />
                        ) : (
                          <UserRound className="h-3.5 w-3.5 shrink-0 text-[var(--acct-muted)]" aria-hidden />
                        )}
                        <span className="truncate font-medium text-[var(--acct-ink)]" title={conversation.userLabel}>
                          {conversation.userLabel}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap text-xs uppercase tracking-wide text-[var(--acct-muted)]">
                      {conversation.division}
                    </td>
                    <td>
                      <span className={statusTone(conversation.status)}>
                        {conversation.handoff ? t("needs a person") : conversation.status}
                      </span>
                    </td>
                    <td className="max-w-[min(320px,32vw)]">
                      <div className="truncate text-sm text-[var(--acct-muted)]" title={conversation.lastMessage}>
                        {conversation.lastRole === "assistant" ? "AI · " : ""}
                        {conversation.lastMessage || "—"}
                      </div>
                    </td>
                    <td className="whitespace-nowrap text-sm text-[var(--acct-muted)]">
                      {formatWhen(conversation.lastMessageAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </OwnerPanel>
    </div>
  );
}
