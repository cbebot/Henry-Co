/**
 * Stage 1 studio payment de-fragmentation flag.
 *
 * `STUDIO_PORTAL_PAYMENT_SURFACE === "1"` renders the legacy client-portal
 * pay surfaces (/payment and /client/payment/[invoiceId]) through the shared
 * @henryco/payment-surface composition. Anything else — including unset —
 * keeps the existing portal rendering byte-for-byte. Money-adjacent, so the
 * flag ships dark by default and the owner flips it after a preview check.
 */
export function isPortalPaymentSurfaceEnabled(): boolean {
  return process.env.STUDIO_PORTAL_PAYMENT_SURFACE === "1";
}
