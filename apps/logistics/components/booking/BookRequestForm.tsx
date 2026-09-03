"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { ButtonPendingContent } from "@henryco/ui";
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

const controlClassName =
  "rounded-2xl border border-[var(--logistics-line)] bg-black/30 px-4 py-3 text-base text-white outline-none transition focus:border-[var(--logistics-line-strong)] focus:ring-2 focus:ring-[rgba(215,117,57,0.18)] sm:text-sm";

export default function BookRequestForm({
  zones,
  defaultMode,
  savedAddresses,
}: {
  zones: LogisticsZone[];
  defaultMode: "quote" | "book";
  savedAddresses?: Array<{
    id: string;
    label: string;
    fullAddress: string;
    line1: string;
    city: string;
    region: string;
  }>;
}) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
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
          <p className="font-semibold text-white">{t("Request received")}</p>
          <p className="mt-2 leading-relaxed">{state.message}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={state.trackingUrl}
              className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#170f12]"
            >
              {t("Open tracking")}
            </Link>
            <Link
              href={defaultMode === "quote" ? "/quote" : "/book"}
              className="inline-flex rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white/90"
            >
              {t("Submit another")}
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
          <h2 className="text-lg font-semibold text-white">{t("Service")}</h2>
          <p className="mt-1 text-sm text-[var(--logistics-muted)]">
            {t("Pick how fast you need this to move. Pricing updates as you change your selections.")}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--logistics-muted)]">{t("Zone")}</span>
              <select
                name="zoneKey"
                required
                className={controlClassName}
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
              <span className="text-[var(--logistics-muted)]">{t("Speed")}</span>
              <select name="urgency" required className={controlClassName}>
                {urgencies.map((u) => (
                  <option key={u.value} value={u.value}>
                    {t(u.label)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <fieldset className="mt-5 space-y-3">
            <legend className="text-sm text-[var(--logistics-muted)]">{t("Delivery product")}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {services.map((s) => (
                <label
                  key={s.value}
                  className="flex cursor-pointer flex-col gap-1 rounded-2xl border border-[var(--logistics-line)] bg-white/[0.03] p-4 has-[:checked]:border-[var(--logistics-line-strong)] has-[:checked]:bg-[rgba(215,117,57,0.08)]"
                >
                  <span className="flex items-center gap-2">
                    <input type="radio" name="serviceType" value={s.value} required defaultChecked={s.value === "scheduled"} />
                    <span className="font-medium text-white">{t(s.label)}</span>
                  </span>
                  <span className="pl-6 text-xs text-[var(--logistics-muted)]">{t(s.hint)}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        <section className="rounded-[1.75rem] border border-[var(--logistics-line)] bg-[var(--logistics-panel)] p-5 shadow-[var(--logistics-shadow)] sm:p-7">
          <h2 className="text-lg font-semibold text-white">{t("People")}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--logistics-muted)]">{t("Sender name")}</span>
              <input name="senderName" required className={controlClassName} />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--logistics-muted)]">{t("Sender phone")}</span>
              <input
                name="senderPhone"
                type="tel"
                required
                inputMode="tel"
                autoComplete="tel"
                placeholder="+234…"
                className={controlClassName}
              />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="text-[var(--logistics-muted)]">{t("Sender email (optional)")}</span>
              <input
                name="senderEmail"
                type="email"
                autoComplete="email"
                className={controlClassName}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--logistics-muted)]">{t("Recipient name")}</span>
              <input name="recipientName" required className={controlClassName} />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--logistics-muted)]">{t("Recipient phone")}</span>
              <input
                name="recipientPhone"
                type="tel"
                required
                inputMode="tel"
                className={controlClassName}
              />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="text-[var(--logistics-muted)]">{t("Recipient email (optional)")}</span>
              <input name="recipientEmail" type="email" className={controlClassName} />
            </label>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-[var(--logistics-line)] bg-[var(--logistics-panel)] p-5 shadow-[var(--logistics-shadow)] sm:p-7">
          <h2 className="text-lg font-semibold text-white">{t("Pickup")}</h2>
          <p className="mt-1 text-sm text-[var(--logistics-muted)]">
            {t("Where the rider should collect the parcel.")}
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {(savedAddresses ?? []).length > 0 ? (
              <label className="grid gap-1 text-sm sm:col-span-2">
                <span className="text-[var(--logistics-muted)]">{t("Use saved address (optional)")}</span>
                <select
                  className={controlClassName}
                  onChange={(event) => {
                    const selected = (savedAddresses ?? []).find((item) => item.id === event.target.value);
                    if (!selected) return;
                    const form = event.currentTarget.form;
                    if (!form) return;
                    const pickupLine1 = form.elements.namedItem("pickupLine1") as HTMLInputElement | null;
                    const pickupCity = form.elements.namedItem("pickupCity") as HTMLInputElement | null;
                    const pickupRegion = form.elements.namedItem("pickupRegion") as HTMLInputElement | null;
                    if (pickupLine1) pickupLine1.value = selected.line1;
                    if (pickupCity) pickupCity.value = selected.city;
                    if (pickupRegion) pickupRegion.value = selected.region;
                  }}
                  defaultValue=""
                >
                  <option value="">{t("Select saved pickup address")}</option>
                  {(savedAddresses ?? []).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="text-[var(--logistics-muted)]">{t("Street / building")}</span>
              <input name="pickupLine1" required className={controlClassName} />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--logistics-muted)]">{t("City")}</span>
              <input name="pickupCity" required className={controlClassName} />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--logistics-muted)]">{t("State / region")}</span>
              <input name="pickupRegion" required className={controlClassName} />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="text-[var(--logistics-muted)]">{t("Landmark (optional)")}</span>
              <input name="pickupLandmark" className={controlClassName} />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="text-[var(--logistics-muted)]">{t("Instructions (optional)")}</span>
              <textarea name="pickupInstructions" rows={2} className={controlClassName} />
            </label>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-[var(--logistics-line)] bg-[var(--logistics-panel)] p-5 shadow-[var(--logistics-shadow)] sm:p-7">
          <h2 className="text-lg font-semibold text-white">{t("Receiving address")}</h2>
          <p className="mt-1 text-sm text-[var(--logistics-muted)]">
            {t("Where the parcel should be handed over to the recipient.")}
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {(savedAddresses ?? []).length > 0 ? (
              <label className="grid gap-1 text-sm sm:col-span-2">
                <span className="text-[var(--logistics-muted)]">{t("Use saved address (optional)")}</span>
                <select
                  className={controlClassName}
                  onChange={(event) => {
                    const selected = (savedAddresses ?? []).find((item) => item.id === event.target.value);
                    if (!selected) return;
                    const form = event.currentTarget.form;
                    if (!form) return;
                    const dropLine1 = form.elements.namedItem("dropLine1") as HTMLInputElement | null;
                    const dropCity = form.elements.namedItem("dropCity") as HTMLInputElement | null;
                    const dropRegion = form.elements.namedItem("dropRegion") as HTMLInputElement | null;
                    if (dropLine1) dropLine1.value = selected.line1;
                    if (dropCity) dropCity.value = selected.city;
                    if (dropRegion) dropRegion.value = selected.region;
                  }}
                  defaultValue=""
                >
                  <option value="">{t("Select saved receiving address")}</option>
                  {(savedAddresses ?? []).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="text-[var(--logistics-muted)]">{t("Street / building")}</span>
              <input name="dropLine1" required className={controlClassName} />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--logistics-muted)]">{t("City")}</span>
              <input name="dropCity" required className={controlClassName} />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--logistics-muted)]">{t("State / region")}</span>
              <input name="dropRegion" required className={controlClassName} />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="text-[var(--logistics-muted)]">{t("Landmark (optional)")}</span>
              <input name="dropLandmark" className={controlClassName} />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="text-[var(--logistics-muted)]">{t("Instructions (optional)")}</span>
              <textarea name="dropInstructions" rows={2} className={controlClassName} />
            </label>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-[var(--logistics-line)] bg-[var(--logistics-panel)] p-5 shadow-[var(--logistics-shadow)] sm:p-7">
          <h2 className="text-lg font-semibold text-white">{t("Parcel")}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--logistics-muted)]">{t("Type")}</span>
              <input name="parcelType" defaultValue={t("Parcel")} className={controlClassName} />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--logistics-muted)]">{t("Weight (kg)")}</span>
              <input name="weightKg" type="number" min={0} step={0.1} defaultValue={1} className={controlClassName} />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--logistics-muted)]">{t("Size")}</span>
              <select name="sizeTier" className={controlClassName}>
                <option value="small">{t("Small")}</option>
                <option value="medium">{t("Medium")}</option>
                <option value="large">{t("Large")}</option>
                <option value="oversize">{t("Oversize")}</option>
              </select>
            </label>
            <label className="flex items-center gap-3 text-sm text-white">
              <input type="checkbox" name="fragile" className="h-4 w-4 rounded border-[var(--logistics-line)]" />
              {t("Fragile handling")}
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="text-[var(--logistics-muted)]">{t("Description (optional)")}</span>
              <textarea name="parcelDescription" rows={2} className={controlClassName} />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="text-[var(--logistics-muted)]">{t("Preferred pickup time (optional)")}</span>
              <input name="scheduledPickupAt" type="datetime-local" className={controlClassName} />
            </label>
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--logistics-muted)]">
            {t("Indicative pricing is calculated from your zone and parcel profile. Final pricing is confirmed before dispatch.")}
            {defaultMode === "book"
              ? " " + t("Once booked, you receive a tracking code. Payment instructions follow by SMS or email if payment is due.")
              : null}
          </p>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-w-[12rem] justify-center rounded-full bg-[linear-gradient(135deg,#f6e2d0_0%,var(--logistics-accent)_52%,#9f8b7d_100%)] px-8 py-3 text-sm font-semibold text-[#170f12] shadow-[0_18px_44px_rgba(215,117,57,0.24)] disabled:cursor-wait disabled:opacity-70"
          >
            <ButtonPendingContent
              pending={pending}
              pendingLabel={defaultMode === "quote" ? t("Requesting quote...") : t("Booking delivery...")}
              spinnerLabel={defaultMode === "quote" ? t("Requesting quote") : t("Booking delivery")}
              className="gap-2"
            >
              {defaultMode === "quote" ? t("Request quote") : t("Book delivery")}
            </ButtonPendingContent>
          </button>
        </div>
      </form>
    </div>
  );
}
