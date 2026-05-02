"use client";

/**
 * V2-ADDR-01 — Cross-division address picker.
 *
 * Renders a list of the user's saved addresses (radio cards) plus an option
 * to enter a different address one-shot. On change, fires `onChange` with
 * the discriminated `AddressPick`.
 *
 * The component does not fetch addresses itself; the parent passes them in.
 * (Each consuming surface — checkout, care booking, logistics quote — has
 * its own SSR loader.)
 */

import { useEffect, useState } from "react";
import AddressForm from "./AddressForm";
import type {
  UserAddressRecord,
  AddressPick,
  AddressAudience,
  OneShotAddress,
} from "../types";
import { USER_ADDRESS_LABEL_DISPLAY } from "../types";

export interface AddressSelectorProps {
  audience: AddressAudience;
  savedAddresses: UserAddressRecord[];
  onChange: (pick: AddressPick) => void;
  /** Optional: id of the initially-selected saved address (defaults to user's default). */
  initialSelectedId?: string | null;
  /** Endpoints required by the AddressForm one-shot path. */
  placesAutocompleteEndpoint: string;
  placeDetailsEndpoint: string;
  countryHint?: string;
  /** When true, emphasize KYC-verified addresses (filter to verified only). */
  requireKycVerified?: boolean;
  /** Allow "use a different address this time" — defaults to true. */
  allowOneShot?: boolean;
  classNames?: {
    root?: string;
    card?: string;
    cardActive?: string;
    badge?: string;
    badgeKyc?: string;
    button?: string;
    buttonSecondary?: string;
    error?: string;
  };
}

export default function AddressSelector({
  audience,
  savedAddresses,
  onChange,
  initialSelectedId,
  placesAutocompleteEndpoint,
  placeDetailsEndpoint,
  countryHint,
  requireKycVerified = false,
  allowOneShot = true,
  classNames,
}: AddressSelectorProps) {
  const visible = requireKycVerified
    ? savedAddresses.filter((a) => a.kyc_verified)
    : savedAddresses;

  const initial = initialSelectedId
    ? visible.find((a) => a.id === initialSelectedId)
    : visible.find((a) => a.is_default) ?? visible[0];

  const [selectedId, setSelectedId] = useState<string | null>(initial?.id ?? null);
  const [oneShotMode, setOneShotMode] = useState(false);

  useEffect(() => {
    if (selectedId) {
      const found = visible.find((a) => a.id === selectedId);
      if (found) onChange({ kind: "saved", addressId: found.id, address: found });
    }
  }, [selectedId]);

  function handleOneShotSubmit(input: OneShotAddress) {
    onChange({ kind: "one_shot", address: input });
    setOneShotMode(false);
  }

  return (
    <div className={classNames?.root}>
      {visible.length === 0 ? (
        <p>
          {requireKycVerified
            ? "You don't have any KYC-verified addresses yet. Add one in your account settings or use a different address below."
            : "You don't have any saved addresses yet."}
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
          {visible.map((addr) => {
            const active = !oneShotMode && selectedId === addr.id;
            return (
              <li key={addr.id}>
                <label
                  className={`${classNames?.card ?? ""}${active ? ` ${classNames?.cardActive ?? ""}` : ""}`}
                  style={{
                    display: "block",
                    cursor: "pointer",
                    padding: 12,
                    border: `2px solid ${active ? "var(--addr-card-active, #d4af37)" : "var(--addr-card-border, #e5e7eb)"}`,
                    borderRadius: 12,
                  }}
                >
                  <input
                    type="radio"
                    name={`addr-selector-${audience}`}
                    value={addr.id}
                    checked={active}
                    onChange={() => {
                      setSelectedId(addr.id);
                      setOneShotMode(false);
                    }}
                    style={{ marginRight: 8 }}
                  />
                  <strong>{USER_ADDRESS_LABEL_DISPLAY[addr.label]}</strong>
                  {addr.is_default && <span className={classNames?.badge} style={{ marginLeft: 8 }}>Default</span>}
                  {addr.kyc_verified && (
                    <span
                      className={classNames?.badgeKyc}
                      style={{
                        marginLeft: 8,
                        padding: "2px 6px",
                        background: "var(--addr-badge-kyc-bg, #dcfce7)",
                        color: "var(--addr-badge-kyc-fg, #166534)",
                        borderRadius: 6,
                        fontSize: 11,
                      }}
                    >
                      KYC verified
                    </span>
                  )}
                  <div style={{ marginTop: 4, fontSize: 14 }}>
                    {addr.formatted_address ?? `${addr.street}, ${addr.city}${addr.state ? `, ${addr.state}` : ""}, ${addr.country}`}
                  </div>
                  {addr.full_name && <div style={{ fontSize: 12, opacity: 0.7 }}>{addr.full_name}</div>}
                  {addr.phone && <div style={{ fontSize: 12, opacity: 0.7 }}>{addr.phone}</div>}
                </label>
              </li>
            );
          })}
        </ul>
      )}

      {allowOneShot && !oneShotMode && (
        <button
          type="button"
          onClick={() => {
            setOneShotMode(true);
            setSelectedId(null);
          }}
          className={classNames?.buttonSecondary}
          style={{ marginTop: 12 }}
        >
          Use a different address this time
        </button>
      )}

      {oneShotMode && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 13, opacity: 0.75 }}>
            This address will be used for this transaction only. It won't be saved to your address book.
          </p>
          <AddressForm
            mode="one_shot"
            placesAutocompleteEndpoint={placesAutocompleteEndpoint}
            placeDetailsEndpoint={placeDetailsEndpoint}
            countryHint={countryHint}
            onSubmit={(value) => handleOneShotSubmit(value as OneShotAddress)}
            onCancel={() => {
              setOneShotMode(false);
              if (visible[0]) setSelectedId(visible[0].id);
            }}
          />
        </div>
      )}
    </div>
  );
}
