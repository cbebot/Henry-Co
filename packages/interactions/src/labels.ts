/**
 * @henryco/interactions — copy contract.
 *
 * The package ships ZERO hardcoded user-facing English (doctrine Principle 12).
 * Every string an engine renders is supplied by the app as a prop, localized
 * via @henryco/i18n (Pattern B). Each engine declares its own `*Labels` type
 * so the copy it needs is explicit at the call site.
 *
 * `interpolate` is the one shared utility: it fills `{named}` tokens in a
 * localized template with runtime values (a name, a time, an amount), and
 * leaves unknown tokens intact so a missing value never renders "undefined".
 */

const TOKEN = /\{(\w+)\}/g;

export function interpolate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(TOKEN, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match,
  );
}
