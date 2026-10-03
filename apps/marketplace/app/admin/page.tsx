import { WorkspaceShell } from "@/components/marketplace/shell";
import { VendorApplicationQueue } from "@/components/marketplace/vendor-application-queue";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getStaffQueueData } from "@/lib/marketplace/data";
import { staffNav } from "@/lib/marketplace/navigation";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import { getMarketplaceTrustCopy } from "@henryco/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getMarketplacePublicLocale();
  await requireMarketplaceRoles(["marketplace_owner", "marketplace_admin"], "/admin");
  const [data, params] = await Promise.all([
    getStaffQueueData(),
    searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>),
  ]);
  // An approval the system refused says why, instead of returning to the queue in silence.
  const ownerCopy = getMarketplaceTrustCopy(locale).owner;
  const refusal =
    params.error === "store-handle-taken"
      ? ownerCopy.storeHandleTaken
      : params.error === "decision-failed"
        ? ownerCopy.actionFailed
        : null;

  return (
    <WorkspaceShell
      title="Vendor Applications"
      description="Review seller applications before granting store access. Approve to create the vendor store, hold for further checks, or reject with a note."
      nav={staffNav("/admin", "/admin", locale)}
    >
      {refusal ? (
        <div
          role="alert"
          className="market-paper mb-6 rounded-[1.5rem] border border-[var(--market-line)] px-5 py-4 text-sm leading-7 text-[var(--market-paper-white)]"
        >
          {refusal}
        </div>
      ) : null}
      <VendorApplicationQueue
        applications={data.applications as Array<Record<string, unknown>>}
        returnTo="/admin"
      />
    </WorkspaceShell>
  );
}
