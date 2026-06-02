import type { Metadata } from "next";
import { SecuritySettings } from "./SecuritySettings";

export const metadata: Metadata = { title: "Security — Owner CMS" };

export default function SettingsPage() {
  return (
    <div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--hc-accent-text)]">
          Settings
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--hc-ink)]">Security</h1>
        <p className="max-w-2xl text-sm leading-6 text-[var(--hc-ink-muted)]">
          Manage how you sign in to the Owner CMS. Use a strong password and add an authenticator
          app for two-factor protection.
        </p>
      </div>
      <div className="mt-8">
        <SecuritySettings />
      </div>
    </div>
  );
}
