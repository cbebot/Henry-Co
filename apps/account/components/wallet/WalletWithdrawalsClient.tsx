"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ButtonPendingContent } from "@henryco/ui";

type PayoutMethod = {
  id: string;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
  is_default: boolean | null;
};

type WithdrawalRow = {
  id: string;
  amount_kobo: number;
  status: string;
  created_at: string;
};

function statusLabel(status: string) {
  const s = status.replaceAll("_", " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function WalletWithdrawalsClient({
  initialMethods,
  initialRequests,
  pinConfigured,
  availableBalanceKobo,
  pendingHoldKobo,
}: {
  initialMethods: PayoutMethod[];
  initialRequests: WithdrawalRow[];
  pinConfigured: boolean;
  availableBalanceKobo: number;
  pendingHoldKobo: number;
}) {
  const router = useRouter();
  const [methods, setMethods] = useState(initialMethods);
  const [requests, setRequests] = useState(initialRequests);
  const [hasPin, setHasPin] = useState(pinConfigured);
  const [availableKobo, setAvailableKobo] = useState(availableBalanceKobo);
  const [pendingHold, setPendingHold] = useState(pendingHoldKobo);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");

  const [amount, setAmount] = useState("");
  const [payoutId, setPayoutId] = useState(methods[0]?.id ?? "");
  const [withdrawPin, setWithdrawPin] = useState("");

  async function refresh() {
    const res = await fetch("/api/wallet/payout-methods", { cache: "no-store" });
    const payload = (await res.json()) as { methods?: PayoutMethod[] };
    if (payload.methods) {
      setMethods(payload.methods);
      setPayoutId((current) => current || payload.methods?.[0]?.id || "");
    }
    router.refresh();
  }

  async function addPayout(e: React.FormEvent) {
    e.preventDefault();
    setBusy("payout");
    setMessage(null);
    try {
      const res = await fetch("/api/wallet/payout-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bank_name: bankName,
          account_name: accountName,
          account_number: accountNumber,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      setBankName("");
      setAccountName("");
      setAccountNumber("");
      await refresh();
      setMessage({ type: "ok", text: "Payout account saved." });
    } catch (err) {
      setMessage({ type: "err", text: err instanceof Error ? err.message : "Could not save account." });
    } finally {
      setBusy(null);
    }
  }

  async function savePin(e: React.FormEvent) {
    e.preventDefault();
    setBusy("pin");
    setMessage(null);
    try {
      const res = await fetch("/api/wallet/withdrawal/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin,
          confirmPin,
          currentPin: hasPin ? currentPin : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update PIN");
      setPin("");
      setConfirmPin("");
      setCurrentPin("");
      setHasPin(true);
      setMessage({ type: "ok", text: "Withdrawal PIN updated." });
    } catch (err) {
      setMessage({ type: "err", text: err instanceof Error ? err.message : "Could not update PIN." });
    } finally {
      setBusy(null);
    }
  }

  async function submitWithdrawal(e: React.FormEvent) {
    e.preventDefault();
    setBusy("withdraw");
    setMessage(null);
    const naira = Number(amount);
    if (!Number.isFinite(naira) || naira < 100) {
      setMessage({ type: "err", text: "Enter at least NGN 100." });
      setBusy(null);
      return;
    }
    try {
      const res = await fetch("/api/wallet/withdrawal/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountNaira: naira,
          payoutMethodId: payoutId,
          pin: withdrawPin,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setAmount("");
      setWithdrawPin("");
      setRequests((prev) => [
        {
          id: String(data.id),
          amount_kobo: Math.round(naira * 100),
          status: "pending_review",
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setAvailableKobo((prev) => Math.max(0, prev - Math.round(naira * 100)));
      setPendingHold((prev) => prev + Math.round(naira * 100));
      setMessage({ type: "ok", text: "Withdrawal submitted for review." });
      router.refresh();
    } catch (err) {
      setMessage({ type: "err", text: err instanceof Error ? err.message : "Could not submit." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8" data-live-refresh-pause="true">
      {message ? (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            message.type === "ok"
              ? "bg-[var(--acct-green-soft)] text-[var(--acct-green)]"
              : "bg-[var(--acct-red-soft)] text-[var(--acct-red)]"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <section className="acct-card p-5">
        <p className="acct-kicker">Verified payout account</p>
        <p className="mt-1 text-sm text-[var(--acct-muted)]">
          Add the bank account withdrawals should be sent to after finance approval.
        </p>
        <form onSubmit={addPayout} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            className="acct-input rounded-xl"
            placeholder="Bank name"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            required
          />
          <input
            className="acct-input rounded-xl"
            placeholder="Account name"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            required
          />
          <input
            className="acct-input rounded-xl sm:col-span-2"
            placeholder="Account number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            required
          />
          <button type="submit" disabled={busy === "payout"} className="acct-button-primary rounded-xl sm:col-span-2">
            <ButtonPendingContent pending={busy === "payout"} pendingLabel="Saving payout account..." spinnerLabel="Saving payout account">
              Save payout account
            </ButtonPendingContent>
          </button>
        </form>
        {methods.length > 0 ? (
          <ul className="mt-4 space-y-2 text-sm text-[var(--acct-ink)]">
            {methods.map((m) => (
              <li key={m.id} className="rounded-xl bg-[var(--acct-surface)] px-4 py-3">
                <span className="font-semibold">{m.bank_name}</span> · {m.account_name} · ****
                {String(m.account_number || "").slice(-4)}
                {m.is_default ? <span className="ml-2 text-xs text-[var(--acct-muted)]">Default</span> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="acct-card p-5">
        <p className="acct-kicker">Withdrawal PIN</p>
        <p className="mt-1 text-sm text-[var(--acct-muted)]">
          {hasPin ? "Change your 4–6 digit PIN used to confirm withdrawals." : "Create a 4–6 digit PIN to protect withdrawals."}
        </p>
        <form onSubmit={savePin} className="mt-4 grid gap-3 sm:grid-cols-2">
          {hasPin ? (
            <input
              type="password"
              inputMode="numeric"
              className="acct-input rounded-xl sm:col-span-2"
              placeholder="Current PIN"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              required
            />
          ) : null}
          <input
            type="password"
            inputMode="numeric"
            className="acct-input rounded-xl"
            placeholder="New PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            required
          />
          <input
            type="password"
            inputMode="numeric"
            className="acct-input rounded-xl"
            placeholder="Confirm PIN"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value)}
            required
          />
          <button type="submit" disabled={busy === "pin"} className="acct-button-secondary rounded-xl sm:col-span-2">
            <ButtonPendingContent pending={busy === "pin"} pendingLabel={hasPin ? "Updating PIN..." : "Setting PIN..."} spinnerLabel="Saving withdrawal PIN">
              {hasPin ? "Update PIN" : "Set PIN"}
            </ButtonPendingContent>
          </button>
        </form>
      </section>

      <section className="acct-card p-5">
        <p className="acct-kicker">Request withdrawal</p>
        <p className="mt-1 text-sm text-[var(--acct-muted)]">
          Available balance:{" "}
          <span className="font-semibold text-[var(--acct-ink)]">
            ₦{(availableKobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </span>
        </p>
        {pendingHold > 0 ? (
          <p className="mt-2 text-xs leading-6 text-[var(--acct-muted)]">
            ₦{(pendingHold / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })} is already held in pending withdrawal review.
          </p>
        ) : null}
        <form onSubmit={submitWithdrawal} className="mt-4 grid gap-3">
          <input
            className="acct-input rounded-xl"
            type="number"
            min={100}
            step={1}
            placeholder="Amount (NGN)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <select
            className="acct-select rounded-xl"
            value={payoutId}
            onChange={(e) => setPayoutId(e.target.value)}
            required
          >
            <option value="">Select payout account</option>
            {methods.map((m) => (
              <option key={m.id} value={m.id}>
                {m.bank_name} · {m.account_name}
              </option>
            ))}
          </select>
          <input
            type="password"
            inputMode="numeric"
            className="acct-input rounded-xl"
            placeholder="Withdrawal PIN"
            value={withdrawPin}
            onChange={(e) => setWithdrawPin(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={busy === "withdraw" || !hasPin || methods.length === 0}
            className="acct-button-primary rounded-xl disabled:opacity-50"
          >
            <ButtonPendingContent pending={busy === "withdraw"} pendingLabel="Submitting withdrawal..." spinnerLabel="Submitting withdrawal">
              Submit withdrawal
            </ButtonPendingContent>
          </button>
          {!hasPin || methods.length === 0 ? (
            <p className="text-xs text-[var(--acct-muted)]">Set a PIN and save a payout account first.</p>
          ) : null}
        </form>
      </section>

      <section className="acct-card p-5">
        <p className="acct-kicker">Withdrawal history</p>
        {requests.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--acct-muted)]">No withdrawal requests yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {requests.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--acct-surface)] px-4 py-3 text-sm"
              >
                <span className="font-semibold text-[var(--acct-ink)]">
                  ₦{(r.amount_kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[var(--acct-muted)]">{statusLabel(r.status)}</span>
                <span className="text-xs text-[var(--acct-muted)]">
                  {new Date(r.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
