import Link from "next/link";
import type { Metadata } from "next";
import { createDivisionMetadata, getAccountUrl, getDivisionConfig } from "@henryco/config";
import { getPublicLogisticsSnapshot } from "@/lib/logistics/data";

export const metadata: Metadata = createDivisionMetadata("logistics", {
  title: "Support | HenryCo Logistics",
  description: "Contact HenryCo Logistics support or continue a conversation from your HenryCo account.",
  path: "/support",
});

export const revalidate = 300;

export default async function SupportPage() {
  const logistics = getDivisionConfig("logistics");
  const { settings } = await getPublicLogisticsSnapshot();

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Support</h1>
        <p className="text-[var(--logistics-muted)]">
          For shipment exceptions, billing questions, or routing changes, reach the logistics desk directly. If you use
          the HenryCo account, open a logistics-tagged thread so your history stays in one place.
        </p>
        <div className="rounded-[1.75rem] border border-[var(--logistics-line)] bg-[var(--logistics-panel)] p-6 space-y-4">
          <a href={`mailto:${logistics.supportEmail}`} className="block text-lg font-semibold text-[var(--logistics-accent-soft)]">
            {logistics.supportEmail}
          </a>
          <a href={`tel:${logistics.supportPhone}`} className="block text-white/90">
            {logistics.supportPhone}
          </a>
          <p className="text-sm text-[var(--logistics-muted)]">
            {settings.pickupHours} · {settings.operationsCity}, {settings.operationsRegion}
          </p>
        </div>
        <Link href={getAccountUrl("/support")} className="inline-flex rounded-full border border-[var(--logistics-line)] px-6 py-2.5 text-sm font-semibold text-white">
          Account support center
        </Link>
      </div>
    </main>
  );
}
