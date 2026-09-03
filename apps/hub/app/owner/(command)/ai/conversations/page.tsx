import type { Metadata } from "next";
import Link from "next/link";
import { translateSurfaceLabel } from "@henryco/i18n";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import DivisionBadge from "@/components/owner/DivisionBadge";
import { getIntelligenceConsole } from "@/lib/owner-intelligence";
import { getHubPublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getHubPublicLocale();
  const t = (s: string) => translateSurfaceLabel(locale, s);
  return {
    title: t("Intelligence conversations"),
    description: t("Every Henry Onyx Intelligence conversation across the ecosystem, escalations first."),
  };
}

function timeAgo(iso: string | null, locale: string): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(
      new Date(iso),
    );
  } catch {
    return "";
  }
}

/**
 * Intelligence Live L2 — the owner console. Every Intelligence conversation across the
 * ecosystem, escalations first, read via the service role. Shows empty (with a calm note)
 * until the L1 migration is applied and the surface is live.
 */
export default async function IntelligenceConversationsPage() {
  const locale = await getHubPublicLocale();
  const t = (s: string) => translateSurfaceLabel(locale, s);
  const data = await getIntelligenceConsole();

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow={t("Henry Onyx Intelligence")}
        title={t("Conversations")}
        description={t("Every conversation across the ecosystem, escalations first. Free support and paid deep work.")}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label={t("Conversations")} value={data.total} />
        <Stat label={t("Escalated to the team")} value={data.escalatedCount} tone="alert" />
        <Stat label={t("Status")} value={data.available ? t("Live") : t("Not yet active")} />
      </div>

      <OwnerPanel
        title={t("All conversations")}
        description={t("The newest activity, with anything handed to a human at the top.")}
      >
        {data.conversations.length === 0 ? (
          <div className="rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-6 text-sm leading-relaxed text-[var(--acct-muted)]">
            {data.available
              ? t("No conversations yet. They will appear here as people use Henry Onyx Intelligence.")
              : t("No conversations yet. As people use Henry Onyx Intelligence across the ecosystem, they will appear here.")}
          </div>
        ) : (
          <ul className="space-y-2">
            {data.conversations.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/owner/ai/conversations/${c.id}`}
                  className="flex items-start gap-3 rounded-[1.2rem] border border-[var(--acct-line)] bg-[var(--acct-bg)] p-4 transition-all hover:border-[var(--owner-accent)]/30 hover:shadow-[var(--acct-shadow)]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <DivisionBadge division={c.division} />
                      {c.escalated ? (
                        <span className="rounded-full bg-[var(--acct-red-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--acct-red-text)]">
                          {t("Escalated")}
                        </span>
                      ) : null}
                      <span className="rounded-full border border-[var(--acct-line)] px-2 py-0.5 text-[11px] font-medium text-[var(--acct-muted)]">
                        {c.signedIn ? t("Signed in") : t("Guest")}
                      </span>
                      <span className="text-[11px] text-[var(--acct-muted)]">
                        {c.messageCount} {t("messages")}
                      </span>
                    </div>
                    <p className="mt-2 truncate text-sm text-[var(--acct-ink)]">{c.preview || t("(no messages)")}</p>
                  </div>
                  <span className="shrink-0 text-[11px] tabular-nums text-[var(--acct-muted)]">
                    {timeAgo(c.lastMessageAt, locale)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </OwnerPanel>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number | string; tone?: "alert" }) {
  return (
    <div className="rounded-[1.2rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--acct-muted)]">{label}</p>
      <p
        className={
          tone === "alert" && typeof value === "number" && value > 0
            ? "mt-1 text-2xl font-semibold text-[var(--acct-red-text)]"
            : "mt-1 text-2xl font-semibold text-[var(--acct-ink)]"
        }
      >
        {value}
      </p>
    </div>
  );
}
