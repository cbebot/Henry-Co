import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import { toBrandName } from "@henryco/config";
import { RouteLiveRefresh } from "@henryco/ui";
import { ThreadAppearanceProvider, type ThreadParticipant } from "@henryco/messaging-thread";
import { HeroCard } from "@henryco/dashboard-shell/surfaces";
import { requireAccountUser } from "@/lib/auth";
import {
  getSupportMessages,
  getSupportThreadById,
  markNotificationsReadByActionUrl,
  markNotificationsReadByReference,
  markSupportThreadRead,
} from "@/lib/account-data";
import { getAccountAppLocale } from "@/lib/locale-server";
import "@/components/support/editorial.css";
import SupportThreadHeader from "@/components/support/SupportThreadHeader";
import SupportThreadRoom from "@/components/support/SupportThreadRoom";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ threadId: string }> };

function localizeSupportStatus(
  t: (text: string) => string,
  status: string | null | undefined,
) {
  const safe =
    typeof status === "string" && status.length > 0 ? status : "open";
  const raw = safe.replaceAll("_", " ");
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
  category: string | null | undefined,
) {
  const safe = typeof category === "string" ? category : "";
  switch (safe.trim().toLowerCase()) {
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
      const normalized = safe.trim().replace(/[_-]+/g, " ");
      if (!normalized) return t("General");
      const capitalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
      const translated = t(capitalized);
      return translated !== capitalized ? translated : capitalized;
    }
  }
}

function divisionLabel(t: (text: string) => string, division: string) {
  const norm = (division || "").trim().toLowerCase();
  if (!norm || norm === "support") return t("Support");
  const map: Record<string, string> = {
    care: "Care",
    studio: "Studio",
    jobs: "Jobs",
    learn: "Learn",
    property: "Property",
    logistics: "Logistics",
    marketplace: "Marketplace",
    account: "Account",
  };
  const display = map[norm] || norm.charAt(0).toUpperCase() + norm.slice(1);
  return t(display);
}

export default async function SupportThreadPage({ params }: Props) {
  const { threadId } = await params;
  const [locale, user] = await Promise.all([
    getAccountAppLocale(),
    requireAccountUser(),
  ]);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const thread = (await getSupportThreadById(user.id, threadId)) as
    | Record<string, unknown>
    | null;

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
  const messages = (await getSupportMessages(threadId)) as Array<
    Record<string, unknown>
  >;
  const status = String(thread.status || "open");
  const subject = String(thread.subject || t("Support conversation"));
  const category = String(thread.category || "general");
  const division = String(thread.division || "support");
  const statusLabel = localizeSupportStatus(t, status);
  const categoryLabelText = supportCategoryLabel(t, category);
  const divisionLabelText = divisionLabel(t, division);
  const initialMuted = Boolean(thread.customer_muted_at);
  const participants = deriveAccountParticipants({
    viewerUserId: user.id,
    viewerName: user.fullName || user.email || "You",
    divisionLabel: divisionLabelText,
    messages,
    teamLabel: t(toBrandName("HenryCo")),
    customerLabel: t("You"),
    teamRoleLabel: t("Support"),
  });

  return (
    <div className="acct-support-stage acct-fade-in">
      <RouteLiveRefresh intervalMs={10000} />
      <Link
        href="/support"
        className="acct-support-back"
        aria-label={t("Back to support")}
      >
        <ArrowLeft size={14} aria-hidden />
        {t("Back to support")}
      </Link>
      <HeroCard
        variant="compact"
        tone={status === "resolved" || status === "closed" ? "calm" : "active"}
        eyebrow={`${t("Support")} · ${divisionLabelText}`}
        headline={subject}
        blurb={`${categoryLabelText} · ${statusLabel}`}
      />
      <ThreadAppearanceProvider>
        <SupportThreadHeader
          threadId={threadId}
          subject={subject}
          divisionLabel={divisionLabelText}
          categoryLabel={categoryLabelText}
          status={status}
          statusLabel={statusLabel}
          initialMuted={initialMuted}
          participants={participants}
          download={{
            endpoint: `/api/documents/support-thread/${threadId}`,
            filename: `HenryCo-SupportThread-${threadId.slice(0, 8)}.pdf`,
            shareTitle: `HenryCo Support Thread — ${subject}`,
            label: t("Download thread"),
          }}
        />
        <SupportThreadRoom
          threadId={threadId}
          messages={messages}
          threadStatus={status}
          viewer={{
            userId: user.id,
            fullName: user.fullName || user.email || "You",
            email: user.email,
          }}
        />
      </ThreadAppearanceProvider>
    </div>
  );
}

function deriveAccountParticipants({
  viewerUserId,
  viewerName,
  divisionLabel,
  messages,
  teamLabel,
  customerLabel,
  teamRoleLabel,
}: {
  viewerUserId: string;
  viewerName: string;
  divisionLabel: string;
  messages: Array<Record<string, unknown>>;
  teamLabel: string;
  customerLabel: string;
  teamRoleLabel: string;
}): ThreadParticipant[] {
  const seen = new Map<string, ThreadParticipant>();
  seen.set(viewerUserId, {
    id: viewerUserId,
    name: viewerName,
    role: customerLabel,
    isSelf: true,
  });
  for (const row of messages) {
    const senderType = String(
      (row as { sender_type?: unknown }).sender_type || "",
    ).toLowerCase();
    if (senderType === "system") continue;
    const senderId =
      String((row as { sender_id?: unknown }).sender_id || "") ||
      `team-${senderType || "agent"}`;
    if (seen.has(senderId)) continue;
    if (senderType === "customer") continue; // already covered by viewer
    seen.set(senderId, {
      id: senderId,
      name:
        String((row as { sender_name?: unknown }).sender_name || "") ||
        `${teamLabel} ${divisionLabel}`,
      role: teamRoleLabel,
    });
  }
  return Array.from(seen.values());
}
