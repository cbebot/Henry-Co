import { RouteLiveRefresh } from "@henryco/ui";
import { translateSurfaceLabel } from "@henryco/i18n";
import { COMPANY } from "@henryco/config";
import { requireOwner } from "@/lib/owner-auth";
import { OwnerPageHeader, OwnerNotice } from "@/components/owner/OwnerPrimitives";
import { SensitiveActionProviderBridge } from "@/components/auth/SensitiveActionProviderBridge";
import {
  listOperatorProposals,
  sweepExpiredOperatorProposals,
} from "@/lib/founder-intelligence/operator-inbox";
import { getHubPublicLocale } from "@/lib/locale-server";
import { OperatorDecisionsClient, OwnerPushEnroll } from "./decisions-client";

export const dynamic = "force-dynamic";

/**
 * SA-4 — the decisions inbox (ARCHITECTURE §4.2): the triaged queue of
 * server-initiated operator proposals. The owner returns to decisions, not a
 * chat scrollback; every tap still crosses the reauth-gated confirm route.
 */
export default async function OwnerOperatorDecisionsPage() {
  // Defense in depth: the (command) layout gates the group, but these reads use
  // the service-role client so we re-assert owner access here.
  const owner = await requireOwner();
  const locale = await getHubPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  await sweepExpiredOperatorProposals(owner.id);
  const items = await listOperatorProposals(owner.id);

  const actionsLive =
    process.env.NEXT_PUBLIC_FOUNDER_INTELLIGENCE_LIVE === "1" && process.env.FOUNDER_ACTIONS_LIVE === "1";

  return (
    <div className="space-y-6 acct-fade-in">
      <RouteLiveRefresh intervalMs={30000} />

      <OwnerPageHeader
        eyebrow={`${COMPANY.group.name} · ${t("Operator")}`}
        title={t("Decisions waiting on you")}
        description={t(
          "While you are away, the operator keeps the studio agency moving on everything reversible and queues the consequential calls here. One tap decides; deploys and money always ask for your password again.",
        )}
      />

      <OwnerPushEnroll />

      {!actionsLive ? (
        <OwnerNotice
          tone="warning"
          title={t("Founder actions are not live")}
          body={t(
            "Confirming a decision requires FOUNDER_ACTIONS_LIVE and the intelligence surface to be enabled for this deployment.",
          )}
        />
      ) : null}

      <SensitiveActionProviderBridge email={owner.email ?? null}>
        <OperatorDecisionsClient
          items={items.map((item) => ({
            token: item.token,
            actionKey: item.actionKey,
            title: item.title,
            body: item.body,
            confirmLabel: item.confirmLabel,
            rationale: item.rationale,
            requiresReauth: item.requiresReauth,
            createdAt: item.createdAt,
          }))}
        />
      </SensitiveActionProviderBridge>
    </div>
  );
}
