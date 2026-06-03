import { PortalDashboardSkeleton } from "@/components/portal/skeletons";

/**
 * Studio ROOT route fallback.
 *
 * Scope note (V3-STUDIO-LOADING-POLISH): this root boundary is the Suspense
 * fallback for top-level segments that DON'T ship their own loading.tsx —
 * which, after this pass, are the DARK staff dashboards (pm, sales, finance,
 * delivery, project, proposals) and the dark /pay surface. The LIGHT public
 * surfaces now own their own light loaders: app/(public)/loading.tsx and
 * app/request/loading.tsx (both render `StudioPublicLoading` on the warm-paper
 * `--home-*` canvas with the teal accent). So the public experience never hits
 * this fallback and never flashes dark.
 *
 * This root loader therefore stays on the dashboard's dark studio canvas (it
 * renders inside the dark `<body bg=var(--studio-bg)>` from app/layout.tsx,
 * OUTSIDE `.studio-public`). Making it light here would flash light over the
 * dark workspaces — which the brief explicitly forbids touching. Instead of a
 * bare splash it now shows the content-shaped dark `PortalDashboardSkeleton`
 * so the workspace shell streams in without a jolt.
 */
export default function StudioLoading() {
  return (
    <div className="mx-auto w-full max-w-[88rem] px-5 py-10 sm:px-8 lg:px-10">
      <PortalDashboardSkeleton />
    </div>
  );
}
