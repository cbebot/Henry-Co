import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Bot, ExternalLink, MessageSquare, User } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { OwnerPageHeader, OwnerPanel, OwnerNotice } from "@/components/owner/OwnerPrimitives";
import DivisionBadge from "@/components/owner/DivisionBadge";
import { getIntelligenceConversationDetail } from "@/lib/owner-intelligence";
import { getHubPublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const locale = await getHubPublicLocale();
  const t = (s: string) => translateSurfaceLabel(locale, s);
  return {
    title: t("Conversation transcript"),
    description: `${t("Full Intelligence conversation")} ${id.slice(0, 8)}`,
  };
}

function formatDateTime(iso: string | null, locale: string): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export default async function IntelligenceConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [detail, locale] = await Promise.all([
    getIntelligenceConversationDetail(id),
    getHubPublicLocale(),
  ]);
  const t = (s: string) => translateSurfaceLabel(locale, s);

  if (!detail) notFound();

  const escalationHref = detail.escalatedThreadId
    ? `/owner/operations/alerts?thread=${detail.escalatedThreadId}`
    : null;

  return (
    <div className="space-y-6 acct-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href="/owner/ai/conversations"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--acct-muted)] hover:text-[var(--owner-accent)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {t("All conversations")}
        </Link>
      </div>

      <OwnerPageHeader
        eyebrow={t("Intelligence transcript")}
        title={`${t("Conversation")} ${id.slice(0, 8)}…`}
        description={t("Full role-attributed message history for this Intelligence session.")}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <MetaCard label={t("Division")} value={<DivisionBadge division={detail.division} />} />
        <MetaCard
          label={t("Status")}
          value={
            <span
              className={
                detail.escalated
                  ? "rounded-full bg-[var(--acct-red-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--acct-red-text)]"
                  : "rounded-full border border-[var(--acct-line)] px-2 py-0.5 text-[11px] font-medium text-[var(--acct-muted)]"
              }
            >
              {detail.escalated ? t("Escalated") : t(detail.status)}
            </span>
          }
        />
        <MetaCard label={t("Session")} value={detail.signedIn ? t("Signed in") : t("Guest")} />
        <MetaCard label={t("Messages")} value={String(detail.messages.length)} />
      </div>

      {detail.escalated && escalationHref ? (
        <OwnerNotice
          tone="warning"
          title={t("This conversation was escalated to a human agent")}
          body={t("The customer was handed off to support staff. View the live support thread to see how it was resolved.")}
          action={
            <Link
              href={escalationHref}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--owner-accent)]"
            >
              {t("Open support thread")}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </Link>
          }
        />
      ) : null}

      <OwnerPanel
        title={t("Transcript")}
        description={
          detail.messages.length > 0
            ? `${detail.messages.length} ${t("messages")} · ${t("Started")} ${formatDateTime(detail.createdAt, locale)}`
            : t("No messages recorded.")
        }
      >
        {detail.messages.length === 0 ? (
          <div className="rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-6 text-sm text-[var(--acct-muted)]">
            {t("No messages were recorded for this conversation.")}
          </div>
        ) : (
          <div className="space-y-3">
            {detail.messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} locale={locale} />
            ))}
          </div>
        )}
      </OwnerPanel>

      <div className="flex items-center gap-3">
        <Link
          href="/owner/ai/conversations"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--acct-line)] px-4 py-2 text-sm font-semibold text-[var(--acct-muted)] hover:border-[var(--owner-accent)] hover:text-[var(--owner-accent)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("Back to all conversations")}
        </Link>
        {escalationHref ? (
          <Link
            href={escalationHref}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--acct-red-soft)] px-4 py-2 text-sm font-semibold text-[var(--acct-red-text)]"
          >
            <MessageSquare className="h-4 w-4" aria-hidden />
            {t("View escalated thread")}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function MetaCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-[1.2rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--acct-muted)]">{label}</p>
      <div className="mt-1.5 text-sm font-medium text-[var(--acct-ink)]">{value}</div>
    </div>
  );
}

function MessageBubble({
  msg,
  locale,
}: {
  msg: { id: string; role: string; content: string; createdAt: string | null };
  locale: string;
}) {
  const isAssistant = msg.role === "assistant";
  const isSystem = msg.role === "system";

  if (isSystem) {
    return (
      <div className="rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-4 py-2 text-center text-xs text-[var(--acct-muted)] italic">
        {msg.content}
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${isAssistant ? "flex-row" : "flex-row-reverse"}`}>
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isAssistant
            ? "bg-[var(--acct-gold-soft)] text-[var(--owner-accent)]"
            : "bg-[var(--acct-surface)] text-[var(--acct-muted)]"
        }`}
      >
        {isAssistant ? (
          <Bot className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <User className="h-3.5 w-3.5" aria-hidden />
        )}
      </div>
      <div className={`max-w-[78%] space-y-1 ${isAssistant ? "" : "items-end"}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isAssistant
              ? "rounded-tl-sm bg-[var(--acct-bg-soft)] text-[var(--acct-ink)]"
              : "rounded-tr-sm bg-[var(--acct-gold-soft)] text-[var(--acct-ink)]"
          }`}
        >
          {msg.content}
        </div>
        {msg.createdAt ? (
          <p className={`text-[10px] text-[var(--acct-muted)] ${isAssistant ? "pl-1" : "pr-1 text-right"}`}>
            {new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(
              new Date(msg.createdAt),
            )}
          </p>
        ) : null}
      </div>
    </div>
  );
}
