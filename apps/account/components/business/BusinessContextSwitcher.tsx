"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { fetchWithSensitiveAction } from "@henryco/auth/client/sensitive-action-modal";

type SwitcherBusiness = { id: string; slug: string; name: string };

export type ContextSwitcherCopy = {
  actingAsPersonal: string;
  actingAsBusiness: string; // {name}
  personal: string;
  switchLabel: string;
  error: string;
};

/**
 * V3-57 — acting-context switcher. Always visible so a member knows which
 * identity is acting. Posts through fetchWithSensitiveAction so the route's
 * reauth step-up is handled before the switch commits.
 */
export default function BusinessContextSwitcher({
  businesses,
  activeBusinessId,
  copy,
}: {
  businesses: SwitcherBusiness[];
  activeBusinessId: string | null;
  copy: ContextSwitcherCopy;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const active = businesses.find((b) => b.id === activeBusinessId) ?? null;
  const label = active
    ? copy.actingAsBusiness.replace("{name}", active.name)
    : copy.actingAsPersonal;

  async function onSelect(value: string) {
    setError(null);
    const body = value === "personal" ? { target: "personal" } : { businessId: value };
    const res = await fetchWithSensitiveAction("/api/business/context", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      setError(copy.error);
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-2 text-sm">
        <span className="text-[color:var(--hc-text-muted,#6b7280)]">{label}</span>
        <select
          aria-label={copy.switchLabel}
          disabled={pending}
          value={activeBusinessId ?? "personal"}
          onChange={(e) => onSelect(e.target.value)}
          className="rounded-md border border-[color:var(--hc-border,#d1d5db)] bg-[color:var(--hc-surface,#ffffff)] px-2 py-1 text-sm text-[color:var(--hc-text,#111827)]"
        >
          <option value="personal">{copy.personal}</option>
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </label>
      <p aria-live="polite" className="min-h-[1rem] text-xs text-[color:var(--hc-danger,#b91c1c)]">
        {error ?? ""}
      </p>
    </div>
  );
}
