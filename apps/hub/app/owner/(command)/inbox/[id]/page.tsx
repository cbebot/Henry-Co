import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArchiveRestore,
  Archive,
  ArrowLeft,
  Download,
  MailOpen,
  Paperclip,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { requireOwner } from "@/lib/owner-auth";
import { OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { getInboxMessage, markInboxRead } from "@/lib/owner-inbox/repository";
import { wrapEmailHtmlForIframe } from "@/lib/owner-inbox/sanitize";
import { formatDateTime } from "@/lib/format";
import { getHubPublicLocale } from "@/lib/locale-server";
import { markUnreadAction, toggleArchiveAction } from "../actions";
import ReplyForm from "../ReplyForm";

export const dynamic = "force-dynamic";

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function AuthBadge({ label, verdict }: { label: string; verdict: string | null }) {
  const v = (verdict ?? "").toLowerCase();
  const pass = v === "pass";
  const fail = v === "fail";
  const tone = pass
    ? "text-[var(--acct-green)] bg-[var(--acct-green-soft)]"
    : fail
      ? "text-[var(--acct-red)] bg-[var(--acct-red-soft)]"
      : "text-[var(--acct-muted)] bg-[var(--acct-bg-soft)]";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}>
      {pass ? <ShieldCheck size={11} /> : fail ? <ShieldAlert size={11} /> : null}
      {label}: {v || "—"}
    </span>
  );
}

export default async function OwnerInboxMessagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const owner = await requireOwner();
  const { id } = await params;
  const locale = await getHubPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  const message = await getInboxMessage(id);
  if (!message) notFound();

  // Mark read on open (idempotent).
  if (!message.isRead) {
    await markInboxRead(id, owner.id);
  }

  const replyTarget = message.replyTo || message.fromAddress;

  return (
    <div className="space-y-6 acct-fade-in">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/owner/inbox"
          className="inline-flex items-center gap-2 text-sm text-[var(--acct-muted)] transition-colors hover:text-[var(--acct-ink)]"
        >
          <ArrowLeft size={15} /> {t("Back to inbox")}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <form action={markUnreadAction}>
            <input type="hidden" name="id" value={message.id} />
            <button type="submit" className="acct-button-secondary inline-flex items-center gap-2">
              <MailOpen size={15} /> {t("Mark unread")}
            </button>
          </form>
          <form action={toggleArchiveAction}>
            <input type="hidden" name="id" value={message.id} />
            <input type="hidden" name="archived" value={message.isArchived ? "false" : "true"} />
            <button type="submit" className="acct-button-secondary inline-flex items-center gap-2">
              {message.isArchived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
              {message.isArchived ? t("Unarchive") : t("Archive")}
            </button>
          </form>
        </div>
      </div>

      <section className="acct-card p-5 sm:p-6">
        <h1 className="acct-display text-2xl font-semibold tracking-[-0.03em] text-[var(--acct-ink)]">
          {message.subject}
        </h1>

        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <Meta label={t("From")} value={message.fromName ? `${message.fromName} <${message.fromAddress}>` : message.fromAddress} />
          <Meta label={t("To")} value={message.toAddress} />
          <Meta label={t("Received")} value={formatDateTime(message.receivedAt)} />
          {message.sentAt ? <Meta label={t("Sent")} value={formatDateTime(message.sentAt)} /> : null}
          {message.replyTo ? <Meta label={t("Reply-to")} value={message.replyTo} /> : null}
          {message.cc.length ? <Meta label={t("Cc")} value={message.cc.join(", ")} /> : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <AuthBadge label="SPF" verdict={message.spf} />
          <AuthBadge label="DKIM" verdict={message.dkim} />
          <AuthBadge label="DMARC" verdict={message.dmarc} />
          {message.isSpam ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--acct-red-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--acct-red)]">
              <ShieldAlert size={11} /> {t("Failed authentication — possible spoof")}
            </span>
          ) : !message.spf && !message.dkim && !message.dmarc ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--acct-orange-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--acct-orange)]">
              <ShieldAlert size={11} /> {t("Authentication not verified")}
            </span>
          ) : null}
        </div>
      </section>

      {/* ── Body ── (HTML rendered in a sandboxed iframe; scripts cannot run) */}
      <OwnerPanel title={t("Message")}>
        {message.htmlBody ? (
          <div className="overflow-hidden rounded-[var(--acct-radius)] border border-[var(--acct-line)] bg-white">
            {/* sandbox="" (no allow-scripts) is a load-bearing invariant: it makes
                any markup that survived sanitization inert. The wrapped doc adds a
                strict CSP that blocks remote images / tracking pixels. */}
            <iframe
              title={t("Email content")}
              sandbox=""
              referrerPolicy="no-referrer"
              srcDoc={wrapEmailHtmlForIframe(message.htmlBody)}
              className="h-[60vh] w-full"
            />
          </div>
        ) : message.textBody ? (
          <pre className="whitespace-pre-wrap break-words hc-font-body text-sm leading-6 text-[var(--acct-ink)]">
            {message.textBody}
          </pre>
        ) : (
          <p className="text-sm text-[var(--acct-muted)]">{t("This message has no readable body.")}</p>
        )}
      </OwnerPanel>

      {/* ── Attachments ── */}
      {message.attachmentCount > 0 ? (
        <OwnerPanel
          title={t("Attachments")}
          description={
            message.attachmentsTruncated
              ? t("Some attachments were too large to capture and are listed as metadata only.")
              : undefined
          }
        >
          <ul className="space-y-2">
            {message.attachments.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-[var(--acct-radius)] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Paperclip size={16} className="shrink-0 text-[var(--acct-muted)]" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--acct-ink)]">{a.filename}</p>
                    <p className="text-xs text-[var(--acct-muted)]">
                      {a.contentType || t("unknown type")} · {formatBytes(a.sizeBytes)}
                    </p>
                  </div>
                </div>
                {a.captured && a.signedUrl ? (
                  <a
                    href={a.signedUrl}
                    download={a.filename}
                    target="_blank"
                    rel="noreferrer"
                    className="acct-button-secondary inline-flex shrink-0 items-center gap-2"
                  >
                    <Download size={14} /> {t("Download")}
                  </a>
                ) : (
                  <span className="shrink-0 text-xs text-[var(--acct-muted)]">
                    {t("Too large to capture")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </OwnerPanel>
      ) : null}

      {/* ── Reply (phase 2) — uses the existing transactional send path ── */}
      <OwnerPanel
        title={t("Reply")}
        description={t(`Sends from ${message.toAddress} via the company mail sender.`)}
      >
        <ReplyForm id={message.id} to={replyTarget} />
      </OwnerPanel>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="shrink-0 text-[var(--acct-muted)]">{label}:</span>
      <span className="min-w-0 break-words text-[var(--acct-ink)]">{value}</span>
    </div>
  );
}
