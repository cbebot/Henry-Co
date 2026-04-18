import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import { RouteLiveRefresh } from "@henryco/ui";
import { requireAccountUser } from "@/lib/auth";
import {
  getSupportMessages,
  getSupportThreadById,
  markNotificationsReadByActionUrl,
  markNotificationsReadByReference,
  markSupportThreadRead,
} from "@/lib/account-data";
import { getAccountAppLocale } from "@/lib/locale-server";
import PageHeader from "@/components/layout/PageHeader";
import SupportThreadRoom from "@/components/support/SupportThreadRoom";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ threadId: string }> };

function localizeSupportStatus(
  t: (text: string) => string,
  status: string,
) {
  const raw = status.replaceAll("_", " ");
  const capitalized = raw.charAt(0).toUpperCase() + raw.slice(1);
  const capitalizedTranslation = t(capitalized);

  if (capitalizedTranslation !== capitalized) {
    return capitalizedTranslation;
  }

  const rawTranslation = t(raw);
  return rawTranslation !== raw ? rawTranslation : capitalized;
}

function supportCategoryLabel(
  t: (text: string) => string,
  category: string,
) {
  switch (category.trim().toLowerCase()) {
    case "billing":
      return t("Billing & Payments");
    case "care":
      return t("Care Service");
    case "account":
      return t("Account & Security");
    case "marketplace":
      return t("Marketplace");
    case "wallet":
      return t("Wallet");
    case "other":
      return t("Other");
    case "general":
      return t("General");
    default: {
      const normalized = category.trim().replace(/[_-]+/g, " ");
      if (!normalized) return t("General");
      const capitalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
      const translated = t(capitalized);
      return translated !== capitalized ? translated : capitalized;
    }
  }
}

export default async function SupportThreadPage({ params }: Props) {
  const { threadId } = await params;
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const thread = (await getSupportThreadById(user.id, threadId)) as Record<string, unknown> | null;

  if (!thread) {
    return (
      <div className="acct-empty py-20">
        <p className="text-sm text-[var(--acct-muted)]">{t("Thread not found.")}</p>
        <Link href="/support" className="acct-button-secondary mt-4 rounded-xl">
          {t("Back to support")}
        </Link>
      </div>
    );
  }
  await Promise.all([
    markNotificationsReadByReference(user.id, "support_thread", threadId),
    markNotificationsReadByActionUrl(user.id, `/support/${threadId}`),
    markSupportThreadRead(user.id, threadId),
  ]);
  const messages = await getSupportMessages(threadId);
  const status = String(thread.status || "open");
  const subject = String(thread.subject || t("Support conversation"));
  const category = String(thread.category || "general");
  const isOpen = status !== "resolved" && status !== "closed";
  const statusLabel = localizeSupportStatus(t, status);
  const categoryLabel = supportCategoryLabel(t, category);

  return (
    <div className="space-y-6 acct-fade-in">
      <RouteLiveRefresh intervalMs={10000} />
      <div className="flex items-center gap-3">
        <Link
          href="/support"
          className="acct-button-ghost rounded-xl"
          aria-label={t("Back to support")}
          title={t("Back to support")}
        >
          <ArrowLeft size={16} />
        </Link>
        <PageHeader
          title={subject}
          description={`${categoryLabel} · ${statusLabel}`}
        />
      </div>
      <div className="rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] px-4 py-3">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--acct-muted)]">
          {t("What happens next")}
        </p>
        <p className="mt-1 text-sm text-[var(--acct-muted)]">
          {isOpen
            ? t(
                "Your thread is active. New replies move this queue forward and staff triage handles urgency automatically."
              )
            : t(
                "This thread is closed. If your issue returns, open a new request so it can be triaged and tracked cleanly."
              )}
        </p>
      </div>
      <SupportThreadRoom threadId={threadId} messages={messages} threadStatus={status} />
    </div>
  );
}
