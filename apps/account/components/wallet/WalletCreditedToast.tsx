"use client";

import { useEffect } from "react";
import { translateSurfaceLabel, useHenryCoLocale } from "@henryco/i18n";
import { toast } from "@henryco/ui/feedback";

/**
 * V3-FEEDBACK-01 — the confirmed top-up acknowledgement.
 *
 * Rendered by the /wallet and /wallet/funding server pages ONLY when THIS
 * load's reconciler actually credited a top-up (`creditedCount > 0`), i.e.
 * strictly downstream of provider-confirmed money truth: the reconciler
 * credits only intents the webhook/finalize marked `succeeded`, and it is
 * idempotent — a replayed load reports zero and renders nothing. Never
 * optimistic, by construction.
 *
 * `nonce` is minted server-side per credit event; the sessionStorage stamp
 * keeps a router-cache replay (back-nav within the RSC cache window) from
 * re-announcing money that was credited minutes ago.
 */

const SEEN_KEY = "henryco:wallet-credited-seen.v1";

function alreadyAnnounced(nonce: string): boolean {
  try {
    return window.sessionStorage.getItem(SEEN_KEY) === nonce;
  } catch {
    return false;
  }
}

function markAnnounced(nonce: string): void {
  try {
    window.sessionStorage.setItem(SEEN_KEY, nonce);
  } catch {
    /* private mode — the stable toast id still de-dupes within the page */
  }
}

export default function WalletCreditedToast({
  creditedKobo,
  nonce,
}: {
  creditedKobo: number;
  nonce: string;
}) {
  const locale = useHenryCoLocale();

  useEffect(() => {
    if (creditedKobo <= 0 || alreadyAnnounced(nonce)) return;
    markAnnounced(nonce);
    let amount: string;
    try {
      amount = new Intl.NumberFormat(locale === "en" ? "en-NG" : locale, {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0,
      }).format(Math.round(creditedKobo / 100));
    } catch {
      amount = `NGN ${Math.round(creditedKobo / 100).toLocaleString()}`;
    }
    toast.success(translateSurfaceLabel(locale, "Wallet topped up"), {
      id: "wallet-credited",
      body: translateSurfaceLabel(locale, "{amount} added to your balance.").replace(
        "{amount}",
        amount,
      ),
      chime: true,
    });
  }, [creditedKobo, nonce, locale]);

  return null;
}
