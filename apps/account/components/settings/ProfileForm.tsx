"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type Props = {
  profile: Record<string, string | null> | null;
  email: string | null;
};

export default function ProfileForm({ profile, email }: Props) {
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName.trim(), phone: phone.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");

      setMessage({ type: "success", text: "Profile updated" });
      router.refresh();
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-[var(--acct-green-soft)] text-[var(--acct-green)]"
              : "bg-[var(--acct-red-soft)] text-[var(--acct-red)]"
          }`}
        >
          {message.text}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium">Email</label>
        <input type="email" value={email || ""} disabled className="acct-input opacity-60" />
        <p className="mt-1 text-xs text-[var(--acct-muted)]">Contact support to change your email</p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Full name</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="acct-input"
          placeholder="Your full name"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Phone</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="acct-input"
          placeholder="+234..."
        />
      </div>

      <button type="submit" disabled={loading} className="acct-button-primary rounded-xl">
        {loading ? <Loader2 size={16} className="animate-spin" /> : "Save changes"}
      </button>
    </form>
  );
}
