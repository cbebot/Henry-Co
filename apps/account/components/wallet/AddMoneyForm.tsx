"use client";

import { useState } from "react";
import { ButtonPendingContent } from "@henryco/ui";
import { useRouter } from "next/navigation";

const presetAmounts = [1000, 2000, 5000, 10000, 20000, 50000];

export default function AddMoneyForm() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseInt(amount, 10);
    if (!value || value < 100) {
      setMessage({ type: "error", text: "Minimum amount is NGN 100." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/wallet/fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "bank_transfer",
          amountNaira: value,
        }),
      });

      const data = (await res
        .json()
        .catch(() => null)) as { error?: string; requestId?: string } | null;

      if (!res.ok || !data?.requestId) {
        console.error("[wallet/AddMoneyForm] funding request failed", {
          status: res.status,
          serverError: data?.error ?? null,
        });
        setMessage({
          type: "error",
          text: "We couldn't start that funding request. Please try again in a moment.",
        });
        return;
      }

      router.push(`/wallet/funding/${data.requestId}`);
      router.refresh();
    } catch (err) {
      console.error("[wallet/AddMoneyForm] network or parse error", err);
      setMessage({
        type: "error",
        text: "We couldn't reach the wallet service. Check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="acct-card p-5">
      <p className="acct-kicker mb-3">Amount (NGN)</p>

      {message && (
        <div
          className={`mb-4 rounded-xl px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-[var(--acct-green-soft)] text-[var(--acct-green)]"
              : "bg-[var(--acct-red-soft)] text-[var(--acct-red)]"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {presetAmounts.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setAmount(String(preset))}
            className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all ${
              amount === String(preset)
                ? "border-[var(--acct-gold)] bg-[var(--acct-gold-soft)] text-[var(--acct-gold)]"
                : "border-[var(--acct-line)] text-[var(--acct-muted)] hover:border-[var(--acct-gold)]"
            }`}
          >
            {preset >= 1000 ? `${preset / 1000}K` : preset}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="acct-input text-lg font-semibold"
          placeholder="Enter amount"
          min={100}
        />
      </div>

      <button
        type="submit"
        disabled={loading || !amount}
        className="acct-button-primary mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3"
      >
        <ButtonPendingContent pending={loading} pendingLabel="Creating request..." spinnerLabel="Creating funding request">
          Continue to bank transfer
        </ButtonPendingContent>
      </button>
      <p className="mt-3 text-center text-xs text-[var(--acct-muted)]">
        You’ll confirm bank details and upload proof on the next step—balance updates after verification.
      </p>
    </form>
  );
}
