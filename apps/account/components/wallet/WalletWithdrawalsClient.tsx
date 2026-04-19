"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney, formatSurfaceTemplate, translateSurfaceLabel, useHenryCoLocale } from "@henryco/i18n";
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

export default function WalletWithdrawalsClient({
  initialMethods,
  initialRequests,
  pinConfigured,
  availableBalanceKobo,
  pendingHoldKobo,
  verificationGate,
}: {
  initialMethods: PayoutMethod[];
  initialRequests: WithdrawalRow[];
  pinConfigured: boolean;
  availableBalanceKobo: number;
  pendingHoldKobo: number;
  verificationGate: {
    status: "none" | "pending" | "verified" | "rejected";
    headline: string;
    detail: string;
  };
}) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const numberLocale = locale === "en" ? "en-NG" : locale;
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
  const withdrawalsUnlocked = verificationGate.status === "verified";

  function statusLabel(status: string) {
    const value = status.replaceAll("_", " ");
    const translated = t(value);
    return translated === value ? value.charAt(0).toUpperCase() + value.slice(1) : translated;
  }

  function localizeWalletError(message: string) {
    if (message.endsWith("Open /verification to continue.")) {
      return t("Identity verification must be approved before withdrawals can be requested.");
    }

    switch (message) {
      case "Unauthorized":
        return t("Please sign in to continue.");
      case "Enter your bank name, account name, and a valid account number.":
        return t("Enter your bank name, account name, and a valid account number.");
      case "That bank account is already saved for payouts.":
        return t("That bank account is already saved for payouts.");
      case "Use a 4–6 digit PIN and make sure both entries match.":
        return t("Use a 4–6 digit PIN and make sure both entries match.");
      case "Current PIN is incorrect.":
        return t("Current PIN is incorrect.");
      case "Minimum withdrawal is NGN 100.":
      case "Enter at least NGN 100.":
        return t("Enter at least NGN 100.");
      case "Choose a verified payout account.":
        return t("Select payout account");
      case "Withdrawal PIN is required or incorrect.":
        return t("Withdrawal PIN is required or incorrect.");
      case "That payout account is not available.":
        return t("That payout account is not available.");
      case "Amount exceeds your available balance after pending withdrawals.":
        return t("Amount exceeds your available balance after pending withdrawals.");
      case "We couldn’t load your wallet. Please refresh and try again.":
        return t("We couldn’t load your wallet. Please refresh and try again.");
      case "We couldn’t save your changes. Please try again.":
      case "Could not save account.":
        return t("Could not save account.");
      case "Could not update PIN":
      case "Could not update PIN.":
        return t("Could not update PIN.");
      case "Request failed":
      case "Could not submit.":
        return t("Could not submit.");
      default:
        return t(message);
    }
  }

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
      if (!res.ok) throw new Error(localizeWalletError(data.error || "Could not save account."));
      setBankName("");
      setAccountName("");
      setAccountNumber("");
      await refresh();
      setMessage({ type: "ok", text: t("Payout account saved.") });
    } catch (err) {
      setMessage({ type: "err", text: err instanceof Error ? localizeWalletError(err.message) : t("Could not save account.") });
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
      if (!res.ok) throw new Error(localizeWalletError(data.error || "Could not update PIN."));
      setPin("");
      setConfirmPin("");
      setCurrentPin("");
      setHasPin(true);
      setMessage({ type: "ok", text: t("Withdrawal PIN updated.") });
    } catch (err) {
      setMessage({ type: "err", text: err instanceof Error ? localizeWalletError(err.message) : t("Could not update PIN.") });
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
      setMessage({ type: "err", text: t("Enter at least NGN 100.") });
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
      if (!res.ok) throw new Error(localizeWalletError(data.error || "Could not submit."));
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
      setMessage({ type: "ok", text: t("Withdrawal submitted for review.") });
      router.refresh();
    } catch (err) {
      setMessage({ type: "err", text: err instanceof Error ? localizeWalletError(err.message) : t("Could not submit.") });
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
        <p className="acct-kicker">{t("Verified payout account")}</p>
        <p className="mt-1 text-sm text-[var(--acct-muted)]">
          {t("Add the bank account withdrawals should be sent to after finance approval.")}
        </p>
        <form onSubmit={addPayout} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            className="acct-input rounded-xl"
            placeholder={t("Bank name")}
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            required
          />
          <input
            className="acct-input rounded-xl"
            placeholder={t("Account name")}
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            required
          />
          <input
            className="acct-input rounded-xl sm:col-span-2"
            placeholder={t("Account number")}
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            required
          />
          <button type="submit" disabled={busy === "payout"} className="acct-button-primary rounded-xl sm:col-span-2">
            <ButtonPendingContent pending={busy === "payout"} pendingLabel={t("Saving payout account...")} spinnerLabel={t("Saving payout account...")}>
              {t("Save payout account")}
            </ButtonPendingContent>
          </button>
        </form>
        {methods.length > 0 ? (
          <ul className="mt-4 space-y-2 text-sm text-[var(--acct-ink)]">
            {methods.map((m) => (
              <li key={m.id} className="rounded-xl bg-[var(--acct-surface)] px-4 py-3">
                <span className="font-semibold">{m.bank_name}</span> · {m.account_name} · ****
                {String(m.account_number || "").slice(-4)}
                {m.is_default ? <span className="ml-2 text-xs text-[var(--acct-muted)]">{t("Default")}</span> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="acct-card p-5">
        <p className="acct-kicker">{t("Withdrawal PIN")}</p>
        <p className="mt-1 text-sm text-[var(--acct-muted)]">
          {hasPin ? t("Change your 4–6 digit PIN used to confirm withdrawals.") : t("Create a 4–6 digit PIN to protect withdrawals.")}
        </p>
        <form onSubmit={savePin} className="mt-4 grid gap-3 sm:grid-cols-2">
          {hasPin ? (
            <input
              type="password"
              inputMode="numeric"
              className="acct-input rounded-xl sm:col-span-2"
              placeholder={t("Current PIN")}
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              required
            />
          ) : null}
          <input
            type="password"
            inputMode="numeric"
            className="acct-input rounded-xl"
            placeholder={t("New PIN")}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            required
          />
          <input
            type="password"
            inputMode="numeric"
            className="acct-input rounded-xl"
            placeholder={t("Confirm PIN")}
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value)}
            required
          />
          <button type="submit" disabled={busy === "pin"} className="acct-button-secondary rounded-xl sm:col-span-2">
            <ButtonPendingContent pending={busy === "pin"} pendingLabel={hasPin ? t("Updating PIN...") : t("Setting PIN...")} spinnerLabel={t("Withdrawal PIN")}>
              {hasPin ? t("Update PIN") : t("Set PIN")}
            </ButtonPendingContent>
          </button>
        </form>
      </section>

      <section className="acct-card p-5">
        <p className="acct-kicker">{t("Request withdrawal")}</p>
        <p className="mt-1 text-sm text-[var(--acct-muted)]">
          {t("Available balance")}:{" "}
          <span className="font-semibold text-[var(--acct-ink)]">
            {formatMoney(availableKobo, "NGN")}
          </span>
        </p>
        {pendingHold > 0 ? (
          <p className="mt-2 text-xs leading-6 text-[var(--acct-muted)]">
            {formatSurfaceTemplate(t("{amount} is already held in pending withdrawal review."), {
              amount: formatMoney(pendingHold, "NGN"),
            })}
          </p>
        ) : null}
        {!withdrawalsUnlocked ? (
          <div className="mt-4 rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] px-4 py-4">
            <p className="text-sm font-semibold text-[var(--acct-ink)]">{verificationGate.headline}</p>
            <p className="mt-2 text-sm leading-7 text-[var(--acct-muted)]">{verificationGate.detail}</p>
            <a
              href="/verification"
              className="mt-3 inline-flex rounded-full bg-[var(--acct-gold)] px-4 py-2 text-xs font-semibold text-white"
            >
              {t("Open verification")}
            </a>
          </div>
        ) : null}
        <form onSubmit={submitWithdrawal} className="mt-4 grid gap-3">
          <input
            className="acct-input rounded-xl"
            type="number"
            min={100}
            step={1}
            placeholder={t("Amount (NGN)")}
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
            <option value="">{t("Select payout account")}</option>
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
            placeholder={t("Withdrawal PIN")}
            value={withdrawPin}
            onChange={(e) => setWithdrawPin(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={busy === "withdraw" || !hasPin || methods.length === 0 || !withdrawalsUnlocked}
            className="acct-button-primary rounded-xl disabled:opacity-50"
          >
            <ButtonPendingContent pending={busy === "withdraw"} pendingLabel={t("Submitting withdrawal...")} spinnerLabel={t("Submitting withdrawal...")}>
              {t("Submit withdrawal")}
            </ButtonPendingContent>
          </button>
          {!hasPin || methods.length === 0 || !withdrawalsUnlocked ? (
            <p className="text-xs text-[var(--acct-muted)]">
              {!withdrawalsUnlocked
                ? t("Identity verification must be approved before withdrawals can be requested.")
                : t("Set a PIN and save a payout account first.")}
            </p>
          ) : null}
        </form>
      </section>

      <section className="acct-card p-5">
        <p className="acct-kicker">{t("Withdrawal history")}</p>
        {requests.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--acct-muted)]">{t("No withdrawal requests yet.")}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {requests.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--acct-surface)] px-4 py-3 text-sm"
              >
                <span className="font-semibold text-[var(--acct-ink)]">
                  {formatMoney(r.amount_kobo, "NGN")}
                </span>
                <span className="text-[var(--acct-muted)]">{statusLabel(r.status)}</span>
                <span className="text-xs text-[var(--acct-muted)]">
                  {new Date(r.created_at).toLocaleString(numberLocale)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
