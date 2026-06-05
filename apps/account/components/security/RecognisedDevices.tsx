"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Laptop, ShieldCheck, X } from "lucide-react";
import { ButtonPendingContent } from "@henryco/ui";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";

export type RecognisedDeviceItem = {
  deviceId: string;
  label: string;
  locationLabel: string | null;
  lastSeenLabel: string | null;
  trusted: boolean;
  current: boolean;
};

/**
 * The user's recognised devices, with per-device "trust" and "remove"
 * controls. Removing a device makes it re-verify (and re-alert) on its next
 * sign-in. All actions are authenticated, scoped to the caller's own devices.
 */
export default function RecognisedDevices({ devices }: { devices: RecognisedDeviceItem[] }) {
  const locale = useHenryCoLocale();
  const t = (s: string) => translateSurfaceLabel(locale, s);
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (devices.length === 0) {
    return (
      <p className="text-sm leading-7 text-[var(--acct-muted)]">
        {t("No recognised devices yet. The next time you sign in, this device will be remembered.")}
      </p>
    );
  }

  const act = async (deviceId: string, action: "trust" | "revoke") => {
    if (busy) return;
    setBusy(`${deviceId}:${action}`);
    setError(null);
    try {
      const res = await fetch("/api/security/device", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ action, deviceId }),
      });
      if (!res.ok) throw new Error("device action failed");
      router.refresh();
    } catch {
      setError(t("We couldn't update this device. Please try again."));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      {error ? (
        <div className="mb-3 rounded-xl bg-[var(--acct-red-soft)] px-4 py-3 text-sm text-[var(--acct-red)]">
          {error}
        </div>
      ) : null}
      <ul className="flex flex-col gap-3">
        {devices.map((device) => (
          <li
            key={device.deviceId}
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-surface)] p-4"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--acct-soft,rgba(10,16,24,0.05))]">
              <Laptop size={18} className="text-[var(--acct-ink)]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-[var(--acct-ink)]">{device.label}</p>
                {device.current ? (
                  <span className="rounded-full bg-[var(--acct-soft,rgba(10,16,24,0.06))] px-2 py-0.5 text-[0.65rem] font-semibold text-[var(--acct-muted)]">
                    {t("This device")}
                  </span>
                ) : null}
                {device.trusted ? (
                  <span className="inline-flex items-center gap-1 text-[0.65rem] font-semibold text-[var(--acct-ink)]">
                    <ShieldCheck size={12} /> {t("Trusted")}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs leading-6 text-[var(--acct-muted)]">
                {[device.locationLabel, device.lastSeenLabel ? `${t("Last seen")} ${device.lastSeenLabel}` : null]
                  .filter(Boolean)
                  .join(" · ") || t("Recently active")}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {!device.trusted ? (
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void act(device.deviceId, "trust")}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[var(--acct-line)] bg-[var(--acct-surface)] px-3 text-sm font-semibold text-[var(--acct-ink)] transition-colors hover:bg-[var(--acct-soft,rgba(10,16,24,0.04))] disabled:opacity-60"
                >
                  <ButtonPendingContent
                    pending={busy === `${device.deviceId}:trust`}
                    pendingLabel={t("Trusting…")}
                    spinnerLabel={t("Trusting…")}
                    textClassName="inline-flex items-center gap-1.5"
                  >
                    <>
                      <Check size={14} /> {t("Trust")}
                    </>
                  </ButtonPendingContent>
                </button>
              ) : null}
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void act(device.deviceId, "revoke")}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[var(--acct-red)] bg-[var(--acct-surface)] px-3 text-sm font-semibold text-[var(--acct-red)] transition-colors hover:bg-[var(--acct-red-soft)] disabled:opacity-60"
              >
                <ButtonPendingContent
                  pending={busy === `${device.deviceId}:revoke`}
                  pendingLabel={t("Removing…")}
                  spinnerLabel={t("Removing…")}
                  textClassName="inline-flex items-center gap-1.5"
                >
                  <>
                    <X size={14} /> {t("Remove")}
                  </>
                </ButtonPendingContent>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
