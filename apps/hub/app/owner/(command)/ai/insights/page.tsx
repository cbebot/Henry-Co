import type { Metadata } from "next";
import Link from "next/link";
import { getHubOwnerAiCopy } from "@henryco/i18n/server";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { getHelperCenterData } from "@/lib/owner-data";
import { getHubPublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getHubPublicLocale();
  const copy = getHubOwnerAiCopy(locale);
  return {
    title: copy.insights.metadata.title,
    description: copy.insights.metadata.description,
  };
}

export default async function HelperInsightsPage() {
  const locale = await getHubPublicLocale();
  const copy = getHubOwnerAiCopy(locale);
  const data = await getHelperCenterData();

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow={copy.insights.hero.eyebrow}
        title={copy.insights.hero.title}
        description={copy.insights.hero.description}
      />

      <OwnerPanel title={copy.insights.panel.title} description={copy.insights.panel.description}>
        <div className="space-y-3">
          {data.insights.map((insight) => (
            <div key={insight.id} className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
              <div className="text-sm font-semibold text-[var(--acct-ink)]">{insight.title}</div>
              <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">{insight.body}</p>
              <Link href={insight.href} className="mt-3 inline-flex text-xs font-semibold text-[var(--owner-accent)]">
                {copy.insights.panel.openActionPath}
              </Link>
            </div>
          ))}
        </div>
      </OwnerPanel>
    </div>
  );
}
