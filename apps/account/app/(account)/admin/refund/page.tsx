import { notFound } from "next/navigation";

import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import { getAccountAppLocale } from "@/lib/locale-server";
import { formatNaira } from "@/lib/format";
import RefundButton from "@/components/admin/RefundButton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IntentRow = {
  id: string;
  amount_minor: number;
  currency: string;
  status: string;
  division: string | null;
  method: string;
  metadata: unknown;
  created_at: string;
};

function asMetadataString(metadata: unknown, key: string): string | null {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    const value = (metadata as Record<string, unknown>)[key];
    if (typeof value === "string" && value.trim() !== "") return value.trim();
  }
  return null;
}

/**
 * Owner-internal REFUND console (V3-19 ops surface).
 *
 * MONEY-SENSITIVE. This page is a thin read-only listing; the actual refund is
 * fired by <RefundButton/> calling the proven money-truth route. Two gates keep
 * it owner-only:
 *   1. `is_platform_staff()` evaluated under the CALLER's JWT (the same SQL truth
 *      the refund route enforces) — a customer who guesses the URL gets a 404.
 *   2. The route itself re-checks staff AND requires recent reauth, so even if
 *      this surface were reached, no refund can fire without authorization.
 *
 * The provider is NEVER named on this surface (brand rule).
 */
export default async function AdminRefundPage() {
  // Gate: mirror the refund route's staff check so the surface is hidden from
  // customers (404, not a redirect — don't reveal the surface exists).
  const supabase = await createSupabaseServer();
  const staff = await supabase.rpc("is_platform_staff");
  if (staff.error || staff.data !== true) notFound();

  const locale = await getAccountAppLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  // Recent REFUNDABLE intents (succeeded) via the service-role client — this is
  // an ops listing across all customers, not the caller's own rows.
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("payment_intents")
    .select("id, amount_minor, currency, status, division, method, metadata, created_at")
    .eq("status", "succeeded")
    .order("created_at", { ascending: false })
    .limit(25);

  const rows: IntentRow[] = error || !data ? [] : (data as IntentRow[]);

  const dateFmt = new Intl.DateTimeFormat(locale === "en" ? "en-NG" : locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="acct-fade-in space-y-6">
      <header className="space-y-1">
        <p className="acct-kicker">{t("Owner · Refunds")}</p>
        <h1 className="text-2xl font-semibold text-[var(--acct-ink)]">{t("Refund a payment")}</h1>
        <p className="max-w-2xl text-sm leading-6 text-[var(--acct-muted)]">
          {t(
            "Recent succeeded payments that can still be refunded. A refund is real money leaving the business — confirm before you submit. You'll be asked to confirm your identity.",
          )}
        </p>
      </header>

      <section className="acct-card overflow-hidden p-0">
        {rows.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <h2 className="text-sm font-semibold text-[var(--acct-ink)]">
              {t("No refundable payments right now")}
            </h2>
            <p className="mt-1 text-sm text-[var(--acct-muted)]">
              {t("Succeeded payments will appear here as they come in.")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--acct-line)] text-xs uppercase tracking-wide text-[var(--acct-muted)]">
                  <th scope="col" className="px-4 py-3 font-semibold">{t("Amount")}</th>
                  <th scope="col" className="px-4 py-3 font-semibold">{t("Division")}</th>
                  <th scope="col" className="px-4 py-3 font-semibold">{t("Method")}</th>
                  <th scope="col" className="px-4 py-3 font-semibold">{t("Reference")}</th>
                  <th scope="col" className="px-4 py-3 font-semibold">{t("Date")}</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">{t("Action")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const reference =
                    asMetadataString(row.metadata, "reference") ||
                    asMetadataString(row.metadata, "order_no") ||
                    asMetadataString(row.metadata, "orderNo");
                  const amountLabel =
                    row.currency === "NGN"
                      ? formatNaira(row.amount_minor, locale === "en" ? "en-NG" : locale)
                      : `${row.currency} ${(row.amount_minor / 100).toLocaleString(
                          locale === "en" ? "en-US" : locale,
                        )}`;
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-[var(--acct-line)] last:border-b-0 align-middle"
                    >
                      <td className="px-4 py-3 font-semibold text-[var(--acct-ink)]">{amountLabel}</td>
                      <td className="px-4 py-3 text-[var(--acct-muted)]">
                        {row.division ? row.division : t("—")}
                      </td>
                      <td className="px-4 py-3 text-[var(--acct-muted)]">{row.method}</td>
                      <td className="px-4 py-3 text-[var(--acct-muted)]">{reference ?? t("—")}</td>
                      <td className="px-4 py-3 text-[var(--acct-muted)]">
                        {dateFmt.format(new Date(row.created_at))}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <RefundButton
                          intentId={row.id}
                          amountMinor={row.amount_minor}
                          currency={row.currency}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
