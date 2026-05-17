import type { Metadata } from "next";
import Link from "next/link";
import { getHubOwnerCopy } from "@henryco/i18n/server";
import InternalTeamCommsClient from "@/components/owner/InternalTeamCommsClient";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { getHubPublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getHubPublicLocale();
  const copy = getHubOwnerCopy(locale).internalTeamComms;
  return {
    title: copy.pageTitle,
    description: copy.pageDescription,
  };
}

export default async function OwnerMessagingTeamPage() {
  const locale = await getHubPublicLocale();
  const copy = getHubOwnerCopy(locale).internalTeamComms;

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow={copy.pageEyebrow}
        title={copy.pageTitle}
        description={copy.pageDescription}
        actions={
          <>
            <Link href="/owner/messaging" className="acct-button-secondary">
              {copy.pageDeliveryOverview}
            </Link>
            <Link href="/owner/ai" className="acct-button-primary">
              {copy.pageOwnerAssistant}
            </Link>
          </>
        }
      />

      <OwnerPanel title={copy.pagePanelTitle} description={copy.pagePanelDescription}>
        <InternalTeamCommsClient copy={copy} />
      </OwnerPanel>
    </div>
  );
}
