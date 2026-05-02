"use client";

/**
 * V2-ADDR-01 — Full address form (create / edit / one-shot).
 *
 * Wraps PlacesAutocomplete + the secondary fields (label, full_name, phone,
 * apartment/suite). On submit, calls `onSubmit` with a fully-populated
 * UserAddressInput (or, in one-shot mode, OneShotAddress with is_one_shot=true).
 *
 * The component stays UI-style-agnostic: pass classNames per section so
 * each app's design system can drape it.
 */

import { useEffect, useId, useMemo, useState } from "react";
import PlacesAutocomplete from "./PlacesAutocomplete";
import {
  USER_ADDRESS_LABELS,
  USER_ADDRESS_LABEL_DISPLAY,
  type UserAddressInput,
  type OneShotAddress,
  type UserAddressLabel,
} from "../types";
import { validateAddressInput } from "../validate";

export interface AddressFormProps {
  mode: "create" | "edit" | "one_shot";
  initialValue?: Partial<UserAddressInput>;
  /** Server-proxy URLs */
  placesAutocompleteEndpoint: string;
  placeDetailsEndpoint: string;
  /** Submit handler — receives validated input. */
  onSubmit: (value: UserAddressInput | OneShotAddress) => void | Promise<void>;
  onCancel?: () => void;
  /** Server-side error to display (returned by parent's submit). */
  externalError?: string | null;
  /** Disabled labels (already in use by other addresses). */
  disabledLabels?: ReadonlyArray<UserAddressLabel>;
  /** Country hint for autocomplete bias (e.g. "ng"). */
  countryHint?: string;
  /** Classnames */
  classNames?: {
    root?: string;
    field?: string;
    input?: string;
    select?: string;
    button?: string;
    buttonSecondary?: string;
    error?: string;
  };
}

interface DetailedPlace {
  place_id: string;
  formatted_address: string;
  street: string;
  city: string;
  state: string | null;
  country: string;
  postal_code: string | null;
  coordinates_lat: number;
  coordinates_lng: number;
}

