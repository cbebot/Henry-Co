"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const categories = [
  { value: "general", label: "General" },
  { value: "billing", label: "Billing & Payments" },
  { value: "care", label: "Care Service" },
  { value: "marketplace", label: "Marketplace" },
  { value: "wallet", label: "Wallet" },
  { value: "account", label: "Account & Security" },
  { value: "other", label: "Other" },
];

export default function NewSupportForm() {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
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
        {loading ? <Loader2 size={18} className="animate-spin" /> : "Submit request"}
      </button>
    </form>
  );
}
