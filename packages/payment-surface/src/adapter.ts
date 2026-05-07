import type {
  PaymentPlatformAccount,
  PaymentRecordView,
  PaymentStatus,
  PaymentSurfaceContext,
  PaymentSurfaceRecord,
} from "./types";

/**
 * Adapter helpers — small, pure functions consumers use to project their
 * native payment / order / booking shape into the canonical
 * PaymentSurfaceContext. Kept tiny on purpose: an adapter is a fan-in,
 * not an abstraction layer.
 */

const STATUS_ALIASES: Record<string, PaymentStatus> = {
  // shared / studio
  pending: "pending",
  awaiting_transfer: "pending",
  awaiting_receipt: "pending",
  awaiting_corrected_proof: "pending",
  unpaid: "pending",
  open: "pending",
  requested: "pending",
  overdue: "pending",
  processing: "processing",
  pending_verification: "processing",
  in_review: "processing",
  under_review: "processing",
  receipt_submitted: "processing",
  paid: "paid",
  confirmed: "paid",
  settled: "paid",
  verified: "paid",
  approved: "paid",
  // failure / closed
  failed: "failed",
  rejected: "failed",
  refunded: "refunded",
  cancelled: "cancelled",
  voided: "cancelled",
};

export function coercePaymentStatus(value: string | null | undefined, fallback: PaymentStatus = "pending"): PaymentStatus {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  return STATUS_ALIASES[normalized] ?? fallback;
}

export function buildPaymentRecordView(input: {
  id: string;
  label: string;
  amount: number;
  currency: string;
  status: string | PaymentStatus;
  statusLabel?: string;
  dueDate?: string | null;
  proofName?: string | null;
  proofUrl?: string | null;
  updatedAt?: string | null;
  rank?: { index: number; total: number } | null;
}): PaymentRecordView {
  return {
    id: input.id,
    label: input.label,
    amount: Number.isFinite(input.amount) ? Number(input.amount) : 0,
    currency: input.currency || "NGN",
    status: coercePaymentStatus(input.status),
    statusLabel: input.statusLabel,
    dueDate: input.dueDate ?? null,
    proofName: input.proofName ?? null,
    proofUrl: input.proofUrl ?? null,
    updatedAt: input.updatedAt ?? null,
    rank: input.rank ?? null,
  };
}

export function buildPaymentSurfaceContext(input: {
  payment: PaymentRecordView;
  record: PaymentSurfaceRecord;
  platform: PaymentPlatformAccount;
  upload?: PaymentSurfaceContext["upload"];
  copy?: PaymentSurfaceContext["copy"];
  theme?: PaymentSurfaceContext["theme"];
}): PaymentSurfaceContext {
  return {
    payment: input.payment,
    record: input.record,
    platform: input.platform,
    upload: input.upload,
    copy: input.copy,
    theme: input.theme,
  };
}
