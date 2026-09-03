import { permanentRedirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * (workspace) V3-40 308 stub — the pass spec named this path, but (workspace)
 * chrome was retired by DASH-9 G9; the live surface is the Track C module.
 * New: 308 to /modules/staff-risk (mirrors the sibling module stubs).
 */
export default function WorkspaceLegacyRedirect(): never {
  permanentRedirect("/modules/staff-risk");
}
