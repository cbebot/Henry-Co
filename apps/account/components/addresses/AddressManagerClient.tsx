"use client";

/**
 * V2-ADDR-01 — Address management UI for /account/settings/addresses.
 *
 * Renders cards per saved address with default + KYC badges, edit/delete/
 * set-default actions. Uses the shared AddressForm from
 * @henryco/address-selector for both create and edit.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, MapPin, Star, ShieldCheck, Plus } from "lucide-react";
import { AddressForm } from "@henryco/address-selector/client";
import {
  USER_ADDRESS_LABEL_DISPLAY,
  USER_ADDRESS_LABELS,
  type UserAddressRecord,
  type UserAddressInput,
  type UserAddressLabel,
} from "@henryco/address-selector";

const PLACES_AUTOCOMPLETE = "/api/addresses/places/autocomplete";
const PLACES_DETAILS = "/api/addresses/places/details";

interface Props {
  addresses: UserAddressRecord[];
  countryHint?: string;
}

const formClassNames = {
  root: "space-y-4",
  field: "block",
  input: "acct-input w-full",
  select: "acct-select w-full",
  button: "acct-button-primary rounded-xl",
  buttonSecondary: "acct-button-secondary rounded-xl",
  error: "text-sm text-[var(--acct-red)]",
};

export default function AddressManagerClient({ addresses, countryHint }: Props) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<UserAddressRecord | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [externalError, setExternalError] = useState<string | null>(null);

  const usedLabels = new Set(addresses.map((a) => a.label));
  const availableLabels = USER_ADDRESS_LABELS.filter((l) => !usedLabels.has(l));
  const allLabelsUsed = availableLabels.length === 0;

  async function handleCreate(input: UserAddressInput) {
    setExternalError(null);
    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      setExternalError(json.error ?? "Couldn't save the address. Please try again.");
      return;
    }
    setShowCreate(false);
    router.refresh();
  }

  async function handleUpdate(input: UserAddressInput) {
    if (!editing) return;
    setExternalError(null);
    const url = `/api/addresses?id=${encodeURIComponent(editing.id)}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      setExternalError(json.error ?? "Couldn't update the address. Please try again.");
      return;
    }
    setEditing(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/addresses?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) router.refresh();
    setPendingDeleteId(null);
  }

  async function handleSetDefault(id: string) {
    const res = await fetch("/api/addresses/set-default", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-4">
      {addresses.length === 0 && !showCreate && (
        <div className="acct-card p-6 text-center">
          <MapPin className="mx-auto mb-3 text-[var(--acct-muted)]" size={28} />
          <p className="text-sm text-[var(--acct-muted)]">
            You haven&apos;t added any addresses yet. Add your first one to enable faster checkout
            across HenryCo.
          </p>
        </div>
      )}

      {addresses.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {addresses.map((addr) => (
            <li key={addr.id} className="acct-card relative p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">
                      {USER_ADDRESS_LABEL_DISPLAY[addr.label]}
                    </span>
                    {addr.is_default && (
                      <span className="acct-chip acct-chip-green inline-flex items-center gap-1 text-[0.65rem]">
                        <Star size={10} /> Default
                      </span>
                    )}
                    {addr.kyc_verified && (
                      <span className="acct-chip acct-chip-green inline-flex items-center gap-1 text-[0.65rem]">
                        <ShieldCheck size={10} /> KYC verified
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-[var(--acct-muted)]">
                    {addr.formatted_address ??
                      `${addr.street}, ${addr.city}${addr.state ? `, ${addr.state}` : ""}, ${addr.country}`}
                  </div>
                  {addr.full_name && (
                    <div className="mt-1 text-xs text-[var(--acct-muted)]">{addr.full_name}</div>
                  )}
                  {addr.phone && (
                    <div className="text-xs text-[var(--acct-muted)]">{addr.phone}</div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--acct-line)] pt-3">
                {!addr.is_default && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(addr.id)}
                    className="acct-button-secondary inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs"
                  >
                    <Star size={12} /> Set default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setEditing(addr);
                    setShowCreate(false);
                    setExternalError(null);
                  }}
                  className="acct-button-secondary inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs"
                >
                  <Pencil size={12} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDeleteId(addr.id)}
                  className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs text-[var(--acct-red)] hover:bg-[var(--acct-red-soft)]"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>

              {pendingDeleteId === addr.id && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl bg-[var(--acct-bg)]/95 p-4 text-center">
                  <p className="text-sm">
                    Delete this address? This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleDelete(addr.id)}
                      className="rounded-xl bg-[var(--acct-red)] px-3 py-1.5 text-xs text-white"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(null)}
                      className="acct-button-secondary rounded-xl px-3 py-1.5 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {!showCreate && !editing && !allLabelsUsed && (
        <button
          type="button"
          onClick={() => {
            setShowCreate(true);
            setExternalError(null);
          }}
          className="acct-button-primary inline-flex items-center gap-2 rounded-xl px-4 py-2"
        >
          <Plus size={14} /> Add address
        </button>
      )}

      {!showCreate && !editing && allLabelsUsed && (
        <p className="text-sm text-[var(--acct-muted)]">
          You&apos;ve added the maximum of {USER_ADDRESS_LABELS.length} address types
          (home, office, shop, warehouse, alternative 1, alternative 2). Edit or delete one
          to add a different address.
        </p>
      )}

      {showCreate && (
        <section className="acct-card p-5">
          <h3 className="mb-3 text-sm font-semibold">Add a new address</h3>
          <AddressForm
            mode="create"
            placesAutocompleteEndpoint={PLACES_AUTOCOMPLETE}
            placeDetailsEndpoint={PLACES_DETAILS}
            countryHint={countryHint}
            disabledLabels={Array.from(usedLabels) as UserAddressLabel[]}
            externalError={externalError}
            classNames={formClassNames}
            onSubmit={(value) => handleCreate(value as UserAddressInput)}
            onCancel={() => setShowCreate(false)}
          />
        </section>
      )}

      {editing && (
        <section className="acct-card p-5">
          <h3 className="mb-3 text-sm font-semibold">
            Edit {USER_ADDRESS_LABEL_DISPLAY[editing.label]}
          </h3>
          <AddressForm
            mode="edit"
            placesAutocompleteEndpoint={PLACES_AUTOCOMPLETE}
            placeDetailsEndpoint={PLACES_DETAILS}
            countryHint={countryHint}
            initialValue={{
              label: editing.label,
              full_name: editing.full_name,
              phone: editing.phone,
              country: editing.country,
              state: editing.state,
              city: editing.city,
              street: editing.street,
              postal_code: editing.postal_code,
              coordinates_lat: editing.coordinates_lat ?? 0,
              coordinates_lng: editing.coordinates_lng ?? 0,
              google_place_id: editing.google_place_id ?? "",
              formatted_address: editing.formatted_address ?? "",
              is_default: editing.is_default,
            }}
            externalError={externalError}
            classNames={formClassNames}
            onSubmit={(value) => handleUpdate(value as UserAddressInput)}
            onCancel={() => setEditing(null)}
          />
        </section>
      )}
    </div>
  );
}
