/**
 * Sign-in security evaluation — the pure decision at the heart of new-device /
 * new-location alerting. No I/O: the caller gathers the context (known devices,
 * prior countries) and acts on the verdict. Kept pure so every edge — including
 * the rollout grace window that prevents a mass-alert of existing users — is
 * exhaustively unit-tested.
 */

export type SignInContext = {
  /** Is THIS sign-in's device id already an active known device? */
  deviceIsKnown: boolean;
  /** How many active known devices the user had BEFORE this sign-in. */
  knownActiveDeviceCount: number;
  /** Age (ms) of the user's earliest known device, or null if they have none. */
  earliestKnownDeviceAgeMs: number | null;
  /** ISO country of this sign-in (any case), or null when geo is unknown. */
  currentCountry: string | null;
  /** Distinct ISO countries the user has signed in from before. */
  priorCountries: readonly string[];
};

export type SignInDecisionReason =
  | "known"
  | "grandfathered"
  | "new_device"
  | "new_country"
  | "new_device_and_country";

export type SignInDecision = {
  /** Fire the security alert (email + in-app + push)? */
  alert: boolean;
  isNewDevice: boolean;
  isNewCountry: boolean;
  /** Established silently (first device, or within the rollout grace window). */
  grandfathered: boolean;
  reason: SignInDecisionReason;
};

/**
 * Devices/countries first seen within this window of a user's earliest known
 * device are established silently. This grandfathers the real devices an
 * existing user signs in from in the days after launch, so they are not alarmed
 * by their own established hardware — only genuinely new devices/countries after
 * the window trigger an alert.
 */
export const GRACE_WINDOW_MS = 72 * 60 * 60 * 1000;

function normalizeCountry(value: string | null | undefined): string | null {
  const v = String(value ?? "").trim().toUpperCase();
  return v || null;
}

export function evaluateSignIn(ctx: SignInContext): SignInDecision {
  const isNewDevice = !ctx.deviceIsKnown;

  const current = normalizeCountry(ctx.currentCountry);
  const priors = new Set(
    ctx.priorCountries
      .map((c) => normalizeCountry(c))
      .filter((c): c is string => c !== null),
  );
  // A country is only "new" if we have seen the user somewhere before — the very
  // first country in their history is their baseline, never an alert.
  const isNewCountry = current !== null && priors.size > 0 && !priors.has(current);

  // Familiar device + familiar (or unknown) country → nothing to surface.
  if (!isNewDevice && !isNewCountry) {
    return { alert: false, isNewDevice, isNewCountry, grandfathered: false, reason: "known" };
  }

  const withinGrace =
    ctx.knownActiveDeviceCount === 0 ||
    (ctx.earliestKnownDeviceAgeMs !== null &&
      ctx.earliestKnownDeviceAgeMs < GRACE_WINDOW_MS);
  if (withinGrace) {
    return { alert: false, isNewDevice, isNewCountry, grandfathered: true, reason: "grandfathered" };
  }

  const reason: SignInDecisionReason =
    isNewDevice && isNewCountry
      ? "new_device_and_country"
      : isNewDevice
        ? "new_device"
        : "new_country";
  return { alert: true, isNewDevice, isNewCountry, grandfathered: false, reason };
}
