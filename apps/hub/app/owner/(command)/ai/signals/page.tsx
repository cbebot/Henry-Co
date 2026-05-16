import type { Metadata } from "next";
import { getHubOwnerAiCopy } from "@henryco/i18n/server";
import DivisionBadge from "@/components/owner/DivisionBadge";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { getHelperCenterData } from "@/lib/owner-data";
import { getHubPublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getHubPublicLocale();
  const copy = getHubOwnerAiCopy(locale);
  return {
    title: copy.signals.metadata.title,
    description: copy.signals.metadata.description,
  };
}

export default async function HelperSignalsPage() {
  const locale = await getHubPublicLocale();
  const copy = getHubOwnerAiCopy(locale);
  const data = await getHelperCenterData();

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow={copy.signals.hero.eyebrow}
        title={copy.signals.hero.title}
        description={copy.signals.hero.description}
      />

      <OwnerPanel title={copy.signals.panel.title} description={copy.signals.panel.description}>
        <div className="space-y-3">
          {data.signals.map((signal) => (
            <div key={signal.id} className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-[var(--acct-ink)]">{signal.title}</div>
                {signal.division ? <DivisionBadge division={signal.division} /> : null}
              </div>
              <p className="mt-2 text-sm text-[var(--acct-muted)]">{signal.body}</p>
            </div>
          ))}
        </div>
      </OwnerPanel>
    </div>
  );
}
