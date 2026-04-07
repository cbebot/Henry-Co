/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useDeferredValue, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Building2,
  CalendarDays,
  Check,
  CreditCard,
  Home,
  Minus,
  Phone,
  Package2,
  Plus,
  Sparkles,
} from "lucide-react";
import CopyButton from "@/components/ui/CopyButton";
import PendingSubmitButton from "@/components/forms/PendingSubmitButton";
import type {
  CareBookingCatalog,
  CareFrequencyKey,
  CarePropertyType,
  CareServiceType,
  CareSizeBand,
  CareSuppliesMode,
  CareUrgencyKey,
} from "@/lib/care-catalog";
import { calculateCleaningQuote } from "@/lib/care-catalog";
import {
  formatFrequencyLabel,
  type CleaningBookingPayload,
  type CleaningCategoryKey,
} from "@/lib/care-booking-shared";

type TreatmentType = "standard" | "stain" | "deep_stain" | "delicate";

type PricingItem = {
  id: string;
  category: string;
  item_name: string;
  description: string | null;
  unit: string;
  price: number;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
};
type SavedAddressOption = {
  id: string;
  label: string;
  fullAddress: string;
  isDefault: boolean;
};

type SelectedGarmentItem = {
  pricing_id: string;
  quantity: number;
  urgent: boolean;
  treatment: TreatmentType;
};

type PaymentPlan = "book_first" | "pay_now";

const WINDOWS = [
  "8:00 AM - 10:00 AM",
  "10:00 AM - 12:00 PM",
  "12:00 PM - 2:00 PM",
  "2:00 PM - 4:00 PM",
  "4:00 PM - 6:00 PM",
] as const;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const FREQUENCIES: CareFrequencyKey[] = [
  "one_time",
  "weekly",
  "twice_weekly",
  "biweekly",
  "monthly",
  "custom",
];
const URGENCY_OPTIONS: CareUrgencyKey[] = ["standard", "express", "same_day"];
const SUPPLIES_OPTIONS: CareSuppliesMode[] = ["included", "customer_provided"];
const HOME_PROPERTY_TYPES: CarePropertyType[] = [
  "studio",
  "apartment",
  "bungalow",
  "terrace",
  "duplex",
  "detached",
];
const OFFICE_PROPERTY_TYPES: CarePropertyType[] = [
  "office_suite",
  "office_floor",
  "showroom",
  "warehouse",
  "mixed_use",
];
const SIZE_BANDS: CareSizeBand[] = ["small", "medium", "large"];
type PreferredDay = (typeof DAYS)[number];

const inputCls =
  "care-form-control h-14 min-w-0 w-full rounded-3xl border border-black/8 bg-white/88 px-4 text-base font-medium text-zinc-950 outline-none shadow-[0_10px_28px_rgba(16,19,31,0.04)] transition focus:border-[color:var(--accent)]/50 dark:border-white/10 dark:bg-white/[0.05] dark:text-white md:text-sm";
const textareaCls =
  "care-form-control min-w-0 w-full rounded-3xl border border-black/8 bg-white/88 px-4 py-3 text-base font-medium text-zinc-950 outline-none shadow-[0_10px_28px_rgba(16,19,31,0.04)] transition focus:border-[color:var(--accent)]/50 dark:border-white/10 dark:bg-white/[0.05] dark:text-white md:text-sm";
const quantityButtonCls =
  "inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white/80 text-zinc-900 transition hover:border-[color:var(--accent)]/30 hover:bg-[color:var(--accent)]/8 dark:border-white/10 dark:bg-white/[0.05] dark:text-white";
const quantityDockCls =
  "flex w-full items-center justify-between gap-3 rounded-[1.35rem] border border-black/10 bg-white/82 px-3 py-2 dark:border-white/10 dark:bg-white/[0.05]";
const quantityInputCls =
  "h-11 w-full rounded-2xl border-0 bg-transparent px-2 text-center text-lg font-semibold text-zinc-950 outline-none placeholder:text-zinc-400 dark:text-white";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatMoney(value: number | string) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

function treatmentCharge(value: TreatmentType) {
  if (value === "stain") return 500;
  if (value === "deep_stain") return 1000;
  if (value === "delicate") return 700;
  return 0;
}

function formatPropertyLabel(value: CarePropertyType) {
  return value.replaceAll("_", " ");
}

function normalizeCountInput(value: string) {
  return value.replace(/[^\d]/g, "");
}

function parseCountInput(value: string) {
  const normalized = value.trim();
  if (!normalized) return null;

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, parsed);
}

function stepCountInput(value: string, delta: number) {
  const base = parseCountInput(value) ?? 0;
  return String(Math.max(0, base + delta));
}

