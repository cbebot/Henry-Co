import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * WalletPageHeader — the refined header for the wallet's inner pages
 * (Add money, Withdraw, Funding request). Editorial and on-system: a back
 * link, a kicker, a serif title, an optional supporting line, and an optional
 * right-aligned figure (e.g. available balance) — NOT another onyx band. The
 * onyx vault stays the single signature on the main wallet; inner pages get a
 * calm, strong header so the hierarchy reads clearly.
 */
export type WalletPageHeaderFigure = {
  label: string;
  value: string;
  approx?: string | null;
};

type WalletPageHeaderProps = {
  backHref: string;
  backLabel: string;
  eyebrow: string;
  title: string;
  blurb?: string;
  figure?: WalletPageHeaderFigure;
  chip?: { label: string; tone?: "active" | "success" | "warn" | "danger" | "neutral" };
};

export function WalletPageHeader({
  backHref,
  backLabel,
  eyebrow,
  title,
  blurb,
  figure,
  chip,
}: WalletPageHeaderProps) {
  return (
    <header className="acct-wal__pagehead">
      <Link href={backHref} className="acct-wal__nav-back">
        <ArrowLeft size={15} aria-hidden />
        {backLabel}
      </Link>

      <div className="acct-wal__pagehead-row">
        <div className="acct-wal__pagehead-lead">
          <span className="acct-wal__pagehead-eyebrow">{eyebrow}</span>
          <div className="acct-wal__pagehead-titlewrap">
            <h1 className="acct-wal__pagehead-title acct-display">{title}</h1>
            {chip ? (
              <span className="acct-wal__chip" data-tone={chip.tone ?? "neutral"}>
                {chip.label}
              </span>
            ) : null}
          </div>
          {blurb ? <p className="acct-wal__pagehead-blurb">{blurb}</p> : null}
        </div>

        {figure ? (
          <div className="acct-wal__pagehead-figure">
            <span className="acct-wal__pagehead-figure-label">{figure.label}</span>
            <span className="acct-wal__pagehead-figure-value">{figure.value}</span>
            {figure.approx ? (
              <span className="acct-wal__pagehead-figure-approx">{figure.approx}</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}

export default WalletPageHeader;
