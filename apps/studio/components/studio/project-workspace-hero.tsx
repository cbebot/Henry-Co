import Link from "next/link";
import { formatCurrency } from "@/lib/env";
import { clientProjectStatusLabel } from "@/lib/studio/project-workspace-copy";
import { getStudioLoginUrl } from "@/lib/studio/links";
import type { StudioProject } from "@/lib/studio/types";
import { getStudioProjectCopy } from "@henryco/i18n";
import { getStudioPublicLocale } from "@/lib/locale-server";

type Overview = {
  outstanding: number;
  paid: number;
  approvedMilestones: number;
  totalMilestones: number;
  nextPayment: { label: string } | null;
};

export async function ProjectWorkspaceHero({
  project,
  serviceName,
  teamLine,
  proposalCurrency,
  paymentOverview,
  viewer,
  accountUrl,
  redirectPath,
  isStaff,
  clientCta,
}: {
  project: StudioProject;
  serviceName: string;
  teamLine: string;
  proposalCurrency: string;
  paymentOverview: Overview;
  viewer: { user: { fullName?: string | null; email?: string | null } | null | undefined };
  accountUrl: string;
  redirectPath: string;
  isStaff: boolean;
  clientCta: { href: string; label: string; sub?: string } | null;
}) {
  const locale = await getStudioPublicLocale();
  const copy = getStudioProjectCopy(locale).hero;
  const statusLabel = clientProjectStatusLabel(project.status);

  return (
    <section className="relative overflow-hidden rounded-[2.6rem] border border-[rgba(151,244,243,0.2)] bg-[linear-gradient(165deg,rgba(14,52,62,0.55)_0%,rgba(5,14,20,0.92)_45%,rgba(4,10,16,0.97)_100%)] px-7 py-10 shadow-[0_28px_80px_rgba(0,0,0,0.35)] sm:px-10 sm:py-12 lg:px-14 lg:py-14">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(88,212,210,0.12),transparent_68%)]"
        aria-hidden
      />
      <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(151,244,243,0.25)] bg-black/20 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--studio-signal)]">
            {copy.clientWorkspaceBadge}
          </div>
          <h1 className="studio-display mt-6 max-w-4xl text-[var(--studio-ink)] text-[clamp(1.85rem,4vw,2.85rem)] leading-[1.08] tracking-[-0.04em]">
            {project.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--studio-ink-soft)] sm:text-lg">{project.summary}</p>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
            {clientCta ? (
              <a
                href={clientCta.href}
                className="studio-button-primary inline-flex items-center justify-center rounded-full px-8 py-4 text-sm font-semibold shadow-[0_16px_40px_rgba(74,193,197,0.2)]"
              >
                {clientCta.label}
              </a>
            ) : null}
            {clientCta?.sub ? (
              <p className="max-w-md text-sm leading-7 text-[var(--studio-ink-soft)]">{clientCta.sub}</p>
            ) : null}
            {!clientCta && !isStaff ? (
              <p className="text-sm font-medium text-[var(--studio-signal)]">{copy.nextPrefix}{project.nextAction}</p>
            ) : null}
            {isStaff ? (
              <p className="text-sm text-[var(--studio-ink-soft)]">
                <span className="font-medium text-[var(--studio-ink)]">{copy.teamView}</span> · {project.nextAction}
              </p>
            ) : null}
          </div>

          <div className="mt-8 rounded-[1.35rem] border border-[var(--studio-line)] bg-black/20 px-4 py-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
            {viewer.user ? (
              <>
                {copy.signedInAs}{" "}
                <span className="font-medium text-[var(--studio-ink)]">
                  {viewer.user.fullName || viewer.user.email}
                </span>
                {". "}
                {copy.projectsLiveInPrefix}{" "}
                <Link href={`${accountUrl}?ref=studio-project`} className="font-semibold text-[var(--studio-signal)]">
                  {copy.henrycoAccount}
                </Link>
                .
              </>
            ) : (
              <>
                {copy.secureLinkAccess}{" "}
                <Link href={getStudioLoginUrl(redirectPath)} className="font-semibold text-[var(--studio-signal)]">
                  {copy.signIn}
                </Link>{" "}
                {copy.attachSuffix}
              </>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-1">
          {[
            {
              label: copy.cardProjectStatus,
              value: statusLabel,
              detail: `${serviceName} · ${teamLine}`,
            },
            {
              label: copy.cardBalanceDue,
              value: formatCurrency(paymentOverview.outstanding, proposalCurrency),
              detail: copy.milestonesApproved(
                paymentOverview.approvedMilestones,
                paymentOverview.totalMilestones,
              ),
            },
            {
              label: copy.cardPaidToDate,
              value: formatCurrency(paymentOverview.paid, proposalCurrency),
              detail: paymentOverview.nextPayment
                ? `${copy.nextPaymentPrefix}${paymentOverview.nextPayment.label}`
                : copy.allPaymentsUpToDate,
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-[1.5rem] border border-[rgba(151,244,243,0.12)] bg-black/25 px-5 py-4 backdrop-blur-sm"
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--studio-signal)]">
                {card.label}
              </div>
              <div className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--studio-ink)] sm:text-2xl">
                {card.value}
              </div>
              <div className="mt-2 text-xs leading-5 text-[var(--studio-ink-soft)]">{card.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
