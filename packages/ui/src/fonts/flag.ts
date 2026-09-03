// packages/ui/src/fonts/flag.ts
// One switch flips web + RN together (RN reads the same env in packages/rn-type).
export function onyxTypeAttr(): "live" | undefined {
  return process.env.NEXT_PUBLIC_ONYX_TYPE_LIVE === "1" ? "live" : undefined;
}
