// One switch for React Native, mirroring web's NEXT_PUBLIC_ONYX_TYPE_LIVE. Expo
// inlines EXPO_PUBLIC_* into the client bundle at build time; we also honour the
// shared NEXT_PUBLIC_ name so a single env flips web + native together at reveal.
export function onyxTypeLive(): boolean {
  const v =
    process.env.EXPO_PUBLIC_ONYX_TYPE_LIVE ?? process.env.NEXT_PUBLIC_ONYX_TYPE_LIVE;
  return v === "1";
}
