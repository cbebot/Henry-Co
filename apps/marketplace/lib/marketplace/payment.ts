import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { cache } from "react";
import { createAdminSupabase } from "@/lib/supabase";

export type MarketplacePaymentRail = {
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  currency: string;
  instructions: string;
  supportEmail: string | null;
  supportWhatsApp: string | null;
  ready: boolean;
  source: "marketplace_settings" | "shared_settings" | "unconfigured";
};

export type MarketplaceWalletSnapshot = {
  walletId: string | null;
  balanceKobo: number;
  pendingWithdrawalKobo: number;
  availableKobo: number;
  currency: string;
  isActive: boolean;
  issue: string | null;
};

const PAYMENT_PROOF_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNullableText(value: unknown) {
  const text = asText(value);
  return text || null;
}

function asObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function pickFirstText(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = asNullableText(record[key]);
    if (value) return value;
  }
  return null;
}

function readPaymentRailRecord(value: unknown) {
  const record = asObject(value);
  return {
    bankName: pickFirstText(record, [
      "bankName",
      "bank_name",
      "paymentBankName",
      "payment_bank_name",
      "company_bank_name",
    ]),
    accountName: pickFirstText(record, [
      "accountName",
      "account_name",
      "paymentAccountName",
      "payment_account_name",
      "company_account_name",
    ]),
    accountNumber: pickFirstText(record, [
      "accountNumber",
      "account_number",
      "paymentAccountNumber",
      "payment_account_number",
      "company_account_number",
    ]),
    currency:
      pickFirstText(record, ["currency", "paymentCurrency", "payment_currency", "company_currency"]) ??
      null,
    instructions:
      pickFirstText(record, ["instructions", "paymentInstructions", "payment_instructions"]) ??
      null,
    supportEmail:
      pickFirstText(record, ["supportEmail", "support_email", "payment_support_email"]) ?? null,
    supportWhatsApp:
      pickFirstText(record, [
        "supportWhatsApp",
        "support_whatsapp",
        "payment_support_whatsapp",
        "payment_whatsapp",
        "support_phone",
      ]) ?? null,
  };
}

function isPendingWithdrawalStatus(status: unknown) {
  const normalized = asText(status).toLowerCase();
  return Boolean(
    normalized &&
      !["completed", "verified", "processed", "paid", "rejected", "cancelled", "failed"].includes(
        normalized
      )
  );
}

function requireCloudinaryEnv() {
  const cloudName = asText(process.env.CLOUDINARY_CLOUD_NAME);
  const apiKey = asText(process.env.CLOUDINARY_API_KEY);
  const apiSecret = asText(process.env.CLOUDINARY_API_SECRET);
  const baseFolder = asText(process.env.CLOUDINARY_FOLDER) || "henryco/marketplace";

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured for marketplace payment proofs.");
  }

  return { cloudName, apiKey, apiSecret, baseFolder };
}

export function makeMarketplacePaymentReference() {
  const now = new Date();
  const date = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(
    now.getUTCDate()
  ).padStart(2, "0")}`;
  return `MKT-PMT-${date}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export const getMarketplacePaymentRail = cache(async (): Promise<MarketplacePaymentRail> => {
  const fallbackInstructions =
    "Transfer the exact checkout total with the displayed payment reference, then upload proof so HenryCo finance can verify the order.";

  try {
    const admin = createAdminSupabase();
    const { data: marketplaceRows } = await admin
      .from("marketplace_settings")
      .select("key, value")
      .in("key", ["payment_rail", "payments", "checkout_payment", "bank_transfer"]);

    const marketplaceRail = (marketplaceRows ?? [])
      .map((row: Record<string, unknown>) => readPaymentRailRecord(row.value))
      .find((rail) => rail.bankName || rail.accountName || rail.accountNumber);

    if (marketplaceRail?.bankName && marketplaceRail.accountName && marketplaceRail.accountNumber) {
      return {
        bankName: marketplaceRail.bankName,
        accountName: marketplaceRail.accountName,
        accountNumber: marketplaceRail.accountNumber,
        currency: marketplaceRail.currency || "NGN",
        instructions: marketplaceRail.instructions || fallbackInstructions,
        supportEmail: marketplaceRail.supportEmail,
        supportWhatsApp: marketplaceRail.supportWhatsApp,
        ready: true,
        source: "marketplace_settings",
      };
    }

    const { data: sharedRow } = await admin.from("care_settings").select("*").limit(1).maybeSingle();
    const sharedRail = readPaymentRailRecord(sharedRow);
    const ready = Boolean(sharedRail.bankName && sharedRail.accountName && sharedRail.accountNumber);

    return {
      bankName: sharedRail.bankName,
      accountName: sharedRail.accountName,
      accountNumber: sharedRail.accountNumber,
      currency: sharedRail.currency || "NGN",
      instructions: sharedRail.instructions || fallbackInstructions,
      supportEmail: sharedRail.supportEmail,
      supportWhatsApp: sharedRail.supportWhatsApp,
      ready,
      source: ready ? "shared_settings" : "unconfigured",
    };
  } catch {
    return {
      bankName: null,
      accountName: null,
      accountNumber: null,
      currency: "NGN",
      instructions: fallbackInstructions,
      supportEmail: null,
      supportWhatsApp: null,
      ready: false,
      source: "unconfigured",
    };
  }
});

