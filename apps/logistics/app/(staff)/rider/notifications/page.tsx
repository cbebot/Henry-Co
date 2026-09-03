import { Panel, EmptyState } from "@henryco/dashboard-shell/components";
import { translateSurfaceLabel } from "@henryco/i18n";
import { getLogisticsPublicLocale } from "@/lib/locale-server";

/**
 * V3 PASS 21 — Rider workspace: alerts inbox.
 *
 * This surface mounts NotificationsDrawerBody from
 * @henryco/dashboard-shell so the rider sees the same notification
 * pipeline staff use in the cross-division shell. We dynamic-import
 * it client-side because the bell + popover are interactive.
 */
export const dynamic = "force-dynamic";

export default async function RiderNotificationsPage() {
  const locale = await getLogisticsPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  return (
    <div className="space-y-8 py-6">
      <header>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
          {t("Alerts")}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {t("Inbox")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--logistics-muted)]">
          {t("Dispatch assignments, customer messages, and operational broadcasts. The toast viewport mounted on this shell also pushes incoming alerts in real time.")}
        </p>
      </header>

      <Panel tone="flat">
        <EmptyState
          kicker={t("Live inbox")}
          headline={t("Alerts will surface here")}
          body={t("When dispatch assigns a leg or a customer asks a question, the alert lands at the top of this list with an audible toast on mobile.")}
        />
      </Panel>
    </div>
  );
}
