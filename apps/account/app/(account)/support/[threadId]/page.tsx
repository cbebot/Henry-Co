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
import { signAccountMediaUrl } from "@/lib/account/media";
import { getAccountAppLocale } from "@/lib/locale-server";
import "@/components/support/editorial.css";
import SupportChatScreen from "@/components/support/SupportChatScreen";

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
  const rawMessages = (await getSupportMessages(threadId)) as Array<
    Record<string, unknown>
  >;
  // Sign attachment refs server-side before they reach the client thread
  // engine. Attachments are persisted as `media://private/...` refs (RLS-
  // private bucket); the engine renders `attachment.url` directly as an
  // <img src>/<a href>, which a private ref cannot satisfy. We swap each ref
  // for a short-lived SIGNED URL here (legacy absolute URLs pass through; an
  // unsignable value collapses to "" and is dropped by the renderer).
  // (V3-MEDIA-SWEEP-01)
  const messages = await signSupportMessageAttachments(rawMessages);
  const status = String(thread.status || "open");
  const subject = String(thread.subject || t("Support conversation"));
  const category = String(thread.category || "general");
  const division = String(thread.division || "support");
  const statusLabel = localizeSupportStatus(t, status);
  const categoryLabelText = supportCategoryLabel(t, category);
  const divisionLabelText = divisionLabel(t, division);
  const initialMuted = Boolean(thread.customer_muted_at);

  // The chat screen is a fixed full-viewport surface (only the messages pane
  // scrolls). The category still reads through the status line; the hero
  // banner and the large thread header no longer live inside the chat screen.
  return (
    <div className="acct-chat-stage">
      <RouteLiveRefresh intervalMs={10000} />
      <SupportChatScreen
        threadId={threadId}
        rows={messages}
        threadStatus={status}
        subject={subject}
        statusLine={`${statusLabel} · ${categoryLabelText} · ${divisionLabelText}`}
        initialMuted={initialMuted}
        download={{
          endpoint: `/api/documents/support-thread/${threadId}`,
          filename: `HenryCo-SupportThread-${threadId.slice(0, 8)}.pdf`,
          shareTitle: `HenryCo Support Thread — ${subject}`,
          label: t("Download thread"),
        }}
        viewer={{
          userId: user.id,
          fullName: user.fullName || user.email || "You",
        }}
      />
    </div>
  );
}

/**
 * Resolve every persisted attachment ref on a set of support_messages rows to
 * a client-renderable URL. Runs server-side (signing needs the privileged
 * client) and returns NEW row objects so the original cached read is untouched.
 * Each `attachments[].url` is replaced by its signed/resolved URL; entries that
 * cannot be resolved (expired/missing) get an empty url and are filtered so the
 * client never renders a broken/throwing asset. (V3-MEDIA-SWEEP-01)
 */
async function signSupportMessageAttachments(
  messages: Array<Record<string, unknown>>,
): Promise<Array<Record<string, unknown>>> {
  return Promise.all(
    messages.map(async (row) => {
      const attachments = row.attachments;
      if (!Array.isArray(attachments) || attachments.length === 0) return row;
      const signed = await Promise.all(
        (attachments as Array<Record<string, unknown>>).map(async (attachment) => {
          const url = typeof attachment.url === "string" ? attachment.url : "";
          if (!url) return attachment;
          return { ...attachment, url: await signAccountMediaUrl(url) };
        }),
      );
      const renderable = signed.filter(
        (attachment) => typeof attachment.url === "string" && attachment.url.length > 0,
      );
      return { ...row, attachments: renderable };
    }),
  );
}

