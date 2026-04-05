"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type Props = {
  preferences: Record<string, boolean | string> | null;
};

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-[var(--acct-surface)] px-4 py-3">
      <div>
        <p className="text-sm font-medium text-[var(--acct-ink)]">{label}</p>
        <p className="text-xs text-[var(--acct-muted)]">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-[var(--acct-gold)]" : "bg-[var(--acct-line)]"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );
}

export default function PreferencesForm({ preferences }: Props) {
  const [prefs, setPrefs] = useState({
    email_marketing: preferences?.email_marketing ?? true,
    email_transactional: preferences?.email_transactional ?? true,
    email_digest: preferences?.email_digest ?? false,
    push_enabled: preferences?.push_enabled ?? true,
    whatsapp_enabled: preferences?.whatsapp_enabled ?? false,
    sms_enabled: preferences?.sms_enabled ?? false,
    notification_care: preferences?.notification_care ?? true,
    notification_marketplace: preferences?.notification_marketplace ?? true,
    notification_studio: preferences?.notification_studio ?? true,
    notification_jobs: preferences?.notification_jobs ?? true,
    notification_learn: preferences?.notification_learn ?? true,
    notification_property: preferences?.notification_property ?? true,
    notification_logistics: preferences?.notification_logistics ?? true,
    notification_wallet: preferences?.notification_wallet ?? true,
    notification_security: preferences?.notification_security ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  const update = (key: string, val: boolean) => setPrefs((p) => ({ ...p, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/preferences/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });

      if (!res.ok) throw new Error("Failed to save");
      setMessage({ type: "success", text: "Preferences saved" });
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Failed to save preferences" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
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

      <div className="rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-4">
        <p className="acct-kicker mb-3">Delivery channels</p>
        <p className="mb-3 text-xs leading-5 text-[var(--acct-muted)]">
          Turn on every channel you want to use — email, in-app, WhatsApp, and SMS can be active at the same time.
        </p>
        <div className="space-y-3">
          <Toggle
            label="Marketing emails"
            description="Promotions, new features, and offers"
            checked={prefs.email_marketing as boolean}
            onChange={(v) => update("email_marketing", v)}
          />
          <Toggle
            label="Transaction emails"
            description="Receipts, confirmations, and alerts"
            checked={prefs.email_transactional as boolean}
            onChange={(v) => update("email_transactional", v)}
          />
          <Toggle
            label="Weekly digest"
            description="A calmer summary instead of separate message noise"
            checked={prefs.email_digest as boolean}
            onChange={(v) => update("email_digest", v)}
          />
          <Toggle
            label="In-app notifications"
            description="Notification center and bell activity inside your dashboard"
            checked={prefs.push_enabled as boolean}
            onChange={(v) => update("push_enabled", v)}
          />
          <Toggle
            label="WhatsApp updates"
            description="Important delivery and project movement through WhatsApp where supported"
            checked={prefs.whatsapp_enabled as boolean}
            onChange={(v) => update("whatsapp_enabled", v)}
          />
          <Toggle
            label="SMS updates"
            description="Short urgent updates through SMS for time-sensitive flows"
            checked={prefs.sms_enabled as boolean}
            onChange={(v) => update("sms_enabled", v)}
          />
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-4">
        <p className="acct-kicker mb-3">Division sources</p>
        <div className="space-y-3">
          <Toggle
            label="Care notifications"
            description="Bookings, tracking, and service status"
            checked={prefs.notification_care as boolean}
            onChange={(v) => update("notification_care", v)}
          />
          <Toggle
            label="Marketplace notifications"
            description="Orders, seller updates, and disputes"
            checked={prefs.notification_marketplace as boolean}
            onChange={(v) => update("notification_marketplace", v)}
          />
          <Toggle
            label="Studio notifications"
            description="Proposal movement, project room updates, and payment steps"
            checked={prefs.notification_studio as boolean}
            onChange={(v) => update("notification_studio", v)}
          />
          <Toggle
            label="Jobs notifications"
            description="Application movement, recruiter updates, and alerts"
            checked={prefs.notification_jobs as boolean}
            onChange={(v) => update("notification_jobs", v)}
          />
          <Toggle
            label="Learn notifications"
            description="Course activity, progress, and certification updates"
            checked={prefs.notification_learn as boolean}
            onChange={(v) => update("notification_learn", v)}
          />
          <Toggle
            label="Property notifications"
            description="Inquiries, viewings, and listing progress"
            checked={prefs.notification_property as boolean}
            onChange={(v) => update("notification_property", v)}
          />
          <Toggle
            label="Logistics notifications"
            description="Shipment movement and delivery updates"
            checked={prefs.notification_logistics as boolean}
            onChange={(v) => update("notification_logistics", v)}
          />
          <Toggle
            label="Wallet notifications"
            description="Funding requests, balance changes, and verification alerts"
            checked={prefs.notification_wallet as boolean}
            onChange={(v) => update("notification_wallet", v)}
          />
          <Toggle
            label="Security alerts"
            description="Login attempts and sensitive account changes"
            checked={prefs.notification_security as boolean}
            onChange={(v) => update("notification_security", v)}
          />
        </div>
      </div>

      <button type="submit" disabled={loading} className="acct-button-primary rounded-xl">
        {loading ? <Loader2 size={16} className="animate-spin" /> : "Save preferences"}
      </button>
    </form>
  );
}
