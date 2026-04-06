import "server-only";

export const LEGACY_PAYOUT_METHOD_TYPE = "bank_account";
export const LEGACY_PAYOUT_PROVIDER = "manual_payout";
export const LEGACY_WITHDRAWAL_PIN_TYPE = "wallet";
export const LEGACY_WITHDRAWAL_PIN_PROVIDER = "internal_pin";
export const LEGACY_WITHDRAWAL_REQUEST_REFERENCE_TYPE = "wallet_withdrawal_request";
export const LEGACY_WITHDRAWAL_PIN_SCOPE = "wallet_withdrawal_pin";
export const LEGACY_WALLET_TRANSACTION_PENDING_STATUS = "pending";

type PostgrestLikeError = {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
};

function getErrorText(error: PostgrestLikeError | null | undefined) {
  return [
    typeof error?.message === "string" ? error.message : "",
    typeof error?.details === "string" ? error.details : "",
    typeof error?.hint === "string" ? error.hint : "",
  ]
    .join(" ")
    .trim()
    .toLowerCase();
}

export function isMissingPostgrestResourceError(error: PostgrestLikeError | null | undefined) {
  const code = String(error?.code || "").trim().toUpperCase();
  const text = getErrorText(error);

  if (code === "PGRST202" || code === "PGRST205" || code === "42703") {
    return true;
  }

  return (
    text.includes("schema cache") ||
    text.includes("could not find the table") ||
    text.includes("could not find the function") ||
    text.includes("column") && text.includes("does not exist") ||
    text.includes("relation") && text.includes("does not exist")
  );
}

function asText(value: unknown, fallback = "") {
  const text = typeof value === "string" ? value.trim() : "";
  return text || fallback;
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

export function isLegacyPayoutMethodRow(row: Record<string, unknown>) {
  const metadata = asObject(row.metadata);
  return (
    asText(row.provider) === LEGACY_PAYOUT_PROVIDER ||
    Boolean(metadata.is_payout_method)
  );
}

export function isLegacyWithdrawalPinRow(row: Record<string, unknown>) {
  const metadata = asObject(row.metadata);
  return (
    asText(row.provider) === LEGACY_WITHDRAWAL_PIN_PROVIDER ||
    (asText(row.type) === LEGACY_WITHDRAWAL_PIN_TYPE &&
      asText(metadata.scope) === LEGACY_WITHDRAWAL_PIN_SCOPE)
  );
}

export function mapLegacyPayoutMethod(row: Record<string, unknown>) {
  const metadata = asObject(row.metadata);
  return {
    id: asText(row.id),
    bank_name: asNullableText(row.bank_name) || asNullableText(metadata.bank_name),
    account_name: asNullableText(metadata.account_name) || asNullableText(row.label),
    account_number: asNullableText(metadata.account_number),
    is_default: Boolean(row.is_default),
    currency: asNullableText(metadata.currency) || "NGN",
  };
}

export function buildLegacyPayoutMethodInsert(input: {
  userId: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  isDefault: boolean;
}) {
  return {
    user_id: input.userId,
    type: LEGACY_PAYOUT_METHOD_TYPE,
    label: input.accountName,
    last_four: input.accountNumber.slice(-4),
    bank_name: input.bankName,
    is_default: input.isDefault,
    provider: LEGACY_PAYOUT_PROVIDER,
    provider_token: input.accountNumber,
    metadata: {
      is_payout_method: true,
      account_name: input.accountName,
      account_number: input.accountNumber,
      bank_name: input.bankName,
      currency: "NGN",
    },
  };
}

export function extractLegacyWithdrawalPinHash(rows: Array<Record<string, unknown>>) {
  const row = rows.find((item) => isLegacyWithdrawalPinRow(item));
  return asNullableText(row?.provider_token);
}

export function buildLegacyWithdrawalPinUpsert(input: {
  userId: string;
  hash: string;
  existingId?: string | null;
}) {
  return {
    id: input.existingId || undefined,
    user_id: input.userId,
    type: LEGACY_WITHDRAWAL_PIN_TYPE,
    label: "Wallet withdrawal PIN",
    provider: LEGACY_WITHDRAWAL_PIN_PROVIDER,
    provider_token: input.hash,
    metadata: {
      scope: LEGACY_WITHDRAWAL_PIN_SCOPE,
    },
    is_default: false,
  };
}

export function isPendingWithdrawalStatus(status: string | null | undefined) {
  const normalized = asText(status).toLowerCase();
  return Boolean(
    normalized &&
      !["completed", "verified", "processed", "paid", "rejected", "cancelled", "failed"].includes(
        normalized
      )
  );
}

export function mapLegacyWithdrawalRequest(row: Record<string, unknown>) {
  const metadata = asObject(row.metadata);
  const rawStatus = asText(row.status, LEGACY_WALLET_TRANSACTION_PENDING_STATUS);
  return {
    id: asText(row.id),
    amount_kobo: Number(row.amount_kobo) || 0,
    status:
      rawStatus === LEGACY_WALLET_TRANSACTION_PENDING_STATUS ? "pending_review" : rawStatus,
    created_at: asText(row.created_at),
    payout_method_id: asNullableText(metadata.payout_method_id),
    payout_method_label: asNullableText(metadata.payout_method_label),
  };
}

export function buildLegacyWithdrawalRequestInsert(input: {
  walletId: string;
  userId: string;
  amountKobo: number;
  balanceAfterKobo: number;
  payoutMethodId: string;
  payoutMethodLabel: string | null;
  payoutBankName: string | null;
  payoutLastFour: string | null;
}) {
  return {
    wallet_id: input.walletId,
    user_id: input.userId,
    type: "debit",
    amount_kobo: input.amountKobo,
    balance_after_kobo: input.balanceAfterKobo,
    description: `Wallet withdrawal request — NGN ${(input.amountKobo / 100).toLocaleString("en-NG")}`,
    status: LEGACY_WALLET_TRANSACTION_PENDING_STATUS,
    reference_type: LEGACY_WITHDRAWAL_REQUEST_REFERENCE_TYPE,
    reference_id: input.payoutMethodId,
    metadata: {
      requested_from: "account_wallet",
      payout_method_id: input.payoutMethodId,
      payout_method_label: input.payoutMethodLabel,
      payout_bank_name: input.payoutBankName,
      payout_last_four: input.payoutLastFour,
    },
  };
}
