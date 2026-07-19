import { translateSurfaceLabel } from "@henryco/i18n/server";
import { requireLearnRoles } from "@/lib/learn/auth";
import { getLearnPublicLocale } from "@/lib/locale-server";
import { instructorNav } from "@/lib/learn/navigation";
import { getInstructorPayoutSummary } from "@/lib/learn/instructor-payouts";
import { LearnPanel, LearnSectionIntro, LearnStatusBadge, LearnWorkspaceShell } from "@/components/learn/ui";

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(amount / 100);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

export default async function InstructorPayoutsPage() {
  const viewer = await requireLearnRoles(
    ["academy_owner", "academy_admin", "instructor"],
    "/instructor/payouts",
  );
  const [summary, locale] = await Promise.all([
    getInstructorPayoutSummary(viewer),
    getLearnPublicLocale(),
  ]);
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <LearnWorkspaceShell
      kicker={t("Payouts")}
      title={t("Track earnings and request a payout.")}
      description={t(
        "Each completed enrollment under your courses contributes to the gross figure. Net payout reflects Henry Onyx's platform fee per your payout model.",
      )}
      nav={instructorNav("/instructor/payouts", t)}
    >
      <section className="grid gap-4 sm:grid-cols-3">
        <LearnPanel className="rounded-[1.4rem] p-5">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
            {t("Lifetime gross")}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--learn-ink)]">
            {formatMoney(summary.lifetime.gross, summary.currency)}
          </p>
        </LearnPanel>
        <LearnPanel className="rounded-[1.4rem] p-5">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
            {t("Net to you")}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--learn-ink)]">
            {formatMoney(summary.lifetime.net, summary.currency)}
          </p>
        </LearnPanel>
        <LearnPanel className="rounded-[1.4rem] p-5">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
            {t("Pending payouts")}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--learn-ink)]">
            {formatMoney(summary.pending, summary.currency)}
          </p>
        </LearnPanel>
      </section>

      <LearnSectionIntro
        className="mt-10"
        kicker={t("Payout history")}
        title={t("Settled and pending payouts")}
        body={t(
          "Payouts are released after the 7-day refund window closes for each enrollment in the period. You'll see each payout move from requested, to confirmed, to paid.",
        )}
      />
      <ul className="mt-6 space-y-3">
        {summary.records.length === 0 ? (
          <li className="text-sm text-[var(--learn-ink-soft)]">
            {t("No payouts on record yet. Course revenue starts here.")}
          </li>
        ) : (
          summary.records.map((record) => (
            <li
              key={record.id}
              className="grid gap-3 rounded-[1.4rem] border border-[var(--learn-line)] bg-[var(--learn-fill-faint)] p-4 sm:grid-cols-[1.4fr,1fr] sm:items-center"
            >
              <div>
                <p className="text-sm font-semibold text-[var(--learn-ink)]">
                  {record.courseTitle ?? t("Course payout")}
                </p>
                <p className="mt-1 text-xs text-[var(--learn-ink-soft)]">
                  {record.payoutModel === "fixed_fee"
                    ? t("Fixed fee")
                    : record.payoutModel === "stipend"
                      ? t("Stipend")
                      : record.payoutModel === "pending"
                        ? t("To be agreed")
                        : t("Revenue share")} ·{" "}
                  {formatDate(record.periodStart)} → {formatDate(record.periodEnd)}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
                <LearnStatusBadge label={formatMoney(record.netPayout, record.currency)} tone="signal" />
                <LearnStatusBadge
                  label={
                    record.status === "paid"
                      ? t("Paid")
                      : record.status === "approved"
                        ? t("Confirmed")
                        : t("Requested")
                  }
                  tone={record.status === "paid" ? "success" : "neutral"}
                />
              </div>
            </li>
          ))
        )}
      </ul>
    </LearnWorkspaceShell>
  );
}
