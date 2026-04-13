"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ButtonPendingContent } from "@henryco/ui";
import { ArrowRight, Building2 } from "lucide-react";
import { formatMoneyMajor } from "@henryco/i18n";

const presetAmounts = [5000, 10000, 25000, 50000, 100000];

export default function FundingRequestForm({
  settlementCurrency,
  locale,
  displayCurrency,
  settlementMessage,
}: {
  settlementCurrency: string;
  locale: string;
  displayCurrency: string;
  settlementMessage: string;
}) {
  const [amount, setAmount] = useState("10000");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();
  const formatMajor = (value: number) =>
    formatMoneyMajor(value, settlementCurrency, {
      locale,
    });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const amountNaira = Number(amount);

    if (!amountNaira || amountNaira < 100) {
      setMessage({ type: "error", text: `Minimum amount is ${formatMajor(100)}.` });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/wallet/fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "bank_transfer",
          amountNaira,
          note: note.trim() || null,
        }),
      });

      const data = (await response.json()) as { error?: string; requestId?: string };
      if (!response.ok || !data.requestId) {
        throw new Error(data.error || "Unable to create funding request.");
      }

      router.push(`/wallet/funding/${data.requestId}`);
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Unable to create funding request.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="acct-card p-5 sm:p-6" data-live-refresh-pause="true">
      <div className="flex flex-col gap-2">
        <p className="acct-kicker">Funding method</p>
        <div className="rounded-[1.4rem] border border-[var(--acct-gold)] bg-[var(--acct-gold-soft)] px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-[var(--acct-gold)]">
              <Building2 size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--acct-ink)]">Bank transfer</p>
              <p className="mt-1 text-xs leading-5 text-[var(--acct-muted)]">
                Create a funding request, complete the transfer, then upload proof so the HenryCo team can confirm it.
              </p>
            </div>
          </div>
        </div>
      </div>

      {message ? (
        <div
          className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-[var(--acct-green-soft)] text-[var(--acct-green)]"
              : "bg-[var(--acct-red-soft)] text-[var(--acct-red)]"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-5">
        {presetAmounts.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setAmount(String(preset))}
            className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
              amount === String(preset)
                ? "border-[var(--acct-gold)] bg-[var(--acct-gold-soft)] text-[var(--acct-gold)]"
                : "border-[var(--acct-line)] bg-[var(--acct-bg)] text-[var(--acct-muted)]"
            }`}
          >
            {formatMajor(preset)}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--acct-ink)]">
              Amount
            </label>
            <input
              type="number"
              min={100}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="acct-input text-lg font-semibold"
              placeholder={`Enter amount in ${settlementCurrency}`}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--acct-ink)]">
              Payment note
            </label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="acct-textarea min-h-[120px]"
              placeholder="Optional note for finance, for example the bank account or expected transfer time."
            />
          </div>
        </div>

          <div className="rounded-[1.5rem] bg-[var(--acct-surface)] p-4">
            <p className="acct-kicker">Funding flow</p>
            <ol className="mt-3 space-y-3 text-sm leading-6 text-[var(--acct-muted)]">
              <li>1. Create the request so HenryCo generates the correct reference.</li>
              <li>2. Transfer the exact amount using the bank details on the next page.</li>
              <li>3. Upload proof right away so the payment can be confirmed and the balance can become available.</li>
            </ol>
            <p className="mt-4 text-xs leading-6 text-[var(--acct-muted)]">
              Display currency: {displayCurrency}. Settlement currency: {settlementCurrency}. {settlementMessage}
            </p>
          </div>
        </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="acct-button-primary rounded-2xl px-5 py-3"
        >
          <ButtonPendingContent pending={loading} pendingLabel="Creating funding request..." spinnerLabel="Creating funding request">
            <>
              Create funding request
              <ArrowRight size={16} />
            </>
          </ButtonPendingContent>
        </button>
        <p className="text-xs leading-6 text-[var(--acct-muted)]">
          Wallet balance updates after the HenryCo team confirms the transfer.
        </p>
      </div>
    </form>
  );
}
