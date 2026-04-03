type FetchInput = Parameters<typeof fetch>[0];
type FetchInit = Parameters<typeof fetch>[1];

export function fetchNoStore(input: FetchInput, init?: FetchInit) {
  return fetch(input, { ...init, cache: "no-store" });
}
