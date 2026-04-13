import Link from "next/link";
import { Truck } from "lucide-react";
import { getDivisionUrl } from "@henryco/config";
import { requireAccountUser } from "@/lib/auth";
import {
  getDivisionActivity,
  getDivisionInvoices,
  getDivisionNotifications,
  getDivisionSupportThreads,
} from "@/lib/division-data";
import { getProfile } from "@/lib/account-data";
import {
  getLogisticsShipmentsForAccountUser,
  logisticsTrackUrl,
  type AccountLogisticsShipmentRow,
} from "@/lib/logistics-module";
import DivisionModulePage from "@/components/divisions/DivisionModulePage";
import { formatCurrencyAmount } from "@/lib/format";
import { resolveAccountRegionalContext } from "@/lib/regional-context";

export const dynamic = "force-dynamic";

export default async function LogisticsPage() {
  const user = await requireAccountUser();
  const email =
    typeof user.email === "string" && user.email.trim()
      ? user.email.trim().toLowerCase()
      : null;

  const [activity, notifications, supportThreads, invoices, shipments, profile] = await Promise.all([
    getDivisionActivity(user.id, "logistics"),
    getDivisionNotifications(user.id, "logistics"),
    getDivisionSupportThreads(user.id, "logistics"),
    getDivisionInvoices(user.id, "logistics"),
    getLogisticsShipmentsForAccountUser(user.id, email),
    getProfile(user.id),
  ]);
  const region = resolveAccountRegionalContext({
    country: profile?.country as string | null | undefined,
    currency: profile?.currency as string | null | undefined,
    timezone: profile?.timezone as string | null | undefined,
    language: profile?.language as string | null | undefined,
  });

  const logisticsOrigin = getDivisionUrl("logistics");

  return (
    <div className="space-y-8 acct-fade-in">
      {shipments.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--acct-ink)]">Your shipments</h2>
          <p className="text-xs text-[var(--acct-muted)]">
            Bookings tied to your account email appear here. Tracking still requires your phone on the logistics site
            for security. Links open with your code prefilled.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {shipments.map((row: AccountLogisticsShipmentRow) => (
              <li key={row.id}>
                <a
                  href={logisticsTrackUrl(row.tracking_code)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="acct-card flex flex-col gap-1 p-4 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-semibold text-[var(--acct-ink)]">{row.tracking_code}</span>
                    <span className="rounded-full bg-[var(--acct-surface-2)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--acct-muted)]">
                      {row.lifecycle_status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--acct-muted)]">
                    {row.zone_label || "Lane"} · {row.service_type.replaceAll("_", " ")} · {row.urgency}
                  </div>
                  <div className="text-xs font-medium text-[var(--acct-ink)]">
                    Indicative{" "}
                    {formatCurrencyAmount(Number(row.amount_quoted) || 0, row.currency || "NGN", {
                      unit: "naira",
                      locale: region.locale,
                    })}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <DivisionModulePage
        divisionKey="logistics"
        icon={Truck}
        description="Deliveries and shipments with milestone tracking and proof-of-delivery discipline. Book on the logistics site while signed in so requests mirror here automatically."
        externalUrl={logisticsOrigin}
        activity={activity}
        notifications={notifications}
        supportThreads={supportThreads}
        invoices={invoices}
        viewerRegion={{
          countryCode: region.countryCode,
          locale: region.locale,
          displayCurrency: region.displayCurrency,
        }}
        features={[
          { label: "Book delivery", description: "Pickup & drop-off request", href: `${logisticsOrigin}/book` },
          { label: "Track", description: "Status, map context, timeline", href: `${logisticsOrigin}/track` },
          { label: "Quote", description: "Indicative pricing first", href: `${logisticsOrigin}/quote` },
          { label: "Receipts", description: "Invoices & division activity", href: "/invoices" },
          { label: "Addresses", description: "Saved addresses", href: "/addresses" },
          { label: "Support", description: "Logistics-tagged threads", href: "/support" },
        ]}
      />

      <p className="text-center text-xs text-[var(--acct-muted)]">
        Prefer staying in account?{" "}
        <Link href="/support" className="font-medium text-[var(--acct-gold)] underline-offset-2 hover:underline">
          Open support
        </Link>
        .
      </p>
    </div>
  );
}

