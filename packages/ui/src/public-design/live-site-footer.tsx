import { getLivePublicDivisions } from "@henryco/config/live-divisions";
import { PublicSiteFooter } from "./site-footer";
import type { ComponentProps } from "react";

/**
 * LivePublicSiteFooter — the shared site footer, minus whatever the owner has
 * paused or unpublished in the division registry.
 *
 * The plain PublicSiteFooter defaults to the STATIC config list, which is why
 * pausing a division in the command center never removed it from any public
 * footer. This async server wrapper resolves the live list (60s shared cache,
 * fail-open — an outage shows everything rather than nothing) and renders the
 * same footer. Server components only; the one client-composed shell (hub's
 * PublicSiteShell) receives its filtered list as a prop from its server parent
 * instead.
 */
export async function LivePublicSiteFooter(
  props: Omit<ComponentProps<typeof PublicSiteFooter>, "divisions"> & {
    divisions?: ComponentProps<typeof PublicSiteFooter>["divisions"];
  },
) {
  const divisions = await getLivePublicDivisions(props.divisions);
  return <PublicSiteFooter {...props} divisions={divisions} />;
}
