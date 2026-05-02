"use client";

/**
 * V2-ADDR-01 — Client entrypoint.
 *
 * Imports here MUST be browser-safe. Server-side helpers live under
 * `@henryco/address-selector/server`.
 */

export { default as PlacesAutocomplete } from "./PlacesAutocomplete";
export { default as AddressForm } from "./AddressForm";
export { default as AddressSelector } from "./AddressSelector";
export type { PlacesAutocompleteProps } from "./PlacesAutocomplete";
export type { AddressFormProps } from "./AddressForm";
export type { AddressSelectorProps } from "./AddressSelector";
