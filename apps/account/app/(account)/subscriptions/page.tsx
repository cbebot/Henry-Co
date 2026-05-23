import Link from "next/link";
import { RefreshCcw } from "lucide-react";
import { getAccountCopy } from "@henryco/i18n/server";
import {
  HeroCard,
  EmptyStateCard,
  TimelineCard,
  TimelineRow,
  DivisionLanding,
  type HeroCardTile,
  type TimelineChip,
  type TimelineChipTone,
} from "@henryco/dashboard-shell/surfaces";

import { requireAccountUser } from "@/lib/auth";
import { getSubscriptions } from "@/lib/account-data";
import { getAccountAppLocale } from "@/lib/locale-server";
import {
  formatBillingInterval,
  formatCurrencyAmount,
  formatDate,
  formatSubscriptionStatus,
  divisionLabel,
  divisionColor,
} from "@/lib/format";

export const dynamic = "force-dynamic";

function statusTone(status: string): TimelineChipTone {
  switch (status) {
    case "active":
      return "success";
    case "paused":
      return "warning";
    case "cancelled":
    case "expired":
    case "past_due":
      return "danger";
    default:
      return "gold";
  }
}

type SubscriptionRow = Record<string, string | number>;

/**
 * Subscriptions landing.
 *
 * ACCOUNT-PREMIUM-01 (session 2, Phase 2E). Adds HeroCard with
 * active/paused/spend tiles. Replaces the hand-rolled card grid with
 * TimelineCard.Row + primitive chip tones (dropping the hardcoded
 * statusChip map).
 */
export default async function SubscriptionsPage() {
  const [locale, user] = await Promise.all([
    getAccountAppLocale(),
    requireAccountUser(),
  ]);
  const subscriptions = (await getSubscriptions(user.id)) as SubscriptionRow[];
  const copy = getAccountCopy(locale).subscriptions;

  const localizeStatus = (status: string) => {
    const key = String(status || "").trim().toLowerCase();
    const labels = copy.statusLabels as Record<string, string>;
    return (
      labels[key] || formatSubscriptionStatus(key) || labels.unknown
    );
  };

  const localizeCycle = (interval: string) => {
    const key = String(interval || "").trim().toLowerCase();
    const labels = copy.cycleLabels as Record<string, string>;
    return labels[key] || formatBillingInterval(key) || labels.notSet;
  };

  // ── Aggregate ────────────────────────────────────────────────────
  let activeCount = 0;
  let pausedCount = 0;
  let monthlySpendKobo = 0;
  let nextRenewalIso: string | null = null;
  let nextRenewalMs = Number.POSITIVE_INFINITY;
  for (const s of subscriptions) {
    const status = String(s.status || "").toLowerCase();
    if (status === "active") activeCount += 1;
    if (status === "paused") pausedCount += 1;
    const cycle = String(s.billing_cycle || "").toLowerCase();
    const amount = Number(s.amount_kobo) || 0;
    if (status === "active") {
      if (cycle === "monthly") monthlySpendKobo += amount;
      else if (cycle === "yearly" || cycle === "annual")
        monthlySpendKobo += Math.round(amount / 12);
    }
    const end = s.current_period_end ? String(s.current_period_end) : null;
    if (end) {
      const ms = Date.parse(end);
      if (Number.isFinite(ms) && ms > Date.now() && ms < nextRenewalMs) {
        nextRenewalMs = ms;
        nextRenewalIso = end;
      }
    }
  }

  const tiles: ReadonlyArray<HeroCardTile> = [
    {
      label: copy.statusLabels.active,
      value: activeCount,
      foot: subscriptions.length > 0 ? copy.hero.description : undefined,
      tone: activeCount > 0 ? "active" : "default",
    },
    {
      label: copy.statusLabels.paused,
      value: pausedCount,
      tone: pausedCount > 0 ? "warning" : "default",
    },
    {
      label: copy.card.amountLabel,
      value: formatCurrencyAmount(monthlySpendKobo, "NGN", {
        unit: "kobo",
        locale,
      }),
      foot: copy.cycleLabels.monthly,
    },
    {
      label: copy.card.renewsLabel,
      value: nextRenewalIso ? formatDate(nextRenewalIso, locale) : "—",
      foot: nextRenewalIso ? copy.card.renewsLabel : copy.card.renewsFallback,
    },
  ];

  return (
    <DivisionLanding
      className="acct-fade-in"
      hero={
        <HeroCard
          variant="solo"
          tone={subscriptions.length === 0 ? "empty" : activeCount > 0 ? "active" : "calm"}
          eyebrow={copy.hero.title}
          headline={copy.hero.title}
          blurb={copy.hero.description}
          tiles={tiles}
        />
      }
      sections={[
        {
          id: "subscriptions-list",
          title: copy.hero.title,
          meta: `${subscriptions.length}`,
          content:
            subscriptions.length === 0 ? (
              <EmptyStateCard
                kicker={copy.hero.title}
                title={copy.empty.title}
                body={copy.empty.description}
              />
            ) : (
              <TimelineCard ariaLabel={copy.hero.title}>
                {subscriptions.map((subscription) => {
                  const status = String(subscription.status || "").toLowerCase();
                  const division = String(subscription.division || "");
                  const cycle = String(subscription.billing_cycle || "");
                  const amount = `${formatCurrencyAmount(
                    Number(subscription.amount_kobo || 0),
                    String(subscription.currency || "NGN"),
                    { unit: "kobo", locale },
                  )} · ${localizeCycle(cycle)}`;
                  const chips: TimelineChip[] = [
                    { label: localizeStatus(status), tone: statusTone(status) },
                  ];
                  if (division) {
                    chips.unshift({
                      label: divisionLabel(division),
                      tone: "gold",
                    });
                  }
                  return (
                    <Link
                      key={subscription.id as string}
                      href={`/subscriptions/${subscription.id}`}
                      style={{ display: "block", textDecoration: "none" }}
                    >
                      <TimelineRow
                        avatar={divisionLabel(division).charAt(0)}
                        avatarColor={divisionColor(division)}
                        avatarTone="division"
                        title={
                          (subscription.plan_name as string) ||
                          copy.card.planFallback
                        }
                        detail={amount}
                        chips={chips}
                        time={
                          subscription.current_period_end
                            ? formatDate(
                                subscription.current_period_end as string,
                                locale,
                              )
                            : undefined
                        }
                      />
                    </Link>
                  );
                })}
              </TimelineCard>
            ),
        },
      ]}
      footer={
        subscriptions.length === 0 ? (
          <p
            style={{
              fontSize: 11,
              color: "var(--acct-muted)",
              textAlign: "center",
              margin: "8px 0 0",
            }}
          >
            <RefreshCcw size={12} aria-hidden style={{ verticalAlign: "middle" }} />
          </p>
        ) : null
      }
    />
  );
}
