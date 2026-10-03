import { getMarketplaceTrustCopy } from "@henryco/i18n/server";

type Locale = Parameters<typeof getMarketplaceTrustCopy>[0];

/**
 * Why a seller decision the system refused did not go through — shown above the
 * staff queue instead of a silent return to it. `error` is the redirect's
 * `?error=` value; anything else renders nothing.
 */
export function DecisionRefusalNotice({ error, locale }: { error: string | undefined; locale: Locale }) {
  const ownerCopy = getMarketplaceTrustCopy(locale).owner;
  const message =
    error === "store-handle-taken"
      ? ownerCopy.storeHandleTaken
      : error === "decision-failed"
        ? ownerCopy.actionFailed
        : null;
  if (!message) return null;
  return (
    <div
      role="alert"
      className="market-paper mb-6 rounded-[1.5rem] border border-[var(--market-line)] px-5 py-4 text-sm leading-7 text-[var(--market-paper-white)]"
    >
      {message}
    </div>
  );
}
