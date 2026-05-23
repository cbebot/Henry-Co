import Link from "next/link";
import { LifeBuoy, Plus, MessageSquare } from "lucide-react";
import {
  formatAccountTemplate,
  getAccountCopy,
  translateSurfaceLabel,
} from "@henryco/i18n/server";
import { RouteLiveRefresh } from "@henryco/ui";
import {
  HeroCard,
  EmptyStateCard,
  NextStepRow,
  TimelineCard,
  TimelineRow,
  DivisionLanding,
  type HeroCardTile,
  type TimelineChip,
  type TimelineChipTone,
} from "@henryco/dashboard-shell/surfaces";

import { requireAccountUser } from "@/lib/auth";
import { getSupportThreads } from "@/lib/account-data";
import { timeAgoLocalized, divisionLabel } from "@/lib/format";
import { getAccountAppLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

function statusTone(status: string): TimelineChipTone {
  switch (status) {
    case "resolved":
    case "closed":
      return "success";
    case "awaiting_reply":
      return "warning";
    case "in_progress":
      return "info";
    case "open":
    default:
      return "gold";
  }
}

/**
 * Support landing.
 *
 * ACCOUNT-PREMIUM-01 (session 2, Phase 2D). Adds a HeroCard (no current
 * hero), surfaces the awaiting-reply thread via NextStepRow, swaps the
 * hand-rolled list rows for TimelineCard.Row with primitive chip tones
 * (dropping the hardcoded statusInfo color map).
 */
export default async function SupportPage() {
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const accountCopy = getAccountCopy(locale);
  const copy = accountCopy.support;
  const threads = (await getSupportThreads(user.id)) as Array<Record<string, string>>;

  const openThreads = threads.filter((thread) => {
    const status = String(thread.status || "");
    return status !== "resolved" && status !== "closed";
  });
  const openCount = openThreads.length;
  const urgentCount = threads.filter(
    (thread) => String(thread.priority || "").toLowerCase() === "high",
  ).length;
  const resolvedThisWeek = (() => {
    const now = Date.now();
    return threads.filter((thread) => {
      const s = String(thread.status || "");
      if (s !== "resolved" && s !== "closed") return false;
      const ms = Date.parse(String(thread.updated_at || ""));
      return Number.isFinite(ms) && now - ms <= 7 * 86_400_000;
    }).length;
  })();

  // ── State picker ─────────────────────────────────────────────────
  const heroTone: "calm" | "active" | "attention" | "empty" =
    threads.length === 0
      ? "empty"
      : urgentCount > 0
        ? "attention"
        : openCount > 0
          ? "active"
          : "calm";

  const t = (text: string) => translateSurfaceLabel(locale, text);

  // ── Tiles ────────────────────────────────────────────────────────
  const tiles: ReadonlyArray<HeroCardTile> = [
    {
      label: copy.statusLabels.open,
      value: openCount,
      foot:
        openCount === 0 ? t("All clear") : t("Waiting on us or on you"),
      tone: openCount > 0 ? "active" : "default",
    },
    {
      label: copy.priorityLabels.high,
      value: urgentCount,
      foot:
        urgentCount === 0 ? t("Nothing escalated") : t("Escalated · we respond first"),
      tone: urgentCount > 0 ? "warning" : "default",
    },
    {
      label: copy.statusLabels.resolved,
      value: resolvedThisWeek,
      foot: t("This week"),
    },
  ];

  // ── NextStepRow: awaiting-reply thread ──────────────────────────
  let nextStep: React.ReactNode = null;
  const awaiting = openThreads.find(
    (th) => String(th.status || "") === "awaiting_reply",
  );
  if (awaiting) {
    nextStep = (
      <NextStepRow
        tone="attention"
        kicker={copy.statusLabels.awaitingReply}
        title={awaiting.subject || t("Support thread")}
        detail={
          awaiting.division
            ? translateSurfaceLabel(locale, divisionLabel(awaiting.division))
            : undefined
        }
        cta={{ label: t("Reply"), href: `/support/${awaiting.id}` }}
      />
    );
  } else if (openCount === 0 && threads.length === 0) {
    nextStep = (
      <NextStepRow
        tone="neutral"
        kicker={copy.threads.sectionKicker}
        title={copy.hero.newRequestCta}
        detail={copy.hero.description}
        cta={{ label: copy.hero.newRequestCta, href: "/support/new" }}
      />
    );
  }

  const summaryLine =
    `${formatAccountTemplate(copy.summary.openRequestsTemplate, { count: openCount })} · ${formatAccountTemplate(copy.summary.escalatedTemplate, { count: urgentCount })} · ${copy.summary.escalationNote}`;

  return (
    <DivisionLanding
      className="acct-fade-in"
      hero={
        <HeroCard
          variant="solo"
          tone={heroTone}
          eyebrow={copy.threads.sectionKicker}
          headline={copy.hero.title}
          blurb={copy.hero.description}
          ctaPrimary={{ label: copy.hero.newRequestCta, href: "/support/new" }}
          tiles={tiles}
        />
      }
      nextStep={nextStep}
      sections={[
        {
          id: "acct-support-quick-help",
          title: copy.quickHelp.helpCenterLabel,
          meta: summaryLine,
          content: (
            <div className="grid gap-3 sm:grid-cols-3">
              <Link
                href="/support"
                className="acct-card flex items-center gap-3 p-4 transition-shadow hover:shadow-md"
              >
                <LifeBuoy size={20} className="shrink-0 text-[var(--acct-gold)]" />
                <div>
                  <p className="text-sm font-semibold text-[var(--acct-ink)]">
                    {copy.quickHelp.helpCenterLabel}
                  </p>
                  <p className="text-xs text-[var(--acct-muted)]">
                    {copy.quickHelp.helpCenterDesc}
                  </p>
                </div>
              </Link>
              <Link
                href="/support/new"
                className="acct-card flex items-center gap-3 p-4 transition-shadow hover:shadow-md"
              >
                <LifeBuoy size={20} className="shrink-0 text-[var(--acct-gold)]" />
                <div>
                  <p className="text-sm font-semibold text-[var(--acct-ink)]">
                    {copy.quickHelp.contactLabel}
                  </p>
                  <p className="text-xs text-[var(--acct-muted)]">
                    {copy.quickHelp.contactDesc}
                  </p>
                </div>
              </Link>
              <Link
                href="/support/new"
                className="acct-card flex items-center gap-3 p-4 transition-shadow hover:shadow-md"
              >
                <MessageSquare size={20} className="shrink-0 text-[var(--acct-gold)]" />
                <div>
                  <p className="text-sm font-semibold text-[var(--acct-ink)]">
                    {copy.quickHelp.liveChatLabel}
                  </p>
                  <p className="text-xs text-[var(--acct-muted)]">
                    {copy.quickHelp.liveChatDesc}
                  </p>
                </div>
              </Link>
            </div>
          ),
        },
        {
          id: "acct-support-threads",
          title: copy.threads.sectionKicker,
          meta: `${threads.length}`,
          content:
            threads.length === 0 ? (
              <EmptyStateCard
                kicker={copy.threads.sectionKicker}
                title={copy.threads.emptyTitle}
                body={copy.threads.emptyDescription}
                cta={{ label: copy.threads.createCta, href: "/support/new" }}
              />
            ) : (
              <TimelineCard ariaLabel={copy.threads.sectionKicker}>
                {threads.map((thread) => {
                  const status = String(thread.status || "open");
                  const labels = copy.statusLabels as Record<string, string>;
                  const statusKey =
                    status === "awaiting_reply"
                      ? "awaitingReply"
                      : status === "in_progress"
                        ? "inProgress"
                        : (status as keyof typeof copy.statusLabels);
                  const statusLabel =
                    labels[statusKey as string] || labels.open;
                  const chips: TimelineChip[] = [
                    { label: statusLabel, tone: statusTone(status) },
                  ];
                  if (thread.division) {
                    chips.unshift({
                      label: translateSurfaceLabel(locale, divisionLabel(thread.division)),
                      tone: "gold",
                    });
                  }
                  return (
                    <TimelineRow
                      key={thread.id}
                      href={`/support/${thread.id}`}
                      avatar={<MessageSquare size={16} aria-hidden />}
                      title={thread.subject || copy.threads.sectionKicker}
                      detail={statusLabel}
                      chips={chips}
                      time={timeAgoLocalized(thread.updated_at, locale)}
                    />
                  );
                })}
              </TimelineCard>
            ),
        },
      ]}
      footer={
        <>
          <RouteLiveRefresh intervalMs={12000} />
          <p
            style={{
              fontSize: 11,
              color: "var(--acct-muted)",
              textAlign: "right",
              margin: "8px 0 0",
            }}
          >
            <Link
              href="/support/new"
              className="inline-flex items-center gap-1"
              style={{ color: "var(--acct-gold)" }}
            >
              <Plus size={12} aria-hidden />
              {copy.hero.newRequestCta}
            </Link>
          </p>
        </>
      }
    />
  );
}
