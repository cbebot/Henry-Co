"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HenryCoActivityIndicator } from "@henryco/ui";

export function StudioWalletCheckoutButton({ paymentId }: { paymentId: string }) {
  const router = useRouter();
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
        setMessage(payload.error || "Wallet checkout failed.");
        return;
      }
      setMessage("Wallet debit submitted. Finance review is now in progress.");
      router.refresh();
    } catch {
      setMessage("Wallet checkout failed. Please retry.");
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
            <HenryCoActivityIndicator size="sm" className="text-[var(--acct-gold)]" label="Charging wallet" />
            Charging wallet…
          </span>
        ) : (
          "Pay from wallet balance"
        )}
      </button>
      {message ? <p className="text-xs text-[var(--acct-muted)]">{message}</p> : null}
    </div>
  );
}