export default function BookPickupForm({
  pricingItems,
  catalog,
  paymentSettings,
  savedAddresses,
  defaultContact,
  action,
}: {
  pricingItems: PricingItem[];
  catalog: CareBookingCatalog;
  paymentSettings: {
    accountName?: string | null;
    accountNumber?: string | null;
    bankName?: string | null;
    currency?: string | null;
    supportEmail?: string | null;
    supportWhatsApp?: string | null;
    instructions?: string | null;
  };
  savedAddresses?: SavedAddressOption[];
  defaultContact?: {
    fullName?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [mode, setMode] = useState<"garment" | "service">("garment");
  const [search, setSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState<SelectedGarmentItem[]>([]);
  const [pickupDate, setPickupDate] = useState("");
  const [pickupSlot, setPickupSlot] = useState<string>(WINDOWS[0]);
  const [serviceCategory, setServiceCategory] = useState<CleaningCategoryKey>("home");
  const [serviceTypeKey, setServiceTypeKey] = useState("");
  const [packageSlug, setPackageSlug] = useState("");
  const [frequencyKey, setFrequencyKey] = useState<CareFrequencyKey>("one_time");
  const [urgencyKey, setUrgencyKey] = useState<CareUrgencyKey>("standard");
  const [zoneKey, setZoneKey] = useState("");
  const [propertyType, setPropertyType] = useState<CarePropertyType>("apartment");
  const [sizeBand, setSizeBand] = useState<CareSizeBand>("small");
  const [bedroomCountInput, setBedroomCountInput] = useState("2");
  const [bathroomCountInput, setBathroomCountInput] = useState("1");
  const [floorCountInput, setFloorCountInput] = useState("1");
  const [staffCountInput, setStaffCountInput] = useState("2");
  const [suppliesMode, setSuppliesMode] = useState<CareSuppliesMode>("included");
  const [addonKeys, setAddonKeys] = useState<string[]>([]);
  const [preferredDays, setPreferredDays] = useState<PreferredDay[]>([]);
  const [propertyLabel, setPropertyLabel] = useState("");
  const [siteContactName, setSiteContactName] = useState("");
  const [paymentPlan, setPaymentPlan] = useState<PaymentPlan>("book_first");
  const [selectedPickupAddressId, setSelectedPickupAddressId] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [returnAddress, setReturnAddress] = useState("");
  const [returnSameAsPickup, setReturnSameAsPickup] = useState(mode === "service");
  const deferredSearch = useDeferredValue(search);
  const addressBook = savedAddresses ?? [];
  const hasAddressBook = addressBook.length > 0;

  useEffect(() => {
    const preferred =
      addressBook.find((item) => item.isDefault) ??
      addressBook[0] ??
      null;
    if (!preferred) return;
    setSelectedPickupAddressId(preferred.id);
    setPickupAddress(preferred.fullAddress);
    setReturnAddress((current) => current || preferred.fullAddress);
  }, [addressBook]);

  useEffect(() => {
    if (mode === "service") {
      setReturnSameAsPickup(true);
    }
  }, [mode]);

  const activePricing = useMemo(
    () => pricingItems.filter((item) => item.is_active),
    [pricingItems]
  );

  const pricingMap = useMemo(
    () => new Map(activePricing.map((item) => [item.id, item])),
    [activePricing]
  );

  const serviceCategories = useMemo(
    () =>
      catalog.categories.filter(
        (item) => item.is_active && item.key !== "garment"
      ) as Array<(typeof catalog.categories)[number] & { key: CleaningCategoryKey }>,
    [catalog]
  );

  const filteredGarments = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return activePricing.filter((item) =>
      !q
        ? true
        : JSON.stringify([item.category, item.item_name, item.description])
            .toLowerCase()
            .includes(q)
    );
  }, [activePricing, deferredSearch]);

  const garmentEstimate = useMemo(
    () =>
      selectedItems.reduce(
        (totals, item) => {
          const pricing = pricingMap.get(item.pricing_id);
          if (!pricing) return totals;
          const base = Number(pricing.price || 0) * item.quantity;
          const urgent = item.urgent ? Math.round(base * 0.2) : 0;
          const treatment = treatmentCharge(item.treatment) * item.quantity;
          return {
            subtotal: totals.subtotal + base,
            urgent: totals.urgent + urgent,
            treatment: totals.treatment + treatment,
            total: totals.total + base + urgent + treatment,
          };
        },
        { subtotal: 0, urgent: 0, treatment: 0, total: 0 }
      ),
    [pricingMap, selectedItems]
  );

  const serviceTypes = useMemo(
    () =>
      catalog.serviceTypes.filter(
        (item) => item.category_key === serviceCategory && item.is_active
      ),
    [catalog.serviceTypes, serviceCategory]
  );
  const packages = useMemo(
    () =>
      catalog.packages.filter(
        (item) =>
          item.category_key === serviceCategory &&
          item.is_active &&
          (!serviceTypeKey || item.service_type_key === serviceTypeKey)
      ),
    [catalog.packages, serviceCategory, serviceTypeKey]
  );
  const addOns = useMemo(
    () =>
      catalog.addOns.filter(
        (item) => item.category_key === serviceCategory && item.is_active
      ),
    [catalog.addOns, serviceCategory]
  );
  const zoneOptions = useMemo(
    () => catalog.zones.filter((item) => item.is_active),
    [catalog.zones]
  );
  const selectedServiceType = useMemo(
    () => serviceTypes.find((item) => item.key === serviceTypeKey) ?? null,
    [serviceTypeKey, serviceTypes]
  );
  const selectedPackage = useMemo(
    () => packages.find((item) => item.slug === packageSlug) ?? null,
    [packageSlug, packages]
  );
  const selectedZone = useMemo(
    () => zoneOptions.find((item) => item.key === zoneKey) ?? null,
    [zoneKey, zoneOptions]
  );
  const allowedFrequencies = useMemo<CareFrequencyKey[]>(
    () =>
      selectedServiceType?.is_recurring_eligible
        ? FREQUENCIES
        : ["one_time", "custom"],
    [selectedServiceType]
  );
  const propertyOptions =
    serviceCategory === "office" ? OFFICE_PROPERTY_TYPES : HOME_PROPERTY_TYPES;

  useEffect(() => {
    if (!serviceCategories.some((item) => item.key === serviceCategory)) {
      setServiceCategory(serviceCategories[0]?.key ?? "home");
    }
  }, [serviceCategories, serviceCategory]);

  useEffect(() => {
    if (!serviceTypes.some((item) => item.key === serviceTypeKey)) {
      setServiceTypeKey(serviceTypes[0]?.key ?? "");
    }
  }, [serviceTypeKey, serviceTypes]);

  useEffect(() => {
    if (!packages.some((item) => item.slug === packageSlug)) {
      setPackageSlug(packages[0]?.slug ?? "");
    }
  }, [packageSlug, packages]);

  useEffect(() => {
    if (!zoneOptions.some((item) => item.key === zoneKey)) {
      setZoneKey(zoneOptions[0]?.key ?? "");
    }
  }, [zoneKey, zoneOptions]);

  useEffect(() => {
    if (serviceCategory === "office") {
      setPropertyType((current) =>
        OFFICE_PROPERTY_TYPES.includes(current) ? current : "office_suite"
      );
    } else {
      setPropertyType((current) =>
        HOME_PROPERTY_TYPES.includes(current) ? current : "apartment"
      );
    }
  }, [serviceCategory]);

  useEffect(() => {
    setAddonKeys((current) =>
      current.filter((key) => addOns.some((item) => item.key === key))
    );
  }, [addOns]);

  useEffect(() => {
    setPreferredDays((current) =>
      frequencyKey === "one_time" ? [] : current.filter((day) => DAYS.includes(day))
    );
  }, [frequencyKey]);

  useEffect(() => {
    if (!allowedFrequencies.includes(frequencyKey)) {
      setFrequencyKey(selectedPackage?.default_frequency ?? "one_time");
    }
  }, [allowedFrequencies, frequencyKey, selectedPackage]);

  useEffect(() => {
    if (selectedPackage) {
      setFrequencyKey(selectedPackage.default_frequency);
      setStaffCountInput(String(selectedPackage.staff_count));
      return;
    }

    if (selectedServiceType) {
      setStaffCountInput(String(selectedServiceType.default_staff_count));
    }
  }, [selectedPackage, selectedServiceType]);

  const servicePayload = useMemo<CleaningBookingPayload>(
    () => ({
      categoryKey: serviceCategory,
      serviceTypeKey,
      packageSlug: packageSlug || null,
      frequencyKey,
      urgencyKey,
      zoneKey: zoneKey || null,
      propertyType,
      sizeBand: serviceCategory === "office" ? sizeBand : null,
      bedroomCount:
        serviceCategory === "home" ? parseCountInput(bedroomCountInput) : null,
      bathroomCount:
        serviceCategory === "home" ? parseCountInput(bathroomCountInput) : null,
      floorCount: parseCountInput(floorCountInput),
      staffCount: parseCountInput(staffCountInput),
      suppliesMode,
      addonKeys,
      preferredDays: frequencyKey === "one_time" ? [] : preferredDays,
      preferredStartDate: pickupDate || null,
      serviceWindow: pickupSlot || null,
      propertyLabel: propertyLabel.trim() || null,
      siteContactName: siteContactName.trim() || null,
    }),
    [
      addonKeys,
      bathroomCountInput,
      bedroomCountInput,
      floorCountInput,
      frequencyKey,
      packageSlug,
      pickupDate,
      pickupSlot,
      preferredDays,
      propertyLabel,
      propertyType,
      serviceCategory,
      serviceTypeKey,
      siteContactName,
      sizeBand,
      staffCountInput,
      suppliesMode,
      urgencyKey,
      zoneKey,
    ]
  );

  const serviceQuote = useMemo(() => {
    if (!serviceTypeKey) return null;
    return calculateCleaningQuote(
      {
        categoryKey: servicePayload.categoryKey,
        serviceTypeKey: servicePayload.serviceTypeKey,
        packageSlug: servicePayload.packageSlug,
        zoneKey: servicePayload.zoneKey,
        frequencyKey: servicePayload.frequencyKey,
        urgencyKey: servicePayload.urgencyKey,
        propertyType: servicePayload.propertyType,
        sizeBand: servicePayload.sizeBand,
        bedroomCount: servicePayload.bedroomCount,
        bathroomCount: servicePayload.bathroomCount,
        floorCount: servicePayload.floorCount,
        staffCount: servicePayload.staffCount,
        suppliesMode: servicePayload.suppliesMode,
        addonKeys: servicePayload.addonKeys,
      },
      catalog
    );
  }, [catalog, servicePayload, serviceTypeKey]);

  const garmentPayloadJson = useMemo(
    () => JSON.stringify(selectedItems),
    [selectedItems]
  );
  const servicePayloadJson = useMemo(
    () => JSON.stringify(servicePayload),
    [servicePayload]
  );

  function setGarmentQuantity(pricingId: string, nextQuantity: number) {
    setSelectedItems((current) => {
      if (nextQuantity <= 0) {
        return current.filter((item) => item.pricing_id !== pricingId);
      }

      const existing = current.find((item) => item.pricing_id === pricingId);
      if (!existing) {
        return [
          ...current,
          {
            pricing_id: pricingId,
            quantity: nextQuantity,
            urgent: false,
            treatment: "standard",
          },
        ];
      }

      return current.map((item) =>
        item.pricing_id === pricingId
          ? { ...item, quantity: nextQuantity }
          : item
      );
    });
  }

  function updateGarmentItem(
    pricingId: string,
    patch: Partial<SelectedGarmentItem>
  ) {
    setSelectedItems((current) =>
      current.map((item) =>
        item.pricing_id === pricingId ? { ...item, ...patch } : item
      )
    );
  }

  function toggleAddon(key: string) {
    setAddonKeys((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key]
    );
  }

  function togglePreferredDay(day: PreferredDay) {
    setPreferredDays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day]
    );
  }

  function quoteLabel(type: CareServiceType | null) {
    if (!type) {
      return "Submit service request";
    }

    return type.is_recurring_eligible && frequencyKey !== "one_time"
      ? "Start recurring plan"
      : "Submit service request";
  }

  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode("garment")}
          className={cn(
            "rounded-[28px] border p-5 text-left transition",
            mode === "garment"
              ? "border-[color:var(--accent)]/45 bg-[color:var(--accent)]/10 shadow-lg shadow-[color:var(--accent)]/10"
              : "border-black/10 bg-black/[0.02] hover:border-[color:var(--accent)]/25 dark:border-white/10 dark:bg-white/[0.03]"
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent)]/12">
              <Package2 className="h-5 w-5 text-[color:var(--accent)]" />
            </div>
            {mode === "garment" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-100">
                <Check className="h-3.5 w-3.5" />
                Active
              </span>
            ) : null}
          </div>
          <div className="mt-4 text-lg font-semibold text-zinc-950 dark:text-white">
            Wardrobe care and return delivery
          </div>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-white/65">
            Dry cleaning, laundry, pressing, stain treatment, and mixed garment intake under one
            cleaner customer record that ends in return delivery.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setMode("service")}
          className={cn(
            "rounded-[28px] border p-5 text-left transition",
            mode === "service"
              ? "border-[color:var(--accent)]/45 bg-[color:var(--accent)]/10 shadow-lg shadow-[color:var(--accent)]/10"
              : "border-black/10 bg-black/[0.02] hover:border-[color:var(--accent)]/25 dark:border-white/10 dark:bg-white/[0.03]"
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent)]/12">
              <Sparkles className="h-5 w-5 text-[color:var(--accent)]" />
            </div>
            {mode === "service" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-100">
                <Check className="h-3.5 w-3.5" />
                Active
              </span>
            ) : null}
          </div>
          <div className="mt-4 text-lg font-semibold text-zinc-950 dark:text-white">
            Residential or workplace execution
          </div>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-white/65">
            One-time or recurring cleaning, site notes, workplace upkeep, and a cleaner quoting flow that ends in completed work, not delivery movement.
          </p>
        </button>
      </div>

      <div className="care-sheen rounded-[28px] border border-black/10 bg-white/72 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
          Service path
        </div>
        <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-white/66">
          Wardrobe requests are built around pickup, treatment, and return delivery. Home and office
          requests are built around team arrival, execution, inspection, and confirmed completion.
        </p>
      </div>

      <section className="rounded-[30px] border border-black/10 bg-white/70 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
          <CalendarDays className="h-4 w-4" />
          Booking details
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <input
            name="customer_name"
            placeholder="Customer or contact name"
            autoComplete="name"
            defaultValue={defaultContact?.fullName ?? ""}
            className={inputCls}
            required
          />
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="Primary contact number"
            defaultValue={defaultContact?.phone ?? ""}
            className={inputCls}
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Email for updates and receipts"
            defaultValue={defaultContact?.email ?? ""}
            className={inputCls}
          />
          <div className="md:col-span-2 grid gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
              Pickup address
            </p>
            {hasAddressBook ? (
              <select
                value={selectedPickupAddressId}
                onChange={(event) => {
                  const nextId = event.target.value;
                  setSelectedPickupAddressId(nextId);
                  const nextAddress = addressBook.find((item) => item.id === nextId);
                  if (nextAddress) {
                    setPickupAddress(nextAddress.fullAddress);
                    if (returnSameAsPickup) setReturnAddress(nextAddress.fullAddress);
                  }
                }}
                className={inputCls}
              >
                {addressBook.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            ) : null}
            <input
              name="pickup_address"
              autoComplete="street-address"
              placeholder={
                mode === "garment"
                  ? "Where we collect your items"
                  : "Property, residence, or site address"
              }
              className={inputCls}
              value={pickupAddress}
              onChange={(event) => {
                setPickupAddress(event.target.value);
                if (returnSameAsPickup) setReturnAddress(event.target.value);
              }}
              required
            />
            <p className="text-xs text-zinc-500 dark:text-white/50">
              Pickup is where our team arrives first.
            </p>
          </div>
          {mode === "garment" ? (
            <div className="md:col-span-2 grid gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
                Return / delivery address
              </p>
              <label className="inline-flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-white/65">
                <input
                  type="checkbox"
                  checked={returnSameAsPickup}
                  onChange={(event) => {
                    const next = event.target.checked;
                    setReturnSameAsPickup(next);
                    if (next) setReturnAddress(pickupAddress);
                  }}
                />
                Same as pickup address
              </label>
              <input
                name="return_address"
                autoComplete="street-address"
                placeholder="Where we return cleaned items"
                className={inputCls}
                value={returnSameAsPickup ? pickupAddress : returnAddress}
                onChange={(event) => setReturnAddress(event.target.value)}
                required
                disabled={returnSameAsPickup}
              />
              <p className="text-xs text-zinc-500 dark:text-white/50">
                Return address is where completed items are delivered after treatment.
              </p>
            </div>
          ) : null}
          <input
            name="pickup_date"
            type="date"
            value={pickupDate}
            onChange={(event) => setPickupDate(event.target.value)}
            className={cn(inputCls, "care-date-field")}
            required
          />
          <select
            name="pickup_slot"
            value={pickupSlot}
            onChange={(event) => setPickupSlot(event.target.value)}
            className={inputCls}
            required
          >
            {WINDOWS.map((window) => (
              <option key={window} value={window}>
                {window}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4">
          <textarea
            name="special_instructions"
            rows={4}
            placeholder={
              mode === "garment"
                ? "Fabric notes, fragile trims, stain concerns, gate instructions, or rider guidance."
                : "Access instructions, parking guidance, focus areas, entry notes, supervisor details, or support context."
            }
            className={textareaCls}
          />
        </div>
      </section>

      {mode === "garment" ? (
        <section className="space-y-6">
          <div className="rounded-[30px] border border-black/10 bg-white/70 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                  Current garment pricing
                </div>
                <div className="mt-2 text-xl font-semibold text-zinc-950 dark:text-white">
                  Compose the garment manifest
                </div>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-white/65">
                  Add each garment line cleanly. Quantity, urgency, and treatment stay attached to
                  the same tracking record all the way to return delivery.
                </p>
              </div>

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search garments, categories, or care notes"
                className={cn(inputCls, "lg:max-w-sm")}
              />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {filteredGarments.length > 0 ? (
                filteredGarments.map((item) => {
                  const selected =
                    selectedItems.find((entry) => entry.pricing_id === item.id) ?? null;

                  return (
                    <article
                      key={item.id}
                      className={cn(
                        "flex h-full flex-col rounded-[28px] border p-5 transition",
                        selected
                          ? "border-[color:var(--accent)]/35 bg-[color:var(--accent)]/10"
                          : "border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/50">
                            {item.category}
                          </div>
                          <div className="mt-2 text-lg font-semibold text-zinc-950 dark:text-white">
                            {item.item_name}
                          </div>
                        </div>
                        {item.is_featured ? (
                          <span className="rounded-full bg-[color:var(--accent)]/12 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--accent)]">
                            Featured
                          </span>
                        ) : null}
                      </div>

                      {item.description ? (
                        <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-white/65">
                          {item.description}
                        </p>
                      ) : null}

                      <div className="mt-5 flex flex-1 flex-col justify-between gap-4 rounded-[24px] border border-black/10 bg-white/72 p-4 dark:border-white/10 dark:bg-white/[0.05]">
                        <div className="flex items-end justify-between gap-4">
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
                              Starting rate
                            </div>
                            <div className="mt-2 text-3xl font-black tracking-tight text-[color:var(--accent)]">
                              {formatMoney(item.price)}
                            </div>
                            <div className="text-xs uppercase tracking-[0.14em] text-zinc-400 dark:text-white/45">
                              /{item.unit}
                            </div>
                          </div>

                          {selected ? (
                            <span className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-100">
                              In manifest
                            </span>
                          ) : null}
                        </div>

                        <div className={quantityDockCls}>
                          <div className="min-w-0">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
                              Quantity
                            </div>
                            <div className="mt-1 text-lg font-semibold text-zinc-950 dark:text-white">
                              {selected?.quantity ?? 0}
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setGarmentQuantity(item.id, Math.max(0, (selected?.quantity ?? 0) - 1))
                              }
                              className={quantityButtonCls}
                              aria-label={`Reduce ${item.item_name} quantity`}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setGarmentQuantity(item.id, Math.max(1, (selected?.quantity ?? 0) + 1))
                              }
                              className={quantityButtonCls}
                              aria-label={`Increase ${item.item_name} quantity`}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="rounded-[28px] border border-black/10 bg-black/[0.02] p-8 text-center text-sm text-zinc-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/55 md:col-span-2 xl:col-span-3">
                  No garment pricing matched this search.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[30px] border border-black/10 bg-white/70 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                  Estimated garment quote
                </div>
                <div className="mt-2 text-xl font-semibold text-zinc-950 dark:text-white">
                  Selected garment lines
                </div>
              </div>

              <div className="grid gap-2 rounded-[24px] border border-black/10 bg-black/[0.02] p-4 text-sm dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex items-center justify-between gap-6">
                  <span className="text-zinc-500 dark:text-white/55">Subtotal</span>
                  <span className="font-semibold text-zinc-950 dark:text-white">
                    {formatMoney(garmentEstimate.subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <span className="text-zinc-500 dark:text-white/55">Urgent handling</span>
                  <span className="font-semibold text-zinc-950 dark:text-white">
                    {formatMoney(garmentEstimate.urgent)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <span className="text-zinc-500 dark:text-white/55">Treatment uplift</span>
                  <span className="font-semibold text-zinc-950 dark:text-white">
                    {formatMoney(garmentEstimate.treatment)}
                  </span>
                </div>
                <div className="h-px bg-black/10 dark:bg-white/10" />
                <div className="flex items-center justify-between gap-6">
                  <span className="font-semibold text-zinc-900 dark:text-white">Estimated total</span>
                  <span className="text-lg font-black text-[color:var(--accent)]">
                    {formatMoney(garmentEstimate.total)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              {selectedItems.length > 0 ? (
                selectedItems.map((item) => {
                  const pricing = pricingMap.get(item.pricing_id);
                  if (!pricing) return null;

                  const base = pricing.price * item.quantity;
                  const urgent = item.urgent ? Math.round(base * 0.2) : 0;
                  const treatment = treatmentCharge(item.treatment) * item.quantity;
                  const lineTotal = base + urgent + treatment;

                  return (
                    <article
                      key={item.pricing_id}
                      className="rounded-[28px] border border-black/10 bg-black/[0.02] p-5 dark:border-white/10 dark:bg-white/[0.03]"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/50">
                            {pricing.category}
                          </div>
                          <div className="mt-2 text-lg font-semibold text-zinc-950 dark:text-white">
                            {pricing.item_name}
                          </div>
                          <div className="mt-1 text-sm text-zinc-600 dark:text-white/65">
                            Base rate {formatMoney(pricing.price)} / {pricing.unit}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm text-zinc-500 dark:text-white/55">Line total</div>
                          <div className="text-2xl font-black tracking-tight text-[color:var(--accent)]">
                            {formatMoney(lineTotal)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.88fr)]">
                        <label className="grid gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
                            Quantity
                          </span>
                          <div className={quantityDockCls}>
                            <button
                              type="button"
                              onClick={() =>
                                setGarmentQuantity(
                                  item.pricing_id,
                                  Math.max(0, item.quantity - 1)
                                )
                              }
                              className={quantityButtonCls}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="min-w-10 text-center text-base font-semibold text-zinc-950 dark:text-white">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => setGarmentQuantity(item.pricing_id, item.quantity + 1)}
                              className={quantityButtonCls}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </label>

                        <label className="grid gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
                            Treatment
                          </span>
                          <select
                            value={item.treatment}
                            onChange={(event) =>
                              updateGarmentItem(item.pricing_id, {
                                treatment: event.target.value as TreatmentType,
                              })
                            }
                            className={inputCls}
                          >
                            <option value="standard">Standard</option>
                            <option value="stain">Stain treatment</option>
                            <option value="deep_stain">Deep stain rescue</option>
                            <option value="delicate">Delicate handling</option>
                          </select>
                        </label>

                        <label className="grid gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
                            Urgency
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateGarmentItem(item.pricing_id, { urgent: !item.urgent })
                            }
                            className={cn(
                              "h-13 rounded-2xl border px-4 text-left text-sm font-semibold transition",
                              item.urgent
                                ? "border-red-300/30 bg-red-500/10 text-red-700 dark:text-red-100"
                                : "border-black/10 bg-white/80 text-zinc-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70"
                            )}
                          >
                            {item.urgent ? "Express handling applied" : "Standard turnaround"}
                          </button>
                        </label>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="rounded-[28px] border border-black/10 bg-black/[0.02] p-8 text-center text-sm text-zinc-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/55">
                  No garment lines selected yet. Add items above to build the manifest.
                </div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="space-y-6">
          <div className="rounded-[30px] border border-black/10 bg-white/70 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                Service lane
              </div>
              <div className="mt-2 text-xl font-semibold text-zinc-950 dark:text-white">
                Choose the service structure
              </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {serviceCategories.map((category) => {
                const active = category.key === serviceCategory;
                const Icon = category.key === "office" ? Building2 : Home;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setServiceCategory(category.key)}
                    className={cn(
                      "rounded-[28px] border p-5 text-left transition",
                      active
                        ? "border-[color:var(--accent)]/35 bg-[color:var(--accent)]/10"
                        : "border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]"
                    )}
                  >
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent)]/12">
                      <Icon className="h-5 w-5 text-[color:var(--accent)]" />
                    </div>
                    <div className="mt-4 text-lg font-semibold text-zinc-950 dark:text-white">
                      {category.name}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-white/65">
                      {category.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-3">
              {serviceTypes.map((item) => (
                <ServiceTypeCard
                  key={item.id}
                  item={item}
                  active={item.key === serviceTypeKey}
                  onClick={() => setServiceTypeKey(item.key)}
                />
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-black/10 bg-white/70 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                Packages
              </div>
              <div className="mt-2 text-xl font-semibold text-zinc-950 dark:text-white">
                  Choose a recommended baseline
                </div>
              </div>
              <div className="text-sm text-zinc-500 dark:text-white/55">
                Optional, but useful for a steadier quote, staffing plan, and recurring baseline.
              </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-3">
              {packages.length > 0 ? (
                packages.map((item) => {
                  const active = item.slug === packageSlug;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPackageSlug(item.slug)}
                      className={cn(
                        "rounded-[28px] border p-5 text-left transition",
                        active
                          ? "border-[color:var(--accent)]/35 bg-[color:var(--accent)]/10"
                          : "border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]"
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/50">
                          {item.summary}
                        </div>
                        {item.featured_badge ? (
                          <span className="rounded-full bg-[color:var(--accent)]/12 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--accent)]">
                            {item.featured_badge}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 text-lg font-semibold text-zinc-950 dark:text-white">
                        {item.name}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-white/65">
                        {item.description}
                      </p>
                      <div className="mt-4 flex items-end justify-between gap-4">
                        <div className="text-2xl font-black tracking-tight text-[color:var(--accent)]">
                          {formatMoney(item.base_price)}
                        </div>
                        <div className="text-right text-xs uppercase tracking-[0.14em] text-zinc-400 dark:text-white/45">
                          {formatFrequencyLabel(item.default_frequency)} • {item.staff_count} staff
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-[28px] border border-black/10 bg-black/[0.02] p-8 text-center text-sm text-zinc-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/55 xl:col-span-3">
                  No preset matches this service yet. The quote will fall back to the base service logic.
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[30px] border border-black/10 bg-white/70 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                Service details
              </div>
              <div className="mt-2 text-xl font-semibold text-zinc-950 dark:text-white">
                Define the visit clearly
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <ServiceDetailField
                  label="Service zone"
                  hint="Choose the area the team is travelling to. Any travel uplift comes from this zone."
                >
                  <select
                    value={zoneKey}
                    onChange={(event) => setZoneKey(event.target.value)}
                    className={inputCls}
                  >
                    {zoneOptions.map((item) => (
                      <option key={item.id} value={item.key}>
                        {item.name}{" "}
                        {item.travel_fee ? `(+${formatMoney(item.travel_fee)})` : "(included)"}
                      </option>
                    ))}
                  </select>
                </ServiceDetailField>

                <ServiceDetailField
                  label="Property type"
                  hint={
                    serviceCategory === "office"
                      ? "Pick the office setting so the crew arrives with the right plan."
                      : "Pick the kind of home so the cleaning scope matches the property."
                  }
                >
                  <select
                    value={propertyType}
                    onChange={(event) =>
                      setPropertyType(event.target.value as CarePropertyType)
                    }
                    className={inputCls}
                  >
                    {propertyOptions.map((item) => (
                      <option key={item} value={item}>
                        {formatPropertyLabel(item)}
                      </option>
                    ))}
                  </select>
                </ServiceDetailField>

                {serviceCategory === "home" ? (
                  <>
                    <ServiceDetailField
                      label="Bedrooms"
                      helper="Bedrooms to prepare"
                      hint="Enter how many bedrooms the team should cover during this home-cleaning visit."
                    >
                      <ServiceCountField
                        value={bedroomCountInput}
                        onChange={setBedroomCountInput}
                        placeholder="2"
                        ariaLabel="Bedroom count"
                      />
                    </ServiceDetailField>
                    <ServiceDetailField
                      label="Bathrooms"
                      helper="Bathrooms in scope"
                      hint="Enter how many bathrooms should be included in the cleaning scope."
                    >
                      <ServiceCountField
                        value={bathroomCountInput}
                        onChange={setBathroomCountInput}
                        placeholder="1"
                        ariaLabel="Bathroom count"
                      />
                    </ServiceDetailField>
                  </>
                ) : (
                  <>
                    <ServiceDetailField
                      label="Office size band"
                      hint="Use the size band that best matches the office footprint."
                    >
                      <select
                        value={sizeBand}
                        onChange={(event) =>
                          setSizeBand(event.target.value as CareSizeBand)
                        }
                        className={inputCls}
                      >
                        {SIZE_BANDS.map((item) => (
                          <option key={item} value={item}>
                            {item.charAt(0).toUpperCase()}
                            {item.slice(1)} office
                          </option>
                        ))}
                      </select>
                    </ServiceDetailField>
                    <ServiceDetailField
                      label="On-site contact"
                      hint="Add the person the crew should meet or call when they arrive."
                    >
                      <input
                        value={siteContactName}
                        onChange={(event) => setSiteContactName(event.target.value)}
                        className={inputCls}
                        placeholder="Site manager or front desk contact"
                      />
                    </ServiceDetailField>
                  </>
                )}

                <ServiceDetailField
                  label="Floors involved"
                  helper="Levels to cover"
                  hint="Enter how many floors or levels the crew needs to work across."
                >
                  <ServiceCountField
                    value={floorCountInput}
                    onChange={setFloorCountInput}
                    placeholder="1"
                    ariaLabel="Floors involved"
                  />
                </ServiceDetailField>
                <ServiceDetailField
                  label="Preferred team size"
                  helper="Cleaners requested"
                  hint="Set the number of cleaners you want assigned if you need a bigger crew than the baseline."
                >
                  <ServiceCountField
                    value={staffCountInput}
                    onChange={setStaffCountInput}
                    placeholder="2"
                    ariaLabel="Preferred team size"
                  />
                </ServiceDetailField>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <ServiceDetailField
                  label={serviceCategory === "office" ? "Property or office label" : "Property nickname"}
                  hint={
                    serviceCategory === "office"
                      ? "Use the branch name, office label, or building reference the team should recognize."
                      : "Use any house label or nickname that helps the team confirm the right property quickly."
                  }
                >
                  <input
                    value={propertyLabel}
                    onChange={(event) => setPropertyLabel(event.target.value)}
                    className={inputCls}
                    placeholder={
                      serviceCategory === "office"
                        ? "Head office, Annex, or branch name"
                        : "Blue gate house, flat 4B, or family home"
                    }
                  />
                </ServiceDetailField>

                <ServiceDetailField
                  label="Supplies mode"
                  hint="Tell us whether the team should arrive with supplies or work with materials already on site."
                >
                  <select
                    value={suppliesMode}
                    onChange={(event) =>
                      setSuppliesMode(event.target.value as CareSuppliesMode)
                    }
                    className={inputCls}
                  >
                    {SUPPLIES_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item === "included"
                          ? "HenryCo supplies the visit"
                          : "Supplies already on site"}
                      </option>
                    ))}
                  </select>
                </ServiceDetailField>
              </div>

              <div className="mt-6 grid gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
                    Frequency
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {allowedFrequencies.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setFrequencyKey(item)}
                        className={cn(
                          "rounded-full border px-4 py-2 text-sm font-semibold transition",
                          frequencyKey === item
                            ? "border-[color:var(--accent)]/35 bg-[color:var(--accent)]/10 text-zinc-950 dark:text-white"
                            : "border-black/10 bg-white/80 text-zinc-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70"
                        )}
                      >
                        {formatFrequencyLabel(item)}
                      </button>
                    ))}
                  </div>
                </div>

                {frequencyKey !== "one_time" ? (
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
                      Preferred days
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {DAYS.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => togglePreferredDay(day)}
                          className={cn(
                            "rounded-full border px-4 py-2 text-sm font-semibold transition",
                            preferredDays.includes(day)
                              ? "border-[color:var(--accent)]/35 bg-[color:var(--accent)]/10 text-zinc-950 dark:text-white"
                              : "border-black/10 bg-white/80 text-zinc-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70"
                          )}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
                    Timing preference
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {URGENCY_OPTIONS.map((item) => {
                      const disabled =
                        (item === "express" || item === "same_day") &&
                        !selectedServiceType?.is_express_eligible;

                      return (
                        <button
                          key={item}
                          type="button"
                          disabled={disabled}
                          onClick={() => setUrgencyKey(item)}
                          className={cn(
                            "rounded-full border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
                            urgencyKey === item
                              ? "border-[color:var(--accent)]/35 bg-[color:var(--accent)]/10 text-zinc-950 dark:text-white"
                              : "border-black/10 bg-white/80 text-zinc-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70"
                          )}
                        >
                          {item === "same_day"
                            ? "Same-day"
                            : item.charAt(0).toUpperCase() + item.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
                  Add-ons
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {addOns.map((item) => {
                    const active = addonKeys.includes(item.key);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleAddon(item.key)}
                        className={cn(
                          "rounded-[24px] border p-4 text-left transition",
                          active
                            ? "border-[color:var(--accent)]/35 bg-[color:var(--accent)]/10"
                            : "border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]"
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-sm font-semibold text-zinc-950 dark:text-white">
                              {item.label}
                            </div>
                            <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-white/65">
                              {item.description}
                            </p>
                          </div>
                          <div className="text-sm font-black text-[color:var(--accent)]">
                            +{formatMoney(item.amount)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-black/10 bg-white/70 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                Current estimate
              </div>
              <div className="mt-2 text-xl font-semibold text-zinc-950 dark:text-white">
                Service estimate
              </div>

              {serviceQuote ? (
                <div className="mt-5 space-y-5">
                  <div className="rounded-[26px] border border-black/10 bg-black/[0.02] p-5 dark:border-white/10 dark:bg-white/[0.03]">
                    <div className="text-sm text-zinc-500 dark:text-white/55">
                      {selectedPackage?.name ?? selectedServiceType?.name ?? "Custom service"}
                    </div>
                    <div className="mt-2 text-4xl font-black tracking-tight text-[color:var(--accent)]">
                      {formatMoney(serviceQuote.total)}
                    </div>
                    <div className="mt-2 text-sm text-zinc-600 dark:text-white/65">
                      {selectedZone?.name ?? "Core service zone"} • {serviceQuote.recommendedStaffCount} recommended staff •{" "}
                      {Math.max(1, Math.round(serviceQuote.estimatedDurationMin / 60))} hour service window
                    </div>
                  </div>

                  <div className="grid gap-3 rounded-[26px] border border-black/10 bg-black/[0.02] p-5 text-sm dark:border-white/10 dark:bg-white/[0.03]">
                    <div className="flex items-center justify-between gap-6">
                      <span className="text-zinc-500 dark:text-white/55">Base service</span>
                      <span className="font-semibold text-zinc-950 dark:text-white">
                        {formatMoney(serviceQuote.basePrice)}
                      </span>
                    </div>
                    {serviceQuote.modifiers.map((line) => (
                      <div
                        key={`${line.label}-${line.amount}`}
                        className="flex items-center justify-between gap-6"
                      >
                        <span className="text-zinc-500 dark:text-white/55">{line.label}</span>
                        <span className="font-semibold text-zinc-950 dark:text-white">
                          {line.amount < 0
                            ? `-${formatMoney(Math.abs(line.amount))}`
                            : formatMoney(line.amount)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[26px] border border-black/10 bg-black/[0.02] p-5 dark:border-white/10 dark:bg-white/[0.03]">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
                      Quote summary
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {serviceQuote.summary.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-black/10 bg-white/80 px-3 py-2 text-xs font-semibold text-zinc-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-[26px] border border-black/10 bg-black/[0.02] p-6 text-sm text-zinc-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/55">
                  Choose a service type to view the current estimate.
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <input type="hidden" name="booking_mode" value={mode} />
      <input type="hidden" name="selected_items_json" value={garmentPayloadJson} />
      <input type="hidden" name="service_booking_json" value={servicePayloadJson} />
      <input type="hidden" name="payment_plan" value={paymentPlan} />

      <div className="rounded-[30px] border border-black/10 bg-white/70 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
        <div className="grid gap-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
              Before you submit
            </div>
            <div className="mt-2 text-lg font-semibold text-zinc-950 dark:text-white">
              {mode === "garment"
                ? "Send the garment request and receive one tracking code."
                : "Send the service request with the current quote context attached."}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-white/65">
              The team reviews the request after submission. The amount shown here reflects the
              current estimate based on the details you selected above.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <button
              type="button"
              onClick={() => setPaymentPlan("book_first")}
              className={cn(
                "rounded-[1.8rem] border p-5 text-left transition",
                paymentPlan === "book_first"
                  ? "border-[color:var(--accent)]/35 bg-[color:var(--accent)]/10"
                  : "border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]"
              )}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70">
                <Sparkles className="h-3.5 w-3.5 text-[color:var(--accent)]" />
                Book first
              </div>
              <div className="mt-4 text-lg font-semibold text-zinc-950 dark:text-white">
                Send the request now and complete payment after the team confirms the next step.
              </div>
              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/65">
                Best when you want the team to review the request first. The booking and tracking
                flow still opens immediately, and payment instructions remain available afterward.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPaymentPlan("pay_now")}
              className={cn(
                "rounded-[1.8rem] border p-5 text-left transition",
                paymentPlan === "pay_now"
                  ? "border-[color:var(--accent)]/35 bg-[color:var(--accent)]/10"
                  : "border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]"
              )}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70">
                <CreditCard className="h-3.5 w-3.5 text-[color:var(--accent)]" />
                Pay now
              </div>
              <div className="mt-4 text-lg font-semibold text-zinc-950 dark:text-white">
                Submit the booking and receive payment details right away.
              </div>
              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/65">
                Best when you already know you want the slot locked in fast and want instant payment
                guidance by email, with support visibility from the start.
              </p>
            </button>
          </div>

          {paymentPlan === "pay_now" ? (
            <div className="grid gap-4 rounded-[1.8rem] border border-[color:var(--accent)]/22 bg-[color:var(--accent)]/7 p-5 xl:grid-cols-[0.96fr_1.04fr]">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                  Payment guidance
                </div>
                <div className="mt-3 text-lg font-semibold text-zinc-950 dark:text-white">
                  The same payment instructions will be sent as soon as the booking is submitted.
                </div>
                <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/65">
                  This does not skip booking review. It simply opens the payment path immediately so
                  the team can confirm your payment faster.
                </p>
              </div>

              <div className="grid gap-3 rounded-[1.4rem] border border-black/10 bg-white/82 p-4 dark:border-white/10 dark:bg-white/[0.05]">
                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailPill label="Account name" copyValue={paymentSettings.accountName || "HenryCo Care"}>
                    {paymentSettings.accountName || "HenryCo Care"}
                  </DetailPill>
                  <DetailPill label="Bank name" copyValue={paymentSettings.bankName || undefined}>
                    {paymentSettings.bankName || "Configured after save"}
                  </DetailPill>
                  <DetailPill label="Account number" copyValue={paymentSettings.accountNumber || undefined}>
                    {paymentSettings.accountNumber || "Configured after save"}
                  </DetailPill>
                  <DetailPill label="Currency">
                    {paymentSettings.currency || "NGN"}
                  </DetailPill>
                </div>

                <div className="grid gap-2 rounded-[1.2rem] border border-black/10 bg-black/[0.03] px-4 py-4 text-sm leading-7 text-zinc-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/65">
                  <div className="font-semibold text-zinc-950 dark:text-white">
                    {paymentSettings.instructions ||
                      "Use the tracking code as your transfer reference, then upload the receipt so the Care team can confirm payment and continue the booking."}
                  </div>
                  {(paymentSettings.supportEmail || paymentSettings.supportWhatsApp) ? (
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
                      <Phone className="h-3.5 w-3.5 text-[color:var(--accent)]" />
                      <span>
                        {[paymentSettings.supportEmail, paymentSettings.supportWhatsApp]
                          .filter(Boolean)
                          .join(" • ")}
                      </span>
                      {paymentSettings.supportEmail ? (
                        <CopyButton value={paymentSettings.supportEmail} label="Copy email" />
                      ) : null}
                      {paymentSettings.supportWhatsApp ? (
                        <CopyButton value={paymentSettings.supportWhatsApp} label="Copy WhatsApp" />
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm leading-7 text-zinc-600 dark:text-white/65">
              {paymentPlan === "pay_now"
                ? "The request, tracking code, and payment guidance will move together as one faster handoff."
                : "The booking request goes first, and the payment path stays available without adding friction to submission."}
            </div>

            <PendingSubmitButton
              disabled={mode === "garment" ? selectedItems.length === 0 : !serviceQuote}
              label={
                paymentPlan === "pay_now"
                  ? "Submit booking and unlock payment path"
                  : mode === "garment"
                    ? "Submit garment request"
                    : quoteLabel(selectedServiceType)
              }
              pendingLabel="Submitting request..."
            />
          </div>
        </div>
      </div>
    </form>
  );
}

function ServiceTypeCard({
  item,
  active,
  onClick,
}: {
  item: CareServiceType;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[28px] border p-5 text-left transition",
        active
          ? "border-[color:var(--accent)]/35 bg-[color:var(--accent)]/10"
          : "border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]"
      )}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/50">
        {item.pricing_model === "commercial" ? "Commercial" : "Property based"}
      </div>
      <div className="mt-2 text-lg font-semibold text-zinc-950 dark:text-white">
        {item.name}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-white/65">
        {item.description}
      </p>
      <div className="mt-4 flex items-end justify-between gap-4">
        <div className="text-2xl font-black tracking-tight text-[color:var(--accent)]">
          {formatMoney(item.base_price)}
        </div>
        <div className="text-right text-xs uppercase tracking-[0.14em] text-zinc-400 dark:text-white/45">
          {item.default_staff_count} staff • {Math.round(item.default_duration_min / 60)}h
        </div>
      </div>
    </button>
  );
}

function DetailPill({
  label,
  children,
  copyValue,
}: {
  label: string;
  children: ReactNode;
  copyValue?: string | null;
}) {
  return (
    <div className="rounded-[1.2rem] border border-black/10 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
        {label}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-zinc-950 dark:text-white">{children}</div>
        {copyValue ? <CopyButton value={copyValue} /> : null}
      </div>
    </div>
  );
}

function ServiceDetailField({
  label,
  helper,
  hint,
  children,
}: {
  label: string;
  helper?: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
        {label}
      </span>
      {children}
      {helper ? (
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
          {helper}
        </span>
      ) : null}
      <span className="text-xs leading-6 text-zinc-500 dark:text-white/50">
        {hint}
      </span>
    </label>
  );
}

function ServiceCountField({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
}) {
  return (
    <div className={quantityDockCls}>
      <button
        type="button"
        onClick={() => onChange(stepCountInput(value, -1))}
        className={quantityButtonCls}
        aria-label={`Reduce ${ariaLabel.toLowerCase()}`}
      >
        <Minus className="h-4 w-4" />
      </button>

      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(event) => onChange(normalizeCountInput(event.target.value))}
        className={quantityInputCls}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />

      <button
        type="button"
        onClick={() => onChange(stepCountInput(value, 1))}
        className={quantityButtonCls}
        aria-label={`Increase ${ariaLabel.toLowerCase()}`}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
