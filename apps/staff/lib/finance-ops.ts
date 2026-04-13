import "server-only";

import { getDivisionUrl, getHqUrl } from "@henryco/config";
import {
  extractCurrencyContext,
  formatMoney,
  getCountry,
  resolveCurrencyTruth,
} from "@henryco/i18n";
import { createStaffAdminSupabase } from "@/lib/supabase/admin";

type ProfileRow = {
  id: string;
  email: string | null;
  country: string | null;
  currency: string | null;
  timezone: string | null;
};

type WalletRow = {
  user_id: string;
  balance_kobo: number | null;
  currency: string | null;
};

type WalletTransactionRow = {
  id: string;
  user_id: string;
  amount_kobo: number | null;
  status: string | null;
  reference_type: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
};

type InvoiceRow = {
  id: string;
  invoice_no: string | null;
  division: string | null;
  status: string | null;
  total_kobo: number | null;
  currency: string | null;
  line_items: unknown;
  created_at: string | null;
};

type SubscriptionRow = {
  id: string;
  division: string | null;
  plan_name: string | null;
  status: string | null;
  amount_kobo: number | null;
  currency: string | null;
  metadata: unknown;
  updated_at: string | null;
};

export type FinanceMetric = {
  label: string;
  value: string;
  hint: string;
};

export type FinanceListItem = {
  id: string;
  title: string;
  detail: string;
  tone: "info" | "success" | "warning" | "critical";
  href: string;
  actionLabel: string;
  meta?: string | null;
};

export type FinanceCoverageRow = {
  currency: string;
  count: number;
  detail: string;
};

export type FinanceSurfaceLink = {
  href: string;
  label: string;
  description: string;
};

