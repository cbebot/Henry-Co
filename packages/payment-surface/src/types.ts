import type { CSSProperties, ReactNode } from "react";

export type PaymentStatus =
  | "pending"
  | "processing"
  | "paid"
  | "failed"
  | "refunded"
  | "cancelled";

export interface PaymentRecordView {
  /** Stable identifier — used as form post target / hidden input. */
  id: string;
  /** Human label such as "Deposit" or "Final payment". */
  label: string;
  /** Major-unit amount (e.g. 12500.00 for ₦12,500). */
  amount: number;
  /** ISO currency code, e.g. "NGN". */
  currency: string;
  status: PaymentStatus;
  /** Friendly status label override, e.g. "Awaiting transfer". */
  statusLabel?: string;
  /** ISO date or null when settlement is on confirmation. */
  dueDate?: string | null;
  proofName?: string | null;
  proofUrl?: string | null;
  /** ISO timestamp of last update — used for receipt date. */
  updatedAt?: string | null;
  /** Optional "1 of 3" rank for projects with milestone-tied payments. */
  rank?: { index: number; total: number } | null;
  /** Human-readable transaction reference (order no, invoice no). When absent,
   *  a stable short reference is derived from `id` so the surface always reads
   *  as a tracked transaction, never a bare UUID. */
  reference?: string | null;
}

export interface PaymentSurfaceLink {
  href: string;
  label: ReactNode;
}

export interface PaymentSurfaceRecord {
  /** Title of the parent record (project, order, booking). */
  title: string;
  /** Optional subtitle, e.g. milestone name. */
  subtitle?: string;
  /** Quiet breadcrumb back to the parent record workspace. */
  back: PaymentSurfaceLink;
  /** Account-home link in the bottom rail. */
  account: PaymentSurfaceLink;
  /** Optional middle CTA in hero footer (e.g. "Open project workspace"). */
  primaryCta?: PaymentSurfaceLink;
}

/** @deprecated Renamed to PaymentSurfaceRecord. Kept as an alias during the
 *  V2-PAYMENT-UNIFICATION rollout so we don't break any existing import sites. */
export type PaymentSurfaceContextRef = PaymentSurfaceRecord;

export interface PaymentPlatformAccount {
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  supportEmail: string | null;
  supportWhatsApp: string | null;
}

export interface PaymentProofUploadConfig {
  /** Server action that accepts FormData with `proof` File and any extra fields. */
  action: (formData: FormData) => Promise<void> | void;
  /** Where to redirect after a successful upload — usually back to this page. */
  redirectPath: string;
  /** Hidden form fields rendered before the file picker (e.g. paymentId, accessKey). */
  hiddenFields?: ReadonlyArray<{ name: string; value: string }>;
  /** Accept attribute for the file input. */
  accept?: string;
  /** Optional label override for the submit button. */
  submitLabel?: string;
  /** Optional label shown while the form is pending. */
  pendingLabel?: string;
}

export interface PaymentSurfaceCopy {
  /** Eyebrow above the hero title — defaults to "Payment · {rank.index} of {rank.total}". */
  eyebrow?: ReactNode;
  /** Body line in the hero, status-aware. Override per-status. */
  bodyByStatus?: Partial<Record<PaymentStatus, string>>;
  /** Bank-transfer instructions paragraph in the guide. */
  instructions?: string;
  /** Hint shown beneath the proof-upload form. */
  proofHint?: string;
  /** Receipt copy after settlement. Supports `{date}` and `{proof}` placeholders. */
  receiptText?: string;
  /** Title shown above the bank details card. */
  guideTitle?: string;
}

export interface PaymentSurfaceTheme {
  /** CSS variable expression used for accent color, e.g. "var(--studio-signal, #97f4f3)". */
  accentVar?: string;
  /** Tone of the hero card from `@henryco/ui/public-shell`. */
  heroTone?: "spotlight" | "panel" | "contrast" | "ink";
  /** Class name applied to the outer <main>. */
  mainClassName?: string;
  /** Class name applied to inner sections (the panels beneath the hero). */
  panelClassName?: string;
  /** Class name applied to bank/divider lines. */
  lineClassName?: string;
  /** Class name applied to soft text. */
  softTextClassName?: string;
  /** Class name applied to primary text. */
  inkTextClassName?: string;
  /** Inline styles applied at the surface root (e.g. CSS var overrides). */
  rootStyle?: CSSProperties;
}

export interface PaymentSurfaceContext {
  payment: PaymentRecordView;
  /** Parent record (project / order / booking) the payment belongs to. */
  record: PaymentSurfaceRecord;
  platform: PaymentPlatformAccount;
  upload?: PaymentProofUploadConfig;
  copy?: PaymentSurfaceCopy;
  theme?: PaymentSurfaceTheme;
  /**
   * V3-13 provider-router seam: an optional "pay by card" CTA that starts a
   * card payment through @henryco/payment-router instead of bank transfer.
   * `label` is already i18n-translated by the caller; `href` points at the
   * app's card-payment route. Rendered only while the payment is open and
   * awaiting action. Omit or pass null to keep the surface bank-transfer-only
   * (the default until an app opts in). The live card route + provider land in
   * V3-14/15/16 — V3-13 ships the seam, not a customer-facing card page.
   */
  cardCta?: { label: string; href: string } | null;
  /**
   * Optional "pay from wallet balance" CTA, shown beside the card option while the payment
   * is open. `label`/`note` are already i18n-translated by the caller; `href` points at the
   * wallet-checkout flow (which does the guarded debit + mark-paid). Omit/null to hide.
   */
  walletCta?: { label: string; href: string; note?: string } | null;
  /**
   * Card-first mode: the division has retired bank transfer. The card CTA becomes the
   * ONLY open-payment action — the bank guide and proof upload never render (a proof
   * already on file from the transfer era still shows its processing state until
   * finance resolves it). Omit/false keeps today's bank-transfer surface (the default;
   * no other division changes).
   */
  cardOnly?: boolean;
}
