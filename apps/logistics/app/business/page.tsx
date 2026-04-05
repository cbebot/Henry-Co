import Link from "next/link";
import type { Metadata } from "next";
import { getAccountUrl } from "@henryco/config";

export const metadata: Metadata = {
  title: "Business logistics | HenryCo Logistics",
  description: "Repeat routes, governed pricing, and account-level visibility for business shippers.",
};

export default function BusinessPage() {
  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Built for operators, not one-off chaos</h1>
        <p className="text-[var(--logistics-muted)]">
          HenryCo Logistics pairs public booking and tracking with the same shipment model we use internally. Business
          teams get predictable pricing, milestone visibility, proof-of-delivery discipline, and a path into the shared
          HenryCo account for receipts, notifications, and support threads.
        </p>
        <ul className="space-y-3 text-sm text-[var(--logistics-muted)]">
          <li className="flex gap-2">
            <span className="text-[var(--logistics-accent)]">•</span>
            Repeat pickup and delivery pairs without rebuilding paperwork every time.
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--logistics-accent)]">•</span>
            Escalations become structured issues with audit-friendly history.
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--logistics-accent)]">•</span>
            Customer experience stays premium even when the route is difficult.
          </li>
        </ul>
        <div className="flex flex-wrap gap-3">
          <Link href="/quote" className="rounded-full bg-[var(--logistics-accent)] px-6 py-2.5 text-sm font-semibold text-[#170f12]">
            Talk to us with a quote
          </Link>
          <Link
            href={getAccountUrl("/logistics")}
            className="rounded-full border border-[var(--logistics-line)] px-6 py-2.5 text-sm font-semibold text-white/90"
          >
            Open logistics in account
          </Link>
        </div>
      </div>
    </main>
  );
}
