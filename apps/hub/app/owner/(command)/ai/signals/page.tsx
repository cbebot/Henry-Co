import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, AlertTriangle, Info, CheckCircle, AlertCircle } from "lucide-react";
import { getHubOwnerAiCopy } from "@henryco/i18n/server";
import { translateSurfaceLabel } from "@henryco/i18n";
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
  const t = (s: string) => translateSurfaceLabel(locale, s);
  const data = await getHelperCenterData();

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow={copy.signals.hero.eyebrow}
        title={copy.signals.hero.title}
        description={copy.signals.hero.description}
      />

      <OwnerPanel title={copy.signals.panel.title} description={copy.signals.panel.description}>
        {data.signals.length === 0 ? (
          <div className="rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-6 text-sm text-[var(--acct-muted)]">
            {t("No active signals. All systems healthy.")}
          </div>
        ) : (
          <div className="space-y-3">
            {data.signals.map((signal) => (
              <div
                key={signal.id}
                className={`rounded-[1.25rem] border p-4 ${
                  signal.severity === "critical"
                    ? "border-[var(--acct-red-text)]/20 bg-[var(--acct-red-soft)]"
                    : signal.severity === "warning"
                      ? "border-[var(--acct-orange-text)]/20 bg-[var(--acct-bg-soft)]"
                      : signal.severity === "good"
                        ? "border-[var(--acct-green-text)]/20 bg-[var(--acct-bg-soft)]"
                        : "border-[var(--acct-line)] bg-[var(--acct-bg-soft)]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <SeverityIcon severity={signal.severity} />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[var(--acct-ink)]">{signal.title}</div>
                      <p className="mt-1.5 text-sm leading-relaxed text-[var(--acct-muted)]">{signal.body}</p>
                    </div>
                  </div>
                  {signal.division ? <DivisionBadge division={signal.division} /> : null}
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <Link
                    href={signal.href}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--owner-accent)]"
                  >
                    {t("Open module")}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                  <span className="text-[10px] uppercase tracking-wider text-[var(--acct-muted)]">
                    {signal.source}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </OwnerPanel>
    </div>
  );
}

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === "critical")
    return <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--acct-red-text)]" aria-hidden />;
  if (severity === "warning")
    return <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--acct-orange-text)]" aria-hidden />;
  if (severity === "good")
    return <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--acct-green-text)]" aria-hidden />;
  return <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--acct-muted)]" aria-hidden />;
}
