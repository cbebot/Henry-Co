"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ButtonPendingContent, HenryCoActivityIndicator } from "@henryco/ui";
import { Camera } from "lucide-react";
import UserAvatar from "@/components/layout/UserAvatar";

const COUNTRIES = [
  { code: "NG", name: "Nigeria" },
  { code: "GH", name: "Ghana" },
  { code: "KE", name: "Kenya" },
  { code: "ZA", name: "South Africa" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "ig", label: "Igbo" },
  { value: "yo", label: "Yoruba" },
  { value: "ha", label: "Hausa" },
];

const CONTACT_PREFS = [
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "phone", label: "Phone" },
  { value: "in_app", label: "In-app" },
];

type Props = {
  profile: Record<string, string | null> | null;
  email: string | null;
};

export default function ProfileForm({ profile, email }: Props) {
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [country, setCountry] = useState(profile?.country || "NG");
  const [contactPref, setContactPref] = useState(profile?.contact_preference || "email");
  const [language, setLanguage] = useState(profile?.language || "en");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    try {
      const form = new FormData();
      form.append("avatar", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setAvatarUrl(data.avatar_url);
      setMessage({ type: "success", text: "Photo updated" });
      router.refresh();
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Upload failed" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: phone.trim(),
          country,
          contact_preference: contactPref,
          language,
        }),
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
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
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

      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative">
          <UserAvatar
            name={fullName || email || "Account"}
            src={avatarUrl}
            size={80}
            roundedClassName="rounded-2xl"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--acct-gold)] text-white shadow-lg transition-transform hover:scale-110"
          >
            {uploading ? <HenryCoActivityIndicator size="sm" label="Uploading photo" /> : <Camera size={14} />}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--acct-ink)]">Profile photo</p>
          <p className="text-xs text-[var(--acct-muted)]">JPG, PNG or WebP. Max 5 MB.</p>
        </div>
      </div>

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

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Country</label>
          <select value={country} onChange={(e) => setCountry(e.target.value)} className="acct-select">
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
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
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Language</label>
        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="acct-select">
          {LANGUAGES.map((languageOption) => (
            <option key={languageOption.value} value={languageOption.value}>
              {languageOption.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Preferred contact method</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CONTACT_PREFS.map((pref) => (
            <button
              key={pref.value}
              type="button"
              onClick={() => setContactPref(pref.value)}
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                contactPref === pref.value
                  ? "border-[var(--acct-gold)] bg-[var(--acct-gold-soft)] text-[var(--acct-gold)]"
                  : "border-[var(--acct-line)] bg-[var(--acct-bg)] text-[var(--acct-muted)] hover:border-[var(--acct-gold)]/40"
              }`}
            >
              {pref.label}
            </button>
          ))}
        </div>
      </div>

      <button type="submit" disabled={loading} className="acct-button-primary rounded-xl">
        <ButtonPendingContent pending={loading} pendingLabel="Saving profile..." spinnerLabel="Saving profile">
          Save changes
        </ButtonPendingContent>
      </button>
    </form>
  );
}