function uuidish(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function AddressForm({
  mode,
  initialValue,
  placesAutocompleteEndpoint,
  placeDetailsEndpoint,
  onSubmit,
  onCancel,
  externalError,
  disabledLabels = [],
  countryHint,
  classNames,
}: AddressFormProps) {
  const [sessionToken, setSessionToken] = useState<string>(() => uuidish());
  const [picked, setPicked] = useState<DetailedPlace | null>(() =>
    initialValue?.google_place_id
      ? {
          place_id: initialValue.google_place_id,
          formatted_address: initialValue.formatted_address ?? "",
          street: initialValue.street ?? "",
          city: initialValue.city ?? "",
          state: initialValue.state ?? null,
          country: initialValue.country ?? "",
          postal_code: initialValue.postal_code ?? null,
          coordinates_lat: initialValue.coordinates_lat ?? 0,
          coordinates_lng: initialValue.coordinates_lng ?? 0,
        }
      : null
  );
  const [resolvingPlace, setResolvingPlace] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);

  const [label, setLabel] = useState<UserAddressLabel>(
    (initialValue?.label as UserAddressLabel) ?? "home"
  );
  const [fullName, setFullName] = useState(initialValue?.full_name ?? "");
  const [phone, setPhone] = useState(initialValue?.phone ?? "");
  const [streetOverride, setStreetOverride] = useState(initialValue?.street ?? "");
  const [unit, setUnit] = useState(""); // appended to street
  const [isDefault, setIsDefault] = useState(initialValue?.is_default ?? false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formId = useId();

  // When user picks from autocomplete: resolve to full place details.
  async function handlePick(pick: { place_id: string; description: string }) {
    setResolvingPlace(true);
    setPlacesError(null);
    try {
      const url = new URL(placeDetailsEndpoint, window.location.origin);
      url.searchParams.set("placeId", pick.place_id);
      url.searchParams.set("session", sessionToken);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Couldn't resolve address");
      const json = (await res.json()) as DetailedPlace;
      setPicked(json);
      setStreetOverride(json.street);
      // Refresh session token for next search session.
      setSessionToken(uuidish());
    } catch (err) {
      setPlacesError("Couldn't resolve that address. Try a different suggestion.");
    } finally {
      setResolvingPlace(false);
    }
  }

  function handleClearPick() {
    setPicked(null);
    setStreetOverride("");
  }

  const composedStreet = useMemo(() => {
    const base = streetOverride.trim();
    if (unit.trim()) return `${unit.trim()}, ${base}`;
    return base;
  }, [streetOverride, unit]);

  const labelOptions = useMemo(() => {
    return USER_ADDRESS_LABELS.map((l) => ({
      value: l,
      display: USER_ADDRESS_LABEL_DISPLAY[l],
      disabled:
        mode === "create" &&
        disabledLabels.includes(l) &&
        l !== (initialValue?.label as UserAddressLabel),
    }));
  }, [mode, disabledLabels, initialValue?.label]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!picked) {
      setErrors({ google_place_id: "Please pick the address from the suggestion list." });
      return;
    }

    const candidate: UserAddressInput = {
      label,
      full_name: fullName.trim() || null,
      phone: phone.trim() || null,
      country: picked.country,
      state: picked.state,
      city: picked.city,
      street: composedStreet || picked.street,
      postal_code: picked.postal_code,
      coordinates_lat: picked.coordinates_lat,
      coordinates_lng: picked.coordinates_lng,
      google_place_id: picked.place_id,
      formatted_address: picked.formatted_address,
      is_default: mode === "create" || mode === "edit" ? isDefault : false,
    };

    const validationErrors = validateAddressInput(candidate);
    if (validationErrors.length > 0) {
      const map: Record<string, string> = {};
      validationErrors.forEach((er) => {
        map[er.field as string] = er.message;
      });
      setErrors(map);
      return;
    }
    setErrors({});

    try {
      setSubmitting(true);
      if (mode === "one_shot") {
        const oneShot: OneShotAddress = {
          full_name: candidate.full_name,
          phone: candidate.phone,
          country: candidate.country,
          state: candidate.state,
          city: candidate.city,
          street: candidate.street,
          postal_code: candidate.postal_code,
          coordinates_lat: candidate.coordinates_lat,
          coordinates_lng: candidate.coordinates_lng,
          google_place_id: candidate.google_place_id,
          formatted_address: candidate.formatted_address,
          is_one_shot: true,
        };
        await onSubmit(oneShot);
      } else {
        await onSubmit(candidate);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className={classNames?.root}
      noValidate
    >
      {mode !== "one_shot" && (
        <div className={classNames?.field}>
          <label htmlFor={`${formId}-label`}>Label</label>
          <select
            id={`${formId}-label`}
            value={label}
            onChange={(e) => setLabel(e.target.value as UserAddressLabel)}
            disabled={mode === "edit"}
            className={classNames?.select}
            aria-invalid={Boolean(errors.label) || undefined}
            aria-describedby={errors.label ? `${formId}-label-err` : undefined}
          >
            {labelOptions.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.display}
                {opt.disabled ? " (already in use)" : ""}
              </option>
            ))}
          </select>
          {errors.label && (
            <p id={`${formId}-label-err`} role="alert" className={classNames?.error}>
              {errors.label}
            </p>
          )}
        </div>
      )}

      <div className={classNames?.field}>
        <label htmlFor={`${formId}-search`}>Search address</label>
        <PlacesAutocomplete
          placesEndpoint={placesAutocompleteEndpoint}
          sessionToken={sessionToken}
          countryHint={countryHint}
          initialValue={picked?.formatted_address ?? ""}
          onPick={handlePick}
          onClearWithoutPick={handleClearPick}
          inputClassName={classNames?.input}
          ariaLabel="Search for your address"
          ariaInvalid={Boolean(errors.google_place_id || placesError)}
          ariaDescribedBy={
            [
              placesError ? `${formId}-places-err` : null,
              errors.google_place_id ? `${formId}-place-err` : null,
            ]
              .filter(Boolean)
              .join(" ") || undefined
          }
        />
        {resolvingPlace && <p>Resolving address details…</p>}
        {placesError && (
          <p id={`${formId}-places-err`} role="alert" className={classNames?.error}>
            {placesError}
          </p>
        )}
        {errors.google_place_id && (
          <p id={`${formId}-place-err`} role="alert" className={classNames?.error}>
            {errors.google_place_id}
          </p>
        )}
      </div>

      {picked && (
        <>
          <div className={classNames?.field}>
            <label htmlFor={`${formId}-street`}>Street</label>
            <input
              id={`${formId}-street`}
              type="text"
              value={streetOverride}
              onChange={(e) => setStreetOverride(e.target.value)}
              className={classNames?.input}
              aria-invalid={Boolean(errors.street) || undefined}
              aria-describedby={errors.street ? `${formId}-street-err` : undefined}
            />
            {errors.street && (
              <p id={`${formId}-street-err`} role="alert" className={classNames?.error}>
                {errors.street}
              </p>
            )}
          </div>

          <div className={classNames?.field}>
            <label htmlFor={`${formId}-unit`}>Apartment / suite / floor (optional)</label>
            <input
              id={`${formId}-unit`}
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className={classNames?.input}
              placeholder="Apt 4B, Floor 3, Suite 200…"
            />
          </div>

          <div className={classNames?.field}>
            <label htmlFor={`${formId}-fullname`}>Full name on address (optional)</label>
            <input
              id={`${formId}-fullname`}
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={classNames?.input}
              placeholder="Recipient name for deliveries"
            />
          </div>

          <div className={classNames?.field}>
            <label htmlFor={`${formId}-phone`}>Phone (optional)</label>
            <input
              id={`${formId}-phone`}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={classNames?.input}
              placeholder="+234…"
              aria-invalid={Boolean(errors.phone) || undefined}
              aria-describedby={errors.phone ? `${formId}-phone-err` : undefined}
            />
            {errors.phone && (
              <p id={`${formId}-phone-err`} role="alert" className={classNames?.error}>
                {errors.phone}
              </p>
            )}
          </div>

          <div className={classNames?.field}>
            <p>
              <strong>City:</strong> {picked.city || "—"}
              {" · "}
              <strong>State:</strong> {picked.state ?? "—"}
              {" · "}
              <strong>Country:</strong> {picked.country || "—"}
              {picked.postal_code ? (
                <>
                  {" · "}
                  <strong>Postal:</strong> {picked.postal_code}
                </>
              ) : null}
            </p>
          </div>

          {mode !== "one_shot" && (
            <label className={classNames?.field} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
              />
              <span>Make this my default address</span>
            </label>
          )}
        </>
      )}

      {externalError && (
        <p role="alert" className={classNames?.error}>
          {externalError}
        </p>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button type="submit" disabled={submitting || !picked} className={classNames?.button}>
          {submitting ? "Saving…" : mode === "edit" ? "Save changes" : mode === "one_shot" ? "Use this address" : "Save address"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={classNames?.buttonSecondary}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
