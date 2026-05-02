const NON_SLUG = /[^A-Za-z0-9_-]/g;

export type DocumentType =
  | "TransactionHistory"
  | "Invoice"
  | "Receipt"
  | "KycSummary"
  | "CareBooking"
  | "PropertyListing"
  | "JobsApplication"
  | "Certificate"
  | "WalletStatement"
  | "SupportThread";

export function buildDocumentFilename(type: DocumentType, id: string, date: Date = new Date()) {
  const stem = String(id || "doc").replace(NON_SLUG, "").slice(0, 32) || "doc";
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `HenryCo-${type}-${stem}-${yyyy}${mm}${dd}.pdf`;
}

export function contentDispositionHeader(filename: string) {
  const encoded = encodeURIComponent(filename);
  return `inline; filename="${filename}"; filename*=UTF-8''${encoded}`;
}

export function attachmentDispositionHeader(filename: string) {
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${filename}"; filename*=UTF-8''${encoded}`;
}
