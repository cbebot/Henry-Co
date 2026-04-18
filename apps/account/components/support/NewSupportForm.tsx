"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { translateSurfaceLabel, useHenryCoLocale } from "@henryco/i18n";
import { ButtonPendingContent } from "@henryco/ui";

export default function NewSupportForm() {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const categories = [
    { value: "general", label: t("General") },
    { value: "billing", label: t("Billing & Payments") },
    { value: "care", label: t("Care Service") },
    { value: "marketplace", label: t("Marketplace") },
    { value: "wallet", label: t("Wallet") },
    { value: "account", label: t("Account & Security") },
    { value: "other", label: t("Other") },
  ];
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function localizeSupportError(message: string) {
    switch (message) {
      case "Unauthorized":
        return t("Please sign in to continue.");
      case "Subject and message required":
        return t("Subject and message required.");
      case "Failed to create thread":
      case "Failed to create support message":
      case "Failed to create request":
        return t("Failed to create request");
      case "Internal error":
        return t("Something went wrong");
      default:
        return t(message);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/support/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, category, message }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(localizeSupportError(data.error || "Failed to create request"));

      router.push("/support");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? localizeSupportError(err.message) : t("Something went wrong"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="acct-card p-6">
      {error && (
        <div className="mb-4 rounded-xl bg-[var(--acct-red-soft)] px-4 py-3 text-sm text-[var(--acct-red)]">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">{t("Category")}</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="acct-select"
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">{t("Subject")}</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="acct-input"
            placeholder={t("Brief description of your issue")}
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">{t("Message")}</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="acct-textarea"
            placeholder={t("Describe your issue in detail...")}
            rows={5}
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="acct-button-primary mt-6 w-full rounded-xl py-3"
      >
        <ButtonPendingContent pending={loading} pendingLabel={t("Submitting request...")} spinnerLabel={t("Submitting request...")}>
          {t("Submit request")}
        </ButtonPendingContent>
      </button>
    </form>
  );
}
