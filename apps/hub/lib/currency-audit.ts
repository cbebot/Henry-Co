import "server-only";

import {
  buildInvoiceLineItemsPayload,
  extractCurrencyContext,
  withCurrencyContext,
} from "@henryco/i18n";
import { createAdminSupabase } from "@/lib/supabase";

type JsonRecord = Record<string, unknown>;

type AuditTableSummary = {
  table: string;
  scanned: number;
  patched: number;
  missing: boolean;
};

export type CurrencyAuditSummary = {
  executedAt: string;
  tables: AuditTableSummary[];
  patchedRows: number;
};

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asObject(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function hasCurrencyContext(value: unknown) {
  return Object.keys(extractCurrencyContext(value)).length > 0;
}

function missingTable(error: { message?: string | null } | null | undefined) {
  const message = asText(error?.message).toLowerCase();
  return (
    message.includes("could not find the table") ||
    message.includes("schema cache") ||
    (message.includes("relation") && message.includes("does not exist"))
  );
}

function normalizeInvoiceItems(lineItems: unknown) {
  if (Array.isArray(lineItems)) {
    return lineItems as Array<Record<string, unknown>>;
  }

  const record = asObject(lineItems);
  if (Array.isArray(record.items)) {
    return record.items as Array<Record<string, unknown>>;
  }

  return [];
}

function inferMetadataCurrency(value: unknown) {
  const metadata = asObject(value);
  return (
    asText(metadata.currency) ||
    asText(metadata.payment_currency) ||
    asText(metadata.pricing_currency) ||
    asText(metadata.salaryCurrency) ||
    asText(metadata.salary_currency) ||
    "NGN"
  );
}

function shouldPatchActivityMetadata(metadata: JsonRecord, amountKobo: number) {
  return (
    amountKobo > 0 ||
    Number(metadata.balance_due) > 0 ||
    Number(metadata.amount_due) > 0 ||
    Number(metadata.grandTotal) > 0 ||
    Number(metadata.subtotal) > 0 ||
    Number(metadata.salaryMin) > 0 ||
    Number(metadata.salaryMax) > 0 ||
    Boolean(asText(metadata.salaryExpectation))
  );
}

async function selectRows(
  table: string,
  select: string,
  limit: number
): Promise<{ data: JsonRecord[]; missing: boolean }> {
  const admin = createAdminSupabase();
  const { data, error } = await admin.from(table).select(select).limit(limit);
  if (error) {
    if (missingTable(error)) {
      return { data: [], missing: true };
    }
    throw error;
  }

  return {
    data: Array.isArray(data) ? data.map((row) => asObject(row)).filter((row) => Object.keys(row).length > 0) : [],
    missing: false,
  };
}

async function patchRows(
  table: string,
  limit: number,
  handler: (rows: JsonRecord[]) => Promise<number>
): Promise<AuditTableSummary> {
  const selectMap: Record<string, string> = {
    customer_wallet_transactions:
      "id, user_id, amount_kobo, reference_type, metadata",
    customer_wallet_funding_requests: "id, currency, metadata",
    customer_wallet_withdrawal_requests: "id, currency, metadata",
    customer_invoices: "id, currency, line_items",
    customer_subscriptions: "id, currency, metadata",
    customer_activity:
      "id, division, amount_kobo, reference_type, reference_id, metadata",
    care_payment_requests: "id, currency, amount_due, payload",
    customer_referral_rewards: "id, currency, amount_kobo, metadata",
    marketplace_events: "id, event_type, payload",
  };

  const { data, missing } = await selectRows(table, selectMap[table], limit);
  if (missing) {
    return { table, scanned: 0, patched: 0, missing: true };
  }

  return {
    table,
    scanned: data.length,
    patched: await handler(data),
    missing: false,
  };
}

export async function runCurrencyContextAudit(limitPerTable = 250): Promise<CurrencyAuditSummary> {
  const admin = createAdminSupabase();
  const { data: wallets } = await admin
    .from("customer_wallets")
    .select("user_id, currency");
  const walletCurrencyByUser = new Map(
    ((wallets ?? []) as Array<{ user_id?: string; currency?: string | null }>).map((wallet) => [
      String(wallet.user_id || ""),
      asText(wallet.currency) || "NGN",
    ])
  );

  const tables = await Promise.all([
    patchRows("customer_wallet_transactions", limitPerTable, async (rows) => {
      let patched = 0;

      for (const row of rows) {
        if (hasCurrencyContext(row.metadata)) continue;
        const pricingCurrency =
          inferMetadataCurrency(row.metadata) ||
          walletCurrencyByUser.get(String(row.user_id || "")) ||
          "NGN";
        const metadata = withCurrencyContext(row.metadata, {
          pricingCurrency,
          settlementCurrency: walletCurrencyByUser.get(String(row.user_id || "")) || "NGN",
          baseCurrency: walletCurrencyByUser.get(String(row.user_id || "")) || "NGN",
          originalCurrency: pricingCurrency,
        });
        const { error } = await admin
          .from("customer_wallet_transactions")
          .update({ metadata } as never)
          .eq("id", row.id);
        if (!error) patched += 1;
      }

      return patched;
    }),
    patchRows("customer_wallet_funding_requests", limitPerTable, async (rows) => {
      let patched = 0;

      for (const row of rows) {
        if (hasCurrencyContext(row.metadata)) continue;
        const currency = asText(row.currency) || "NGN";
        const metadata = withCurrencyContext(row.metadata, {
          pricingCurrency: currency,
          settlementCurrency: currency,
          baseCurrency: currency,
          originalCurrency: currency,
        });
        const { error } = await admin
          .from("customer_wallet_funding_requests")
          .update({ metadata } as never)
          .eq("id", row.id);
        if (!error) patched += 1;
      }

      return patched;
    }),
    patchRows("customer_wallet_withdrawal_requests", limitPerTable, async (rows) => {
      let patched = 0;

      for (const row of rows) {
        if (hasCurrencyContext(row.metadata)) continue;
        const currency = asText(row.currency) || "NGN";
        const metadata = withCurrencyContext(row.metadata, {
          pricingCurrency: currency,
          settlementCurrency: currency,
          baseCurrency: currency,
          originalCurrency: currency,
        });
        const { error } = await admin
          .from("customer_wallet_withdrawal_requests")
          .update({ metadata } as never)
          .eq("id", row.id);
        if (!error) patched += 1;
      }

      return patched;
    }),
    patchRows("customer_invoices", limitPerTable, async (rows) => {
      let patched = 0;

      for (const row of rows) {
        if (hasCurrencyContext(row.line_items)) continue;
        const currency = asText(row.currency) || "NGN";
        const lineItems = buildInvoiceLineItemsPayload(normalizeInvoiceItems(row.line_items), {
          pricingCurrency: currency,
          settlementCurrency: "NGN",
          baseCurrency: "NGN",
          originalCurrency: currency,
        });
        const { error } = await admin
          .from("customer_invoices")
          .update({ line_items: lineItems } as never)
          .eq("id", row.id);
        if (!error) patched += 1;
      }

      return patched;
    }),
    patchRows("customer_subscriptions", limitPerTable, async (rows) => {
      let patched = 0;

      for (const row of rows) {
        if (hasCurrencyContext(row.metadata)) continue;
        const currency = asText(row.currency) || "NGN";
        const metadata = withCurrencyContext(row.metadata, {
          pricingCurrency: currency,
          settlementCurrency: "NGN",
          baseCurrency: "NGN",
          originalCurrency: currency,
        });
        const { error } = await admin
          .from("customer_subscriptions")
          .update({ metadata } as never)
          .eq("id", row.id);
        if (!error) patched += 1;
      }

      return patched;
    }),
    patchRows("customer_activity", limitPerTable, async (rows) => {
      let patched = 0;

      for (const row of rows) {
        const metadata = asObject(row.metadata);
        const amountKobo = Number(row.amount_kobo) || 0;
        if (hasCurrencyContext(metadata) || !shouldPatchActivityMetadata(metadata, amountKobo)) {
          continue;
        }

        const pricingCurrency = inferMetadataCurrency(metadata);
        const nextMetadata = withCurrencyContext(metadata, {
          pricingCurrency,
          settlementCurrency: "NGN",
          baseCurrency: "NGN",
          originalCurrency: pricingCurrency,
        });
        const { error } = await admin
          .from("customer_activity")
          .update({ metadata: nextMetadata } as never)
          .eq("id", row.id);
        if (!error) patched += 1;
      }

      return patched;
    }),
    patchRows("care_payment_requests", limitPerTable, async (rows) => {
      let patched = 0;

      for (const row of rows) {
        if (hasCurrencyContext(row.payload)) continue;
        const currency = asText(row.currency) || "NGN";
        const payload = withCurrencyContext(row.payload, {
          pricingCurrency: currency,
          settlementCurrency: currency,
          baseCurrency: currency,
          originalCurrency: currency,
        });
        const { error } = await admin
          .from("care_payment_requests")
          .update({ payload } as never)
          .eq("id", row.id);
        if (!error) patched += 1;
      }

      return patched;
    }),
    patchRows("customer_referral_rewards", limitPerTable, async (rows) => {
      let patched = 0;

      for (const row of rows) {
        if (hasCurrencyContext(row.metadata)) continue;
        const currency = asText(row.currency) || "NGN";
        const metadata = withCurrencyContext(row.metadata, {
          pricingCurrency: currency,
          settlementCurrency: currency,
          baseCurrency: currency,
          originalCurrency: currency,
        });
        const { error } = await admin
          .from("customer_referral_rewards")
          .update({ metadata } as never)
          .eq("id", row.id);
        if (!error) patched += 1;
      }

      return patched;
    }),
    patchRows("marketplace_events", limitPerTable, async (rows) => {
      let patched = 0;

      for (const row of rows) {
        const payload = asObject(row.payload);
        if (
          hasCurrencyContext(payload) ||
          !(
            Number(payload.subtotal) > 0 ||
            Number(payload.grandTotal) > 0 ||
            Number(payload.shippingTotal) > 0 ||
            Number(payload.amount) > 0
          )
        ) {
          continue;
        }

        const pricingCurrency = inferMetadataCurrency(payload);
        const nextPayload = withCurrencyContext(payload, {
          pricingCurrency,
          settlementCurrency: "NGN",
          baseCurrency: "NGN",
          originalCurrency: pricingCurrency,
        });
        const { error } = await admin
          .from("marketplace_events")
          .update({ payload: nextPayload } as never)
          .eq("id", row.id);
        if (!error) patched += 1;
      }

      return patched;
    }),
  ]);

  return {
    executedAt: new Date().toISOString(),
    tables,
    patchedRows: tables.reduce((sum, table) => sum + table.patched, 0),
  };
}
