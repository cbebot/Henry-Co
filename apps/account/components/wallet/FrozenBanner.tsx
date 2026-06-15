/**
 * FrozenBanner — honest "wallet on hold" state.
 *
 * customer_wallets carries frozen_at / frozen_reason, which most wallets ignore.
 * When the wallet is frozen we say so plainly and reassure that the balance is
 * safe — calm authority, no alarm. Rendered only when `frozen` is true.
 */
export type FrozenBannerCopy = {
  title: string;
  body: string;
  reasonTemplate: string;
};

type FrozenBannerProps = {
  reason: string | null | undefined;
  copy: FrozenBannerCopy;
};

export function FrozenBanner({ reason, copy }: FrozenBannerProps) {
  const trimmed = typeof reason === "string" ? reason.trim() : "";
  return (
    <div className="acct-wal__frozen" role="status">
      <span className="acct-wal__frozen-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="10.5" width="16" height="10" rx="2" />
          <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
        </svg>
      </span>
      <div className="acct-wal__frozen-meta">
        <p className="acct-wal__frozen-title">{copy.title}</p>
        <p className="acct-wal__frozen-body">{copy.body}</p>
        {trimmed ? (
          <p className="acct-wal__frozen-reason">
            {copy.reasonTemplate.replaceAll("{reason}", trimmed)}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default FrozenBanner;
