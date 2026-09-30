/**
 * A checkbox posted alongside a hidden "false" fallback. The owner staff form places the
 * fallback before the checkbox, so FormData.get() — the first value — was always "false".
 * The flag is on when any submitted value is not "false"; with no value at all (a caller
 * that omits the field) the default applies.
 */
export function readFormFlag(values: readonly unknown[], whenMissing: boolean): boolean {
  const submitted = values
    .map((value) => (typeof value === "string" ? value.trim().toLowerCase() : ""))
    .filter((value) => value !== "");
  if (submitted.length === 0) return whenMissing;
  return submitted.some((value) => value !== "false");
}
