import Link from "next/link";
import { Activity } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import { requireAccountUser } from "@/lib/auth";
import { getRecentActivity } from "@/lib/account-data";
import { activityMessageHref } from "@/lib/notification-center";
import { timeAgoLocalized, divisionLabel, divisionColor, formatNaira } from "@/lib/format";
import { getAccountAppLocale } from "@/lib/locale-server";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/layout/EmptyState";

export const dynamic = "force-dynamic";

function getStatusLabel(locale: string, value: string | number | null) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return null;

  const labels: Record<string, string> =
    locale === "fr"
      ? {
          pending: "En attente",
          open: "Ouvert",
          updated: "Mis à jour",
          completed: "Terminé",
          resolved: "Résolu",
          paid: "Payé",
          failed: "Échoué",
          active: "Actif",
        }
      : {};

  return labels[normalized] || String(value);
}

export default async function ActivityPage() {
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const activity = await getRecentActivity(user.id, 50);
  const copy =
    locale === "fr"
      ? {
          title: "Activité",
          description: "Tout ce que vous avez fait dans les divisions HenryCo.",
          emptyTitle: "Aucune activité pour le moment",
          emptyDescription:
            "Votre activité inter-division apparaîtra ici au fur et à mesure de votre utilisation des services HenryCo.",
        }
      : {
          title: "Activity",
          description: "Everything you've done across all HenryCo divisions.",
          emptyTitle: "No activity yet",
          emptyDescription:
            "Your cross-division activity will appear here as you use HenryCo services.",
        };

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title={copy.title}
        description={copy.description}
        icon={Activity}
      />

      {activity.length === 0 ? (
        <EmptyState
          icon={Activity}
          title={copy.emptyTitle}
          description={copy.emptyDescription}
        />
      ) : (
        <div className="acct-card divide-y divide-[var(--acct-line)]">
          {activity.map((item: Record<string, string | number | null>) => (
            <Link
              key={item.id as string}
              href={activityMessageHref(String(item.id || ""))}
              className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-[var(--acct-bg-elevated)]"
            >
              <div
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                style={{ backgroundColor: divisionColor(item.division as string) }}
              >
                {divisionLabel(item.division as string).charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--acct-ink)]">{item.title}</p>
                {item.description && (
                  <p className="mt-0.5 text-sm text-[var(--acct-muted)]">{item.description}</p>
                )}
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="acct-chip acct-chip-gold text-[0.65rem]">
                    {translateSurfaceLabel(locale, divisionLabel(item.division as string))}
                  </span>
                  {item.status ? (
                    <span className="acct-chip acct-chip-blue text-[0.65rem]">
                      {getStatusLabel(locale, item.status)}
                    </span>
                  ) : null}
                  <span className="text-[0.65rem] text-[var(--acct-muted)]">
                    {timeAgoLocalized(item.created_at as string, locale)}
                  </span>
                </div>
              </div>
              {item.amount_kobo ? (
                <p className="shrink-0 text-sm font-semibold text-[var(--acct-ink)]">
                  {formatNaira(item.amount_kobo as number, { locale })}
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
