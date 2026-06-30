import { notFound } from "next/navigation";
import { translateSurfaceLabel } from "@henryco/i18n";
import { IntelligenceChatPanel } from "@/components/marketplace/ai/IntelligenceChatPanel";
import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { vendorNav } from "@/lib/marketplace/navigation";
import { getMarketplacePublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

// Flag-dark: the governed metered chat renders only when the company turns it on (and the
// global AI kill switch is enabled — the gateway enforces that server-side). Reconcile the
// rate card to live provider prices and set PAYMENTS_DATABASE_URL before enabling.
const AI_CHAT_ENABLED = process.env.MARKETPLACE_AI_CHAT === "true";

export default async function VendorIntelligencePage() {
  if (!AI_CHAT_ENABLED) notFound();

  const locale = await getMarketplacePublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  await requireMarketplaceRoles(["vendor", "marketplace_owner", "marketplace_admin"], "/vendor/intelligence");

  return (
    <WorkspaceShell
      title={t("Ask Henry Onyx Intelligence")}
      description={t("Ask anything about running your Henry Onyx workspace.")}
      nav={vendorNav("/vendor/intelligence", locale)}
    >
      <IntelligenceChatPanel
        copy={{
          heading: t("Ask Henry Onyx Intelligence"),
          intro: t("Ask anything about running your Henry Onyx workspace."),
          placeholder: t("Type your message"),
          send: t("Send"),
          sending: t("Sending…"),
          advisory: t("Each reply is metered to your wallet."),
          errorFallback: t("Henry Onyx Intelligence is unavailable right now."),
          priceTemplate: t("Henry Onyx Intelligence · {price} (incl. {vat} VAT) · {tier}"),
        }}
      />
    </WorkspaceShell>
  );
}
