"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ButtonPendingContent } from "@henryco/ui";

export default function AddAddressForm() {
  const [form, setForm] = useState({
    label: "Home",
    full_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    landmark: "",
    is_default: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  const update = (key: string, val: string | boolean) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/addresses/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to save");
      setMessage({ type: "success", text: "Address saved" });
      setForm({
        label: "Home", full_name: "", phone: "", address_line1: "",
        address_line2: "", city: "", state: "", postal_code: "", landmark: "", is_default: false,
      });
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Failed to save address" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm ${message.type === "success" ? "bg-[var(--acct-green-soft)] text-[var(--acct-green)]" : "bg-[var(--acct-red-soft)] text-[var(--acct-red)]"}`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Label</label>
          <select value={form.label} onChange={(e) => update("label", e.target.value)} className="acct-select">
            <option>Home</option>
            <option>Work</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Full name</label>
          <input type="text" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} className="acct-input" placeholder="Recipient name" />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Address line 1</label>
        <input type="text" value={form.address_line1} onChange={(e) => update("address_line1", e.target.value)} className="acct-input" placeholder="Street address" required />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Address line 2 (optional)</label>
        <input type="text" value={form.address_line2} onChange={(e) => update("address_line2", e.target.value)} className="acct-input" placeholder="Apartment, suite, etc." />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium">City</label>
          <input type="text" value={form.city} onChange={(e) => update("city", e.target.value)} className="acct-input" required />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">State</label>
          <input type="text" value={form.state} onChange={(e) => update("state", e.target.value)} className="acct-input" required />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Phone</label>
          <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="acct-input" placeholder="+234..." />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Landmark (optional)</label>
        <input type="text" value={form.landmark} onChange={(e) => update("landmark", e.target.value)} className="acct-input" placeholder="Nearby landmark" />
      </div>

      <button type="submit" disabled={loading} className="acct-button-primary rounded-xl">
        <ButtonPendingContent pending={loading} pendingLabel="Saving address..." spinnerLabel="Saving address">
          Save address
        </ButtonPendingContent>
      </button>
    </form>
  );
}
