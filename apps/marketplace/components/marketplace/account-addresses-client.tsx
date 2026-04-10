"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Pencil, Star, Trash2 } from "lucide-react";
import { HenryCoActivityIndicator } from "@henryco/ui";
import { useMarketplaceRuntime } from "@/components/marketplace/runtime-provider";
import type { MarketplaceAddress } from "@/lib/marketplace/types";

type AccountAddressesClientProps = {
  initialAddresses: MarketplaceAddress[];
};

type AddressFormState = {
  label: string;
  recipient_name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  country: string;
  is_default: boolean;
};

const emptyForm: AddressFormState = {
  label: "",
  recipient_name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  region: "",
  country: "Nigeria",
  is_default: false,
};

function sortAddresses(addresses: MarketplaceAddress[]) {
  return [...addresses].sort((left, right) => Number(right.isDefault) - Number(left.isDefault));
}

export function AccountAddressesClient({ initialAddresses }: AccountAddressesClientProps) {
  const router = useRouter();
  const { pushToast } = useMarketplaceRuntime();
  const [addresses, setAddresses] = useState<MarketplaceAddress[]>(sortAddresses(initialAddresses));
  const [form, setForm] = useState<AddressFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const heading = useMemo(
    () => (editingId ? "Update your saved address" : "Add a saved address"),
    [editingId]
  );

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function applyAddress(address: MarketplaceAddress) {
    setForm({
      label: address.label,
      recipient_name: address.recipient,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 || "",
      city: address.city,
      region: address.region,
      country: address.country,
      is_default: address.isDefault,
    });
    setEditingId(address.id);
    setError(null);
  }

  async function submitAddress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = new FormData();
      payload.set("intent", "address_upsert");
      payload.set("response_mode", "json");
      payload.set("label", form.label);
      payload.set("recipient_name", form.recipient_name);
      payload.set("phone", form.phone);
      payload.set("line1", form.line1);
      payload.set("line2", form.line2);
      payload.set("city", form.city);
      payload.set("region", form.region);
      payload.set("country", form.country);
      if (form.is_default) payload.set("is_default", "true");
      if (editingId) payload.set("address_id", editingId);

      const response = await fetch("/api/marketplace", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: payload,
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string; address?: MarketplaceAddress; mode?: "created" | "updated" }
        | null;

      if (!response.ok || !result?.address) {
        throw new Error(result?.error || "Address save failed.");
      }

      setAddresses((current) => {
        const withoutCurrent = current.filter((item) => item.id !== result.address!.id);
        const next = result.address!.isDefault
          ? withoutCurrent.map((item) => ({ ...item, isDefault: false }))
          : withoutCurrent;
        return sortAddresses([result.address!, ...next]);
      });

      pushToast(
        editingId ? "Address updated" : "Address saved",
        "success",
        result.address.isDefault
          ? "This address is now your default checkout destination."
          : "The address is now available across your marketplace account."
      );
      resetForm();
      startTransition(() => router.refresh());
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Address save failed.";
      setError(message);
      pushToast("Address save failed", "error", message);
    } finally {
      setSubmitting(false);
    }
  }

  async function runAddressAction(intent: "address_default" | "address_delete", addressId: string) {
    setBusyAction(`${intent}:${addressId}`);
    setError(null);

    try {
      const payload = new FormData();
      payload.set("intent", intent);
      payload.set("response_mode", "json");
      payload.set("address_id", addressId);

      const response = await fetch("/api/marketplace", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: payload,
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string; address?: MarketplaceAddress; addressId?: string }
        | null;

      if (!response.ok) {
        throw new Error(result?.error || "Address action failed.");
      }

      if (intent === "address_delete") {
        setAddresses((current) => current.filter((item) => item.id !== addressId));
        if (editingId === addressId) resetForm();
        pushToast("Address removed", "success");
      } else if (result?.address) {
        setAddresses((current) =>
          sortAddresses(
            current.map((item) =>
              item.id === result.address!.id
                ? result.address!
                : {
                    ...item,
                    isDefault: false,
                  }
            )
          )
        );
        pushToast("Default address updated", "success");
      }

      startTransition(() => router.refresh());
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Address action failed.";
      setError(message);
      pushToast("Address action failed", "error", message);
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="space-y-5">
      <section className="market-paper rounded-[1.75rem] p-5">
        <div className="flex items-start gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--market-line)] bg-[var(--market-bg-elevated)] text-[var(--market-brass)]">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--market-paper-white)]">{heading}</p>
            <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">
              Saved destinations are reused by checkout, support follow-up, and future account continuity. Default
              changes take effect immediately.
            </p>
          </div>
        </div>
      </section>

      <form onSubmit={(event) => void submitAddress(event)} className="market-paper rounded-[1.75rem] p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={form.label}
            onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
            className="market-input rounded-2xl px-4 py-3"
            placeholder="Label: Home, Office..."
            required
          />
          <input
            value={form.recipient_name}
            onChange={(event) => setForm((current) => ({ ...current, recipient_name: event.target.value }))}
            className="market-input rounded-2xl px-4 py-3"
            placeholder="Recipient name"
            required
          />
          <input
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            className="market-input rounded-2xl px-4 py-3"
            placeholder="Phone number"
            required
          />
          <input
            value={form.city}
            onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
            className="market-input rounded-2xl px-4 py-3"
            placeholder="City"
            required
          />
          <input
            value={form.region}
            onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))}
            className="market-input rounded-2xl px-4 py-3"
            placeholder="Region / State"
            required
          />
          <input
            value={form.country}
            onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))}
            className="market-input rounded-2xl px-4 py-3"
            placeholder="Country"
            required
          />
          <input
            value={form.line1}
            onChange={(event) => setForm((current) => ({ ...current, line1: event.target.value }))}
            className="market-input rounded-2xl px-4 py-3 md:col-span-2"
            placeholder="Address line 1"
            required
          />
          <input
            value={form.line2}
            onChange={(event) => setForm((current) => ({ ...current, line2: event.target.value }))}
            className="market-input rounded-2xl px-4 py-3 md:col-span-2"
            placeholder="Address line 2 (optional)"
          />
        </div>
        <label className="mt-4 flex items-center gap-3 rounded-[1.25rem] border border-[var(--market-line)] bg-[var(--market-bg-soft)] px-4 py-3 text-sm text-[var(--market-ink)]">
          <input
            type="checkbox"
            checked={form.is_default}
            onChange={(event) => setForm((current) => ({ ...current, is_default: event.target.checked }))}
          />
          Set as default address
        </label>
        {error ? (
          <p className="mt-4 rounded-[1.2rem] bg-[rgba(126,33,18,0.08)] px-4 py-3 text-sm font-medium text-[var(--market-alert)]">
            {error}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            disabled={submitting}
            className="market-button-primary inline-flex min-h-[46px] items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
          >
            {submitting ? (
              <>
                <HenryCoActivityIndicator size="sm" className="text-[var(--market-noir)]" label="Saving address" />
                Saving...
              </>
            ) : editingId ? (
              "Update address"
            ) : (
              "Save address"
            )}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="market-button-secondary rounded-full px-5 py-3 text-sm font-semibold"
            >
              Cancel edit
            </button>
          ) : null}
        </div>
      </form>

      {!addresses.length ? (
        <section className="market-soft rounded-[1.7rem] p-6 text-center">
          <p className="text-xl font-semibold text-[var(--market-paper-white)]">No saved addresses yet.</p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[var(--market-muted)]">
            Save a destination once and HenryCo will keep it ready for future checkout, support, and order-follow-up flows.
          </p>
        </section>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => {
            const defaultBusy = busyAction === `address_default:${address.id}`;
            const deleteBusy = busyAction === `address_delete:${address.id}`;
            return (
              <article key={address.id} className="market-paper rounded-[1.75rem] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="market-kicker">{address.label}</p>
                    <h2 className="mt-3 text-xl font-semibold text-[var(--market-ink)]">{address.recipient}</h2>
                  </div>
                  {address.isDefault ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-[rgba(144,215,186,0.12)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--market-success)]">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      Default
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.region}, {address.country}
                </p>
                <p className="mt-2 text-sm text-[var(--market-muted)]">{address.phone}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => applyAddress(address)}
                    className="market-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  {!address.isDefault ? (
                    <button
                      type="button"
                      disabled={defaultBusy}
                      onClick={() => void runAddressAction("address_default", address.id)}
                      className="market-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
                    >
                      {defaultBusy ? (
                        <HenryCoActivityIndicator size="sm" label="Updating default address" />
                      ) : (
                        <Star className="h-4 w-4" />
                      )}
                      Set default
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={deleteBusy}
                    onClick={() => void runAddressAction("address_delete", address.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,171,151,0.22)] px-4 py-2 text-sm font-semibold text-[var(--market-alert)]"
                  >
                    {deleteBusy ? (
                      <HenryCoActivityIndicator size="sm" label="Deleting address" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
