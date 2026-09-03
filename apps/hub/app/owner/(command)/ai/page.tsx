import type { Metadata } from "next";
import Link from "next/link";
import { getHubOwnerAiCopy } from "@henryco/i18n/server";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import DivisionBadge from "@/components/owner/DivisionBadge";
import { getHelperCenterData } from "@/lib/owner-data";
import { getHubPublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getHubPublicLocale();
  const copy = getHubOwnerAiCopy(locale);
  return {
    title: copy.overview.metadata.title,
    description: copy.overview.metadata.description,
  };
}

export default async function HelperDashboardPage() {
  const locale = await getHubPublicLocale();
  const copy = getHubOwnerAiCopy(locale);
  const data = await getHelperCenterData();
  const { briefing } = data;

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow={copy.overview.hero.eyebrow}
        title={copy.overview.hero.title}
        description={copy.overview.hero.description}
        actions={
          <>
            <Link href="/owner/ai/signals" className="acct-button-secondary">
              {copy.overview.hero.signals}
            </Link>
            <Link href="/owner/ai/insights" className="acct-button-primary">
              {copy.overview.hero.insights}
            </Link>
          </>
        }
      />

      <OwnerPanel
        title={copy.overview.briefing.title}
        description={copy.overview.briefing.description}
      >
        <div className="space-y-4 rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-5">
          <p className="text-lg font-semibold text-[var(--acct-ink)]">{briefing.headline}</p>
          <p className="text-sm leading-relaxed text-[var(--acct-muted)]">{briefing.focus}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg)] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--acct-muted)]">
                {copy.overview.briefing.failedDeliveries}
              </p>
              <p className="mt-1 text-2xl font-semibold text-[var(--acct-ink)]">
                {briefing.commsHealth.failedDeliveries}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg)] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--acct-muted)]">
                {copy.overview.briefing.whatsappSkipped}
              </p>
              <p className="mt-1 text-2xl font-semibold text-[var(--acct-ink)]">
                {briefing.commsHealth.skippedWhatsApp}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg)] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--acct-muted)]">
                {copy.overview.briefing.openSupport}
              </p>
              <p className="mt-1 text-2xl font-semibold text-[var(--acct-ink)]">
                {briefing.commsHealth.openSupportThreads}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg)] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--acct-muted)]">
                {copy.overview.briefing.queuedNotices}
              </p>
              <p className="mt-1 text-2xl font-semibold text-[var(--acct-ink)]">
                {briefing.commsHealth.queuedNotifications}
              </p>
            </div>
          </div>
        </div>
      </OwnerPanel>

      <OwnerPanel title={copy.overview.actionQueue.title} description={copy.overview.actionQueue.description}>
        <div className="grid gap-3 lg:grid-cols-2">
          {briefing.nextSteps.map((step) => (
            <Link
              key={step.title}
              href={step.href}
              className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4 transition hover:border-[var(--acct-gold)]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-[var(--acct-ink)]">{step.title}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    step.severity === "critical"
                      ? "bg-[var(--acct-red-soft)] text-[var(--acct-red-text)]"
                      : step.severity === "warning"
                        ? "bg-[var(--acct-orange-soft)] text-[var(--acct-orange-text)]"
                        : "bg-[var(--acct-blue-soft)] text-[var(--acct-blue-text)]"
                  }`}
                >
                  {step.severity}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--acct-muted)]">{step.reason}</p>
              <span className="mt-3 inline-block text-xs font-semibold text-[var(--owner-accent)]">
                {copy.overview.actionQueue.openLink}
              </span>
            </Link>
          ))}
        </div>
      </OwnerPanel>

      {briefing.divisionPressure.length > 0 ? (
        <OwnerPanel title={copy.overview.divisionPressure.title} description={copy.overview.divisionPressure.description}>
          <div className="grid gap-3 md:grid-cols-2">
            {briefing.divisionPressure.map((d) => (
              <div
                key={d.slug}
                className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[var(--acct-ink)]">{d.label}</span>
                  <DivisionBadge division={d.slug} />
                </div>
                <p className="mt-2 text-xs text-[var(--acct-muted)]">
                  {copy.overview.divisionPressure.healthTemplate.replace("{score}", String(d.healthScore))}
                </p>
                <p className="mt-2 text-sm text-[var(--acct-muted)]">{d.note}</p>
                <Link
                  href={`/owner/divisions/${d.slug}`}
                  className="mt-3 inline-block text-xs font-semibold text-[var(--owner-accent)]"
                >
                  {copy.overview.divisionPressure.divisionDetail}
                </Link>
              </div>
            ))}
          </div>
        </OwnerPanel>
      ) : null}

      <OwnerPanel title={copy.overview.scorecards.title} description={copy.overview.scorecards.description}>
        <div className="grid gap-4 lg:grid-cols-2">
          {data.scorecards.map((card) => (
            <div
              key={card.slug}
              className="rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-[var(--acct-ink)]">{card.label}</div>
                <DivisionBadge division={card.slug} />
              </div>
              <p className="mt-2 text-sm text-[var(--acct-muted)]">{card.summary}</p>
              <div className="mt-3 text-xs uppercase tracking-wide text-[var(--acct-muted)]">
                {copy.overview.scorecards.healthScoreTemplate.replace("{score}", String(card.healthScore))}
              </div>
            </div>
          ))}
        </div>
      </OwnerPanel>
    </div>
  );
}
