"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HenryCoActivityIndicator } from "@henryco/ui";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { getAccountMiscExtraCopy } from "@henryco/i18n";

export function StudioWalletCheckoutButton({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const locale = useHenryCoLocale();
  const copy = getAccountMiscExtraCopy(locale).studioWallet;
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleWalletPay() {
    if (pending) return;
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/studio/payments/${encodeURIComponent(paymentId)}/wallet`, {
        method: "POST",
      });
      const payload = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !payload.ok) {
        setMessage(payload.error || copy.failed);
        return;
      }
      setMessage(copy.submitted);
      router.refresh();
    } catch {
      setMessage(copy.failedRetry);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-4 space-y-2">
      <button
        type="button"
        onClick={() => void handleWalletPay()}
        disabled={pending}
        aria-busy={pending}
        className="acct-button-secondary rounded-xl disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <span className="inline-flex items-center gap-2">
            <HenryCoActivityIndicator size="sm" className="text-[var(--acct-gold)]" label={copy.chargingLabel} />
            {copy.charging}
          </span>
        ) : (
          copy.payFromWallet
        )}
      </button>
      {message ? <p className="text-xs text-[var(--acct-muted)]">{message}</p> : null}
    </div>
  );
}