export async function getMarketplaceWalletSnapshot(userId: string): Promise<MarketplaceWalletSnapshot> {
  try {
    const admin = createAdminSupabase();
    const { data: wallet, error: walletError } = await admin
      .from("customer_wallets")
      .select("id, balance_kobo, currency, is_active")
      .eq("user_id", userId)
      .maybeSingle();

    if (walletError) {
      return {
        walletId: null,
        balanceKobo: 0,
        pendingWithdrawalKobo: 0,
        availableKobo: 0,
        currency: "NGN",
        isActive: false,
        issue: "Wallet balance is unavailable right now.",
      };
    }

    const walletId = asNullableText(wallet?.id);
    const balanceKobo = Math.max(0, Number(wallet?.balance_kobo || 0));
    const currency = asText(wallet?.currency) || "NGN";
    const isActive = wallet?.is_active !== false;

    const { data: withdrawals, error: withdrawalError } = await admin
      .from("customer_wallet_withdrawal_requests")
      .select("amount_kobo, status")
      .eq("user_id", userId);

    const pendingWithdrawalKobo = withdrawalError
      ? 0
      : (withdrawals ?? []).reduce((sum: number, row: Record<string, unknown>) => {
          return isPendingWithdrawalStatus(row.status) ? sum + Math.max(0, Number(row.amount_kobo || 0)) : sum;
        }, 0);

    return {
      walletId,
      balanceKobo,
      pendingWithdrawalKobo,
      availableKobo: Math.max(0, balanceKobo - pendingWithdrawalKobo),
      currency,
      isActive,
      issue: walletId ? null : "Wallet is not ready yet.",
    };
  } catch {
    return {
      walletId: null,
      balanceKobo: 0,
      pendingWithdrawalKobo: 0,
      availableKobo: 0,
      currency: "NGN",
      isActive: false,
      issue: "Wallet balance is unavailable right now.",
    };
  }
}

export async function uploadMarketplacePaymentProof(
  file: File,
  userId: string,
  orderNo: string
): Promise<{ secureUrl: string; publicId: string }> {
  if (!(file instanceof File) || file.size <= 0) {
    throw new Error("Upload a payment proof file before submitting checkout.");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Please upload payment proof under 10 MB.");
  }

  if (!PAYMENT_PROOF_TYPES.has(file.type.toLowerCase())) {
    throw new Error("Please upload a PNG, JPG, WebP, or PDF payment proof.");
  }

  const { cloudName, apiKey, apiSecret, baseFolder } = requireCloudinaryEnv();
  const safeOrderNo = orderNo.replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
  const folder = `${baseFolder}/payment-proofs/${safeOrderNo}`;
  const publicId = `proof-${userId.slice(0, 8)}-${randomUUID().slice(0, 8)}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = createHash("sha1").update(payload).digest("hex");

  const form = new FormData();
  form.set("file", file, file.name);
  form.set("api_key", apiKey);
  form.set("timestamp", String(timestamp));
  form.set("signature", signature);
  form.set("folder", folder);
  form.set("public_id", publicId);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: "POST",
    body: form,
  });
  const data = (await response.json().catch(() => null)) as {
    secure_url?: string;
    public_id?: string;
    error?: { message?: string };
  } | null;

  if (!response.ok || !data?.secure_url || !data.public_id) {
    throw new Error(data?.error?.message || "Payment proof upload failed.");
  }

  return { secureUrl: data.secure_url, publicId: data.public_id };
}
