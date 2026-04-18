"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useHenryCoLocale } from "@henryco/i18n";
import { ButtonPendingContent } from "@henryco/ui";

export default function AddAddressForm() {
  const locale = useHenryCoLocale();
  const copy =
    locale === "fr"
      ? {
          label: "Libellé",
          fullName: "Nom complet",
          addressLine1: "Adresse ligne 1",
          addressLine2: "Adresse ligne 2 (optionnel)",
          city: "Ville",
          state: "État",
          phone: "Téléphone",
          landmark: "Repère (optionnel)",
          labels: { home: "Maison", work: "Travail", other: "Autre" },
          recipientPlaceholder: "Nom du destinataire",
          streetPlaceholder: "Adresse",
          addressLine2Placeholder: "Appartement, suite, etc.",
          phonePlaceholder: "+234...",
          landmarkPlaceholder: "Repère à proximité",
          save: "Enregistrer l’adresse",
          saving: "Enregistrement de l’adresse...",
          success: "Adresse enregistrée",
          error: "Impossible d’enregistrer l’adresse",
        }
      : {
          label: "Label",
          fullName: "Full name",
          addressLine1: "Address line 1",
          addressLine2: "Address line 2 (optional)",
          city: "City",
          state: "State",
          phone: "Phone",
          landmark: "Landmark (optional)",
          labels: { home: "Home", work: "Work", other: "Other" },
          recipientPlaceholder: "Recipient name",
          streetPlaceholder: "Street address",
          addressLine2Placeholder: "Apartment, suite, etc.",
          phonePlaceholder: "+234...",
          landmarkPlaceholder: "Nearby landmark",
          save: "Save address",
          saving: "Saving address...",
          success: "Address saved",
          error: "Failed to save address",
        };
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
      setMessage({ type: "success", text: copy.success });
      setForm({
        label: "Home", full_name: "", phone: "", address_line1: "",
        address_line2: "", city: "", state: "", postal_code: "", landmark: "", is_default: false,
      });
      router.refresh();
    } catch {
      setMessage({ type: "error", text: copy.error });
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
          <label className="mb-1.5 block text-sm font-medium">{copy.label}</label>
          <select value={form.label} onChange={(e) => update("label", e.target.value)} className="acct-select">
            <option value="Home">{copy.labels.home}</option>
            <option value="Work">{copy.labels.work}</option>
            <option value="Other">{copy.labels.other}</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">{copy.fullName}</label>
          <input type="text" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} className="acct-input" placeholder={copy.recipientPlaceholder} />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">{copy.addressLine1}</label>
        <input type="text" value={form.address_line1} onChange={(e) => update("address_line1", e.target.value)} className="acct-input" placeholder={copy.streetPlaceholder} required />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">{copy.addressLine2}</label>
        <input type="text" value={form.address_line2} onChange={(e) => update("address_line2", e.target.value)} className="acct-input" placeholder={copy.addressLine2Placeholder} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium">{copy.city}</label>
          <input type="text" value={form.city} onChange={(e) => update("city", e.target.value)} className="acct-input" required />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">{copy.state}</label>
          <input type="text" value={form.state} onChange={(e) => update("state", e.target.value)} className="acct-input" required />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">{copy.phone}</label>
          <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="acct-input" placeholder={copy.phonePlaceholder} />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">{copy.landmark}</label>
        <input type="text" value={form.landmark} onChange={(e) => update("landmark", e.target.value)} className="acct-input" placeholder={copy.landmarkPlaceholder} />
      </div>

      <button type="submit" disabled={loading} className="acct-button-primary rounded-xl">
        <ButtonPendingContent pending={loading} pendingLabel={copy.saving} spinnerLabel={copy.saving}>
          {copy.save}
        </ButtonPendingContent>
      </button>
    </form>
  );
}
