"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { submitLogisticsBookingAction, type BookingFormState } from "@/app/actions/logistics-booking";
import type { LogisticsZone } from "@/lib/logistics/types";
import type { LogisticsServiceType, LogisticsUrgency } from "@/lib/logistics/types";
const initial: BookingFormState | null = null;

const services: { value: LogisticsServiceType; label: string; hint: string }[] = [
  { value: "same_day", label: "Same-day", hint: "Urban rush with priority handling" },
  { value: "scheduled", label: "Scheduled", hint: "Pick a window that fits your day" },
  { value: "dispatch", label: "Dispatch / ops", hint: "Controlled lanes for teams" },
  { value: "inter_city", label: "Inter-city", hint: "Cross-city with governed pricing" },
  { value: "business_route", label: "Business route", hint: "Repeat lanes for B2B" },
];

const urgencies: { value: LogisticsUrgency; label: string }[] = [
  { value: "standard", label: "Standard" },
  { value: "priority", label: "Priority" },
  { value: "rush", label: "Rush" },
];

export default function BookRequestForm({
  zones,
  defaultMode,
}: {
  zones: LogisticsZone[];
  defaultMode: "quote" | "book";
}) {
  const [state, action, pending] = useActionState(submitLogisticsBookingAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const toastRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      toastRef.current?.focus();
    }
  }, [state]);

  return (
    <div className="space-y-8">
      {state?.ok ? (
        <div
          ref={toastRef}
          tabIndex={-1}
          role="status"
          className="rounded-[1.5rem] border border-emerald-500/35 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100 outline-none"
        >
          <p className="font-semibold text-white">Request received</p>
          <p className="mt-2 leading-relaxed">{state.message}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={state.trackingUrl}
              className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#170f12]"
            >
              Open tracking
            </Link>
            <Link
              href="/book"
              className="inline-flex rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white/90"
            >
              Submit another
            </Link>
          </div>
        </div>
      ) : null}

      {state && !state.ok ? (
        <div className="rounded-[1.5rem] border border-red-500/35 bg-red-500/10 px-5 py-4 text-sm text-red-100" role="alert">
          {state.error}
        </div>
      ) : null}

      <form ref={formRef} action={action} className="space-y-10">
        <input type="hidden" name="mode" value={defaultMode} />

        <section className="rounded-[1.75rem] border border-[var(--logistics-line)] bg-[var(--logistics-panel)] p-5 shadow-[var(--logistics-shadow)] sm:p-7">
          <h2 className="text-lg font-semibold text-white">Service</h2>
          <p className="mt-1 text-sm text-[var(--logistics-muted)]">
            Pick how fast you need this to move. Pricing updates instantly from your selections.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--logistics-muted)]">Zone</span>
              <select
                name="zoneKey"
                required
                className="rounded-2xl border border-[var(--logistics-line)] bg-black/30 px-4 py-3 text-white"
                defaultValue={zones[0]?.key || ""}
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.key}>
                    {z.name} — typical {z.etaHoursMin}–{z.etaHoursMax}h
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--logistics-muted)]">Speed</span>
              <select name="urgency" required className="rounded-2xl border border-[var(--logistics-line)] bg-black/30 px-4 py-3 text-white">
                {urgencies.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <fieldset className="mt-5 space-y-3">
            <legend className="text-sm text-[var(--logistics-muted)]">Delivery product</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {services.map((s) => (
                <label
                  key={s.value}
                  className="flex cursor-pointer flex-col gap-1 rounded-2xl border border-[var(--logistics-line)] bg-white/[0.03] p-4 has-[:checked]:border-[var(--logistics-line-strong)] has-[:checked]:bg-[rgba(215,117,57,0.08)]"
                >
                  <span className="flex items-center gap-2">
                    <input type="radio" name="serviceType" value={s.value} required defaultChecked={s.value === "scheduled"} />
                    <span className="font-medium text-white">{s.label}</span>
                  </span>
                  <span className="pl-6 text-xs text-[var(--logistics-muted)]">{s.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        <section className="rounded-[1.75rem] border border-[var(--logistics-line)] bg-[var(--logistics-panel)] p-5 shadow-[var(--logistics-shadow)] sm:p-7">
          <h2 className="text-lg font-semibold text-white">People</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--logistics-muted)]">Sender name</span>
              <input name="senderName" required className="rounded-2xl border border-[var(--logistics-line)] bg-black/30 px-4 py-3 text-white" />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--logistics-muted)]">Sender phone</span>
              <input
                name="senderPhone"
                type="tel"
                required
                inputMode="tel"
                autoComplete="tel"
                placeholder="+234…"
                className="rounded-2xl border border-[var(--logistics-line)] bg-black/30 px-4 py-3 text-white"
              />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="text-[var(--logistics-muted)]">Sender email (optional)</span>
              <input
                name="senderEmail"
                type="email"
                autoComplete="email"
                className="rounded-2xl border border-[var(--logistics-line)] bg-black/30 px-4 py-3 text-white"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--logistics-muted)]">Recipient name</span>
              <input name="recipientName" required className="rounded-2xl border border-[var(--logistics-line)] bg-black/30 px-4 py-3 text-white" />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--logistics-muted)]">Recipient phone</span>
              <input
                name="recipientPhone"
                type="tel"
                required
                inputMode="tel"
                className="rounded-2xl border border-[var(--logistics-line)] bg-black/30 px-4 py-3 text-white"
              />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="text-[var(--logistics-muted)]">Recipient email (optional)</span>
              <input name="recipientEmail" type="email" className="rounded-2xl border border-[var(--logistics-line)] bg-black/30 px-4 py-3 text-white" />
            </label>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-[var(--logistics-line)] bg-[var(--logistics-panel)] p-5 shadow-[var(--logistics-shadow)] sm:p-7">
          <h2 className="text-lg font-semibold text-white">Pickup</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="text-[var(--logistics-muted)]">Street / building</span>
              <input name="pickupLine1" required className="rounded-2xl border border-[var(--logistics-line)] bg-black/30 px-4 py-3 text-white" />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--logistics-muted)]">City</span>
              <input name="pickupCity" required className="rounded-2xl border border-[var(--logistics-line)] bg-black/30 px-4 py-3 text-white" />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--logistics-muted)]">State / region</span>
              <input name="pickupRegion" required className="rounded-2xl border border-[var(--logistics-line)] bg-black/30 px-4 py-3 text-white" />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="text-[var(--logistics-muted)]">Landmark (optional)</span>
              <input name="pickupLandmark" className="rounded-2xl border border-[var(--logistics-line)] bg-black/30 px-4 py-3 text-white" />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="text-[var(--logistics-muted)]">Instructions (optional)</span>
              <textarea name="pickupInstructions" rows={2} className="rounded-2xl border border-[var(--logistics-line)] bg-black/30 px-4 py-3 text-white" />
            </label>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-[var(--logistics-line)] bg-[var(--logistics-panel)] p-5 shadow-[var(--logistics-shadow)] sm:p-7">
          <h2 className="text-lg font-semibold text-white">Delivery</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="text-[var(--logistics-muted)]">Street / building</span>
              <input name="dropLine1" required className="rounded-2xl border border-[var(--logistics-line)] bg-black/30 px-4 py-3 text-white" />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--logistics-muted)]">City</span>
              <input name="dropCity" required className="rounded-2xl border border-[var(--logistics-line)] bg-black/30 px-4 py-3 text-white" />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--logistics-muted)]">State / region</span>
              <input name="dropRegion" required className="rounded-2xl border border-[var(--logistics-line)] bg-black/30 px-4 py-3 text-white" />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="text-[var(--logistics-muted)]">Landmark (optional)</span>
              <input name="dropLandmark" className="rounded-2xl border border-[var(--logistics-line)] bg-black/30 px-4 py-3 text-white" />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="text-[var(--logistics-muted)]">Instructions (optional)</span>
              <textarea name="dropInstructions" rows={2} className="rounded-2xl border border-[var(--logistics-line)] bg-black/30 px-4 py-3 text-white" />
            </label>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-[var(--logistics-line)] bg-[var(--logistics-panel)] p-5 shadow-[var(--logistics-shadow)] sm:p-7">
          <h2 className="text-lg font-semibold text-white">Parcel</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--logistics-muted)]">Type</span>
              <input name="parcelType" defaultValue="Parcel" className="rounded-2xl border border-[var(--logistics-line)] bg-black/30 px-4 py-3 text-white" />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--logistics-muted)]">Weight (kg)</span>
              <input name="weightKg" type="number" min={0} step={0.1} defaultValue={1} className="rounded-2xl border border-[var(--logistics-line)] bg-black/30 px-4 py-3 text-white" />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--logistics-muted)]">Size</span>
              <select name="sizeTier" className="rounded-2xl border border-[var(--logistics-line)] bg-black/30 px-4 py-3 text-white">
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="oversize">Oversize</option>
              </select>
            </label>
            <label className="flex items-center gap-3 text-sm text-white">
              <input type="checkbox" name="fragile" className="h-4 w-4 rounded border-[var(--logistics-line)]" />
              Fragile handling
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="text-[var(--logistics-muted)]">Description (optional)</span>
              <textarea name="parcelDescription" rows={2} className="rounded-2xl border border-[var(--logistics-line)] bg-black/30 px-4 py-3 text-white" />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="text-[var(--logistics-muted)]">Preferred pickup time (optional)</span>
              <input name="scheduledPickupAt" type="datetime-local" className="rounded-2xl border border-[var(--logistics-line)] bg-black/30 px-4 py-3 text-white" />
            </label>
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--logistics-muted)]">
            Indicative pricing is calculated from your zone and parcel profile. Final quotes may be confirmed by dispatch.
            {defaultMode === "book"
              ? " Bookings enter the live queue; payment may be confirmed offline or via a link from our team."
              : null}
          </p>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex justify-center rounded-full bg-[linear-gradient(135deg,#f6e2d0_0%,var(--logistics-accent)_52%,#9f8b7d_100%)] px-8 py-3 text-sm font-semibold text-[#170f12] shadow-[0_18px_44px_rgba(215,117,57,0.24)] disabled:opacity-60"
          >
            {pending ? "Submitting…" : defaultMode === "quote" ? "Request quote" : "Book delivery"}
          </button>
        </div>
      </form>
    </div>
  );
}
