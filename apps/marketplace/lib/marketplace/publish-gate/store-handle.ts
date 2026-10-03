// V3-MKT-TRUST-01 — the handle a store is opened under.
//
// With instant publish on, the handle a seller types is normalised before it is
// screened, saved or opened, so all three are one handle: lower-case letters,
// digits and single hyphens, 2 to 63 characters — the rule the onboarding RPC
// enforces. A look-alike of another store's handle ("Ade-Shop" next to
// "ade-shop") becomes that handle, and is refused as taken.

const shape = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 63)
    .replace(/-+$/g, "");

/** The handle as the store will carry it; falls back to the store name when the typed one is too short. */
export function storeHandle(typed: string, storeName: string): string {
  const handle = shape(typed);
  if (handle.length >= 2) return handle;
  const fromName = shape(storeName);
  return fromName.length >= 2 ? fromName : handle;
}
