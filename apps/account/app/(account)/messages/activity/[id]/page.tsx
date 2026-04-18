import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity, ChevronRight } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import { requireAccountUser } from "@/lib/auth";
import { getActivityMessageBoard } from "@/lib/message-center";
import { formatDateTime, formatNaira } from "@/lib/format";
import { getAccountAppLocale } from "@/lib/locale-server";
import PageHeader from "@/components/layout/PageHeader";

function isExternalHref(value?: string | null) {
  return Boolean(value && /^https?:\/\//i.test(value));
}

function localizeStatus(
  t: (text: string) => string,
  status?: string | null
) {
  const normalized = String(status || "").trim().replace(/[_-]+/g, " ");
  if (!normalized) return null;

  const capitalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  const translated = t(capitalized);
  return translated !== capitalized ? translated : capitalized;
}

export default async function ActivityMessageBoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const data = await getActivityMessageBoard(user.id, id);

  if (!data) {
    notFound();
  }

  const sourceLabel = t(data.source.label);
  const statusLabel = localizeStatus(t, data.record.status);
  const actionLabel = t(data.record.relatedLabel);

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title={t("Activity detail")}
        description={t("A focused view of one cross-division account event.")}
        icon={Activity}
      />

      <section className="rounded-[2rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
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
              {statusLabel ? (
                <span className="rounded-full bg-[var(--acct-surface)] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">
                  {statusLabel}
                </span>
              ) : null}
            </div>
            <h2 className="mt-4 text-xl font-semibold text-[var(--acct-ink)]">
              {data.record.title}
            </h2>
            <p className="mt-2 text-sm text-[var(--acct-muted)]">
              {formatDateTime(data.record.createdAt, { locale })}
            </p>
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

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="rounded-[1.5rem] bg-[var(--acct-bg)] p-5">
            <p className="acct-kicker">{t("Message board")}</p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--acct-ink)]">
              {data.record.body || t("This activity was recorded without a longer description.")}
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-[var(--acct-surface)] p-5">
            <p className="acct-kicker">{t("Context")}</p>
            {data.record.amountKobo > 0 ? (
              <p className="mt-3 text-xl font-semibold text-[var(--acct-ink)]">
                {formatNaira(data.record.amountKobo, { locale })}
              </p>
            ) : null}
            <p className="mt-3 text-sm leading-7 text-[var(--acct-muted)]">
              {t(
                "Activity records stay read-only here while linked notifications and destination modules remain actionable."
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="acct-card p-5">
        <p className="acct-kicker">{t("Related history")}</p>
        {data.history.length === 0 ? (
          <p className="mt-4 rounded-[1.3rem] bg-[var(--acct-surface)] px-4 py-5 text-sm text-[var(--acct-muted)]">
            {t("No related notification thread is attached yet for this event.")}
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
