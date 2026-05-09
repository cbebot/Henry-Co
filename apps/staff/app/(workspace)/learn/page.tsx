import { permanentRedirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * (workspace) DASH-9 G9 308 stub — replaced by the Track C surface.
 * Old: V1 staff workspace route.
 * New: 308 to /modules/staff-learn
 *
 * Cleanup window: 30-day soak then this file is deleted (G14, follow-up).
 */
export default function WorkspaceLegacyRedirect(): never {
  permanentRedirect("/modules/staff-learn");
}
