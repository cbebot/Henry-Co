import Link from "next/link";
import type { Metadata } from "next";
import { getAccountUrl, getDivisionConfig } from "@henryco/config";
import { getPublicLogisticsSnapshot } from "@/lib/logistics/data";

export const metadata: Metadata = {
  title: "Support | HenryCo Logistics",
  description: "Contact HenryCo Logistics support or continue a conversation from your HenryCo account.",
};

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const logistics = getDivisionConfig("logistics");
  const { settings } = await getPublicLogisticsSnapshot();

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <h1 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">Support</h1>
        <p className="max-w-2xl text-pretty text-[var(--logistics-muted)]">
          Shipment exceptions, billing questions, routing changes &mdash; reach the logistics desk directly. HenryCo account users should open a logistics-tagged thread so history stays in one place.
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
