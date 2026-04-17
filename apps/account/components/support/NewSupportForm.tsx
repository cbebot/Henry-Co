"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ButtonPendingContent } from "@henryco/ui";

const categories = [
  { value: "general", label: "General" },
  { value: "billing", label: "Billing & Payments" },
  { value: "care", label: "Care Service" },
  { value: "marketplace", label: "Marketplace" },
  { value: "wallet", label: "Wallet" },
  { value: "account", label: "Account & Security" },
  { value: "other", label: "Other" },
];

const validCategoryValues = new Set(categories.map((category) => category.value));

function normalizePrefillCategory(value: string | null) {
  const normalized = String(value || "").trim().toLowerCase();
  return validCategoryValues.has(normalized) ? normalized : "general";
}

function normalizePrefillText(value: string | null, maxLength: number) {
  return String(value || "").trim().slice(0, maxLength);
}

export default function NewSupportForm() {
  const searchParams = useSearchParams();
  const [subject, setSubject] = useState(() =>
    normalizePrefillText(searchParams.get("subject"), 160)
  );
  const [category, setCategory] = useState(() =>
    normalizePrefillCategory(searchParams.get("category"))
  );
  const [message, setMessage] = useState(() =>
    normalizePrefillText(searchParams.get("message"), 4000)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
      if (!res.ok) throw new Error(data.error || "Failed to create request");

      router.push("/support");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
          <label className="mb-1.5 block text-sm font-medium">Category</label>
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
          <label className="mb-1.5 block text-sm font-medium">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="acct-input"
            placeholder="Brief description of your issue"
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="acct-textarea"
            placeholder="Describe your issue in detail..."
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
        <ButtonPendingContent pending={loading} pendingLabel="Submitting request..." spinnerLabel="Submitting request">
          Submit request
        </ButtonPendingContent>
      </button>
    </form>
  );
}
