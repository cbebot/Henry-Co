import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bell, ChevronRight } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import { requireAccountUser } from "@/lib/auth";
import { getNotificationMessageBoard } from "@/lib/message-center";
import { formatDateTime } from "@/lib/format";
import { getAccountAppLocale } from "@/lib/locale-server";
import PageHeader from "@/components/layout/PageHeader";
import NotificationLifecycleControls from "@/components/messages/NotificationLifecycleControls";

function isExternalHref(value?: string | null) {
  return Boolean(value && /^https?:\/\//i.test(value));
}

export default async function NotificationMessageBoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const data = await getNotificationMessageBoard(user.id, id, locale);

  if (!data) {
    notFound();
  }

  const sourceLabel = t(data.source.label);
  const actionLabel = t(data.record.relatedLabel);

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title={t("Notification detail")}
        description={t("A focused inbox view for one cross-division update.")}
        icon={Bell}
        actions={
          <NotificationLifecycleControls
            notificationId={data.record.id}
            isRead={data.record.isRead}
            redirectOnDelete="/notifications"
          />
        }
      />

      <section className="rounded-[2rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            {data.source.logoUrl ? (
              <Image
                src={data.source.logoUrl}
                alt={sourceLabel}
                width={52}
                height={52}
                className="rounded-[1.25rem] border border-[var(--acct-line)] object-cover"
              />
            ) : (
              <div
                className="flex h-13 w-13 items-center justify-center rounded-[1.25rem] text-sm font-bold text-white"
                style={{ backgroundColor: data.source.accent }}
              >
                {sourceLabel.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em]"
                  style={{
                    backgroundColor: `${data.source.accent}18`,
                    color: data.source.accent,
                  }}
                >
                  {sourceLabel}
                </span>
                <span className="rounded-full bg-[var(--acct-surface)] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">
                  {t(data.record.isRead ? "Read" : "Unread")}
                </span>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-[var(--acct-ink)]">
                {data.record.title}
              </h2>
              <p className="mt-2 text-sm text-[var(--acct-muted)]">
                {formatDateTime(data.record.createdAt, { locale })}
              </p>
            </div>
          </div>

          {isExternalHref(data.record.relatedUrl) ? (
            <a
              href={data.record.relatedUrl}
              target="_blank"
              rel="noreferrer"
              className="acct-button-primary rounded-xl"
            >
              {actionLabel} <ChevronRight size={14} />
            </a>
          ) : (
            <Link href={data.record.relatedUrl} className="acct-button-primary rounded-xl">
              {actionLabel} <ChevronRight size={14} />
            </Link>
          )}
        </div>

        <div className="mt-6 rounded-[1.5rem] bg-[var(--acct-bg)] p-5">
          <p className="acct-kicker">{t("Message")}</p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--acct-ink)]">
            {data.record.body || t("No extra message body was attached to this notification.")}
          </p>
        </div>
      </section>

      <section className="acct-card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="acct-kicker">{t("Related history")}</p>
            <h2 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">
              {t("Nearby updates in the same thread")}
            </h2>
          </div>
        </div>

        {data.history.length === 0 ? (
          <p className="mt-4 rounded-[1.3rem] bg-[var(--acct-surface)] px-4 py-5 text-sm text-[var(--acct-muted)]">
            {t("No extra thread history is attached yet. New movement from this source will appear here.")}
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {data.history.map((item) => (
              <Link
                key={`${item.kind}-${item.id}`}
                href={item.href}
                className="block rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] px-4 py-4 transition hover:border-[var(--acct-gold)]/30 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--acct-ink)]">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--acct-muted)]">{item.body}</p>
                  </div>
                  <span className="text-[0.72rem] text-[var(--acct-muted)]">
                    {formatDateTime(item.createdAt, { locale })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