export type FinanceWorkspaceSnapshot = {
  summary: string;
  metrics: FinanceMetric[];
  coverage: FinanceCoverageRow[];
  settlementAlerts: FinanceListItem[];
  pendingQueue: FinanceListItem[];
  ledgerAlerts: FinanceListItem[];
  links: FinanceSurfaceLink[];
};

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  const normalized = typeof value === "number" ? value : Number(value);
  return Number.isFinite(normalized) ? normalized : 0;
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function maskEmail(value: string | null | undefined) {
  const email = asText(value).toLowerCase();
  if (!email.includes("@")) return "unpublished identity";

  const [local, domain] = email.split("@");
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(1, local.length - visible.length))}@${domain}`;
}

function formatMinor(amountKobo: number, currency = "NGN") {
  return formatMoney(amountKobo, currency);
}

function financeHrefForDivision(division: string | null | undefined) {
  const normalized = asText(division).toLowerCase();
  if (normalized === "care") return `${getDivisionUrl("care")}/owner/finance`;
  if (normalized === "marketplace") return `${getDivisionUrl("marketplace")}/finance`;
  if (normalized === "studio") return `${getDivisionUrl("studio")}/finance/invoices`;
  return getHqUrl("/owner/finance/invoices");
}

function pendingWalletStatus(status: string | null | undefined) {
  const normalized = asText(status).toLowerCase();
  return Boolean(
    normalized &&
      !["completed", "verified", "processed", "paid", "rejected", "cancelled", "failed"].includes(
        normalized
      )
  );
}

function hasCurrencyContext(value: unknown) {
  return Object.keys(extractCurrencyContext(value)).length > 0;
}

function buildCoverage(
  profiles: ProfileRow[]
) {
  const counts = new Map<string, number>();

  for (const profile of profiles) {
    const truth = resolveCurrencyTruth({
      country: profile.country,
      preferredCurrency: profile.currency,
      detectedCurrency: profile.currency,
    });
    counts.set(truth.displayCurrency, (counts.get(truth.displayCurrency) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([currency, count]) => ({
      currency,
      count,
      detail:
        currency === "NGN"
          ? "Profiles already aligned with the live settlement rail."
          : `Display preference is active, but finance should still treat settlement as NGN-first.`,
    }))
    .sort((left, right) => right.count - left.count || left.currency.localeCompare(right.currency));
}

export async function getFinanceWorkspaceSnapshot(): Promise<FinanceWorkspaceSnapshot> {
  const admin = createStaffAdminSupabase();
  const [profilesRes, walletsRes, transactionsRes, invoicesRes, subscriptionsRes] = await Promise.all([
    admin
      .from("customer_profiles")
      .select("id, email, country, currency, timezone")
      .order("updated_at", { ascending: false })
      .limit(400),
    admin
      .from("customer_wallets")
      .select("user_id, balance_kobo, currency")
      .order("updated_at", { ascending: false })
      .limit(400),
    admin
      .from("customer_wallet_transactions")
      .select("id, user_id, amount_kobo, status, reference_type, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(240),
    admin
      .from("customer_invoices")
      .select("id, invoice_no, division, status, total_kobo, currency, line_items, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    admin
      .from("customer_subscriptions")
      .select("id, division, plan_name, status, amount_kobo, currency, metadata, updated_at")
      .order("updated_at", { ascending: false })
      .limit(200),
  ]);

  const profiles = (profilesRes.data ?? []) as ProfileRow[];
  const wallets = (walletsRes.data ?? []) as WalletRow[];
  const transactions = (transactionsRes.data ?? []) as WalletTransactionRow[];
  const invoices = (invoicesRes.data ?? []) as InvoiceRow[];
  const subscriptions = (subscriptionsRes.data ?? []) as SubscriptionRow[];

  const walletByUser = new Map(wallets.map((wallet) => [wallet.user_id, wallet]));
  const profileByUser = new Map(profiles.map((profile) => [profile.id, profile]));

  const coverage = buildCoverage(profiles);
  const settlementAlerts: FinanceListItem[] = [];
  const pendingQueue: FinanceListItem[] = [];
  const ledgerAlerts: FinanceListItem[] = [];

  for (const profile of profiles) {
    const truth = resolveCurrencyTruth({
      country: profile.country,
      preferredCurrency: profile.currency,
      detectedCurrency: profile.currency,
    });
    const expectedCountryCurrency =
      getCountry(asText(profile.country).toUpperCase())?.currencyCode || truth.displayCurrency;
    const wallet = walletByUser.get(profile.id);

    if (
      expectedCountryCurrency !== truth.displayCurrency ||
      (wallet?.currency && asText(wallet.currency).toUpperCase() !== truth.settlementCurrency)
    ) {
      settlementAlerts.push({
        id: `profile-${profile.id}`,
        title: `${maskEmail(profile.email)} needs currency review`,
        detail:
          expectedCountryCurrency !== truth.displayCurrency
            ? `Country default is ${expectedCountryCurrency}, but profile display is still ${truth.displayCurrency}.`
            : `Wallet settlement is ${asText(wallet?.currency).toUpperCase()}, but HenryCo finance currently treats ${truth.settlementCurrency} as the settlement rail.`,
        tone: "warning",
        href: getHqUrl("/owner/finance"),
        actionLabel: "Review finance policy",
        meta: truth.settlementMessage,
      });
    } else if (!truth.supportsNativeSettlement) {
      settlementAlerts.push({
        id: `display-${profile.id}`,
        title: `${maskEmail(profile.email)} is on ${truth.displayCurrency} display`,
        detail: truth.settlementMessage,
        tone: "info",
        href: getHqUrl("/owner/finance"),
        actionLabel: "Open finance summary",
        meta: wallet?.balance_kobo
          ? `Wallet balance: ${formatMinor(asNumber(wallet.balance_kobo), asText(wallet.currency) || "NGN")}`
          : null,
      });
    }
  }

  for (const row of transactions) {
    if (!pendingWalletStatus(row.status)) continue;

    const profile = profileByUser.get(row.user_id);
    const referenceType = asText(row.reference_type).toLowerCase();
    const metadataContext = extractCurrencyContext(row.metadata);
    const truth = resolveCurrencyTruth({
      ...metadataContext,
      pricingCurrency: metadataContext.pricingCurrency || "NGN",
      settlementCurrency: metadataContext.settlementCurrency || "NGN",
    });

    pendingQueue.push({
      id: row.id,
      title:
        referenceType === "wallet_funding_request"
          ? `${maskEmail(profile?.email)} funding proof pending`
          : `${maskEmail(profile?.email)} withdrawal pending review`,
      detail:
        referenceType === "wallet_funding_request"
          ? "Verify proof before moving funds into available balance."
          : "Confirm payout method, hold state, and approval trail before release.",
      tone: referenceType === "wallet_funding_request" ? "warning" : "critical",
      href: getHqUrl("/owner/finance"),
      actionLabel: "Review in finance",
      meta: `${formatMinor(asNumber(row.amount_kobo), truth.pricingCurrency)} · ${asText(row.status).replaceAll("_", " ")}`,
    });
  }

  for (const invoice of invoices) {
    const hasContext = hasCurrencyContext(invoice.line_items);
    const truth = resolveCurrencyTruth({
      ...extractCurrencyContext(invoice.line_items),
      pricingCurrency: asText(invoice.currency) || "NGN",
      detectedCurrency: asText(invoice.currency) || "NGN",
    });

    if (!hasContext || !truth.supportsNativeSettlement) {
      ledgerAlerts.push({
        id: `invoice-${invoice.id}`,
        title: `${asText(invoice.invoice_no) || "Invoice"} needs currency truth`,
        detail: !hasContext
          ? `Invoice is priced in ${truth.pricingCurrency}, but no currency context was published alongside line items.`
          : truth.settlementMessage,
        tone: !hasContext ? "critical" : "warning",
        href: financeHrefForDivision(invoice.division),
        actionLabel: "Open source finance",
        meta: `${formatMinor(asNumber(invoice.total_kobo), truth.pricingCurrency)} · ${asText(invoice.status) || "pending"}`,
      });
    }
  }

  for (const subscription of subscriptions) {
    const hasContext = hasCurrencyContext(subscription.metadata);
    const truth = resolveCurrencyTruth({
      ...extractCurrencyContext(subscription.metadata),
      pricingCurrency: asText(subscription.currency) || "NGN",
      detectedCurrency: asText(subscription.currency) || "NGN",
    });

    if (!hasContext || !truth.supportsNativeSettlement) {
      ledgerAlerts.push({
        id: `subscription-${subscription.id}`,
        title: `${asText(subscription.plan_name) || "Subscription"} needs currency truth`,
        detail: !hasContext
          ? `Subscription is priced in ${truth.pricingCurrency}, but the shared ledger has no settlement metadata.`
          : truth.settlementMessage,
        tone: !hasContext ? "critical" : "warning",
        href: financeHrefForDivision(subscription.division),
        actionLabel: "Open source workspace",
        meta: `${formatMinor(asNumber(subscription.amount_kobo), truth.pricingCurrency)} · ${asText(subscription.status) || "pending"}`,
      });
    }
  }

  const nonNativeProfiles = profiles.filter((profile) => {
    const truth = resolveCurrencyTruth({
      country: profile.country,
      preferredCurrency: profile.currency,
      detectedCurrency: profile.currency,
    });
    return !truth.supportsNativeSettlement;
  }).length;

  return {
    summary: `Live display currencies are broader than live settlement rails. Finance should treat NGN as the production settlement rail and use the queues below to catch profiles or ledger rows that still blur display, pricing, and settlement truth.`,
    metrics: [
      {
        label: "Display currencies",
        value: formatCount(coverage.length),
        hint: "Unique profile display currencies currently active in the shared account base.",
      },
      {
        label: "Cross-currency profiles",
        value: formatCount(nonNativeProfiles),
        hint: "Profiles whose display currency does not currently map to a native live settlement rail.",
      },
      {
        label: "Pending finance queue",
        value: formatCount(pendingQueue.length),
        hint: "Funding and withdrawal rows still waiting for finance action.",
      },
      {
        label: "Ledger truth gaps",
        value: formatCount(ledgerAlerts.length),
        hint: "Invoices or subscriptions missing explicit settlement context.",
      },
    ],
    coverage,
    settlementAlerts: settlementAlerts.slice(0, 8),
    pendingQueue: pendingQueue.slice(0, 8),
    ledgerAlerts: ledgerAlerts.slice(0, 8),
    links: [
      {
        href: getHqUrl("/owner/finance"),
        label: "Group finance",
        description: "Open the owner finance command surface for shared ledger review.",
      },
      {
        href: getHqUrl("/owner/finance/invoices"),
        label: "Invoice review",
        description: "Inspect invoice publishing quality and finance-facing exceptions.",
      },
      {
        href: `${getDivisionUrl("care")}/owner/finance`,
        label: "Care finance",
        description: "Handle care payment verification and expense-sensitive issues.",
      },
      {
        href: `${getDivisionUrl("marketplace")}/finance`,
        label: "Marketplace finance",
        description: "Review disputes, seller payout pressure, and order-side payment truth.",
      },
      {
        href: `${getDivisionUrl("studio")}/finance/invoices`,
        label: "Studio finance",
        description: "Review Studio invoice and milestone payment publishing at source.",
      },
    ],
  };
}
