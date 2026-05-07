import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  getRegisteredModules,
  WorkspaceSlot,
  EmptyState,
  LoadingSkeleton,
  ErrorBoundary,
} from "@henryco/dashboard-shell";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";
import { buildUnifiedViewer } from "@henryco/auth/server";
import { requireAccountUser } from "@/lib/auth";

// Side-effect: register modules. Without this import the registry is
// empty and getRegisteredModules() returns [].
import "@/app/(account)/_modules";

/**
 * Catch-all module router — `/modules/[...slug]/page.tsx`.
 *
 * Resolves `slug[0]` to a registered module (`getRegisteredModules`)
 * and renders the module's home view. Sub-paths under
 * `/modules/<slug>/...` are not resolved by this catch-all in DASH-2
 * (the module's `getRoutes()` declares them; DASH-3 extends the router
 * to honour each detail entry). For now any non-home sub-path renders
 * the module home with a "deep-link landing pending" notice — the
 * existing `/marketplace/*` and `/wallet/*` routes still serve their
 * own content unaffected.
 */
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

export default async function ModulePage({ params }: PageProps) {
  const { slug } = await params;
  const [moduleSlug, ...rest] = slug;
  if (!moduleSlug) notFound();

  const user = await requireAccountUser();
  const viewer = await buildUnifiedViewer({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
  });

  const registered = getRegisteredModules();
  const targetModule = registered.find((m) => m.slug === moduleSlug);
  if (!targetModule) notFound();

  const decision = targetModule.getRoleGate(viewer);
  if (!decision || decision.kind !== "allow") {
    notFound();
  }

  // Detail sub-paths fall through to the home view in DASH-2; DASH-3
  // wires per-detail rendering via module.getRoutes() lookup.
  const isDetail = rest.length > 0;

  const widgetsPromise = targetModule.getHomeWidgets(viewer);

  return (
    <WorkspaceSlot>
      <header style={{ marginBottom: "1.5rem" }}>
        <p
          style={{
            fontSize: "0.7rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: `var(${CSS_VARS.inkMuted})`,
            margin: 0,
          }}
        >
          Module
        </p>
        <h1
          style={{
            margin: "0.25rem 0 0",
            fontSize: "1.75rem",
            color: `var(${CSS_VARS.ink})`,
          }}
        >
          {targetModule.title}
        </h1>
        <p
          style={{
            margin: "0.5rem 0 0",
            color: `var(${CSS_VARS.inkSoft})`,
          }}
        >
          {targetModule.description}
        </p>
      </header>
      <Suspense
        fallback={
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(15rem, 1fr))",
              gap: "1rem",
            }}
          >
            <LoadingSkeleton variant="metric" />
            <LoadingSkeleton variant="metric" />
            <LoadingSkeleton variant="metric" />
            <LoadingSkeleton variant="metric" />
          </div>
        }
      >
        <ErrorBoundary
          label={`${targetModule.title} module`}
          fallback={() => (
            <EmptyState
              kicker={targetModule.title}
              headline="Something went wrong loading this module."
              body="Refresh the page or come back in a moment."
            />
          )}
        >
          <ModuleHome moduleSlug={targetModule.slug} widgetsPromise={widgetsPromise} isDetail={isDetail} />
        </ErrorBoundary>
      </Suspense>
    </WorkspaceSlot>
  );
}

async function ModuleHome({
  moduleSlug,
  widgetsPromise,
  isDetail,
}: {
  moduleSlug: string;
  widgetsPromise: Promise<ReadonlyArray<{ id: string; render: () => Promise<React.ReactNode>; size: "sm" | "md" | "lg" }>>;
  isDetail: boolean;
}) {
  const widgets = await widgetsPromise;

  if (widgets.length === 0) {
    return (
      <EmptyState
        kicker={moduleSlug}
        headline="Nothing to show yet."
        body="When activity arrives in this module it will surface here."
      />
    );
  }

  const rendered = await Promise.all(
    widgets.map(async (widget) => ({
      id: widget.id,
      size: widget.size,
      node: await widget.render(),
    })),
  );

  return (
    <div>
      {isDetail ? (
        <p
          role="note"
          style={{
            margin: "0 0 1rem",
            padding: "0.5rem 0.75rem",
            borderRadius: "0.5rem",
            backgroundColor: `var(${CSS_VARS.accentSoft})`,
            color: `var(${CSS_VARS.accentText})`,
            fontSize: "0.75rem",
          }}
        >
          Deep-link landing for this module is being built. The module&apos;s home view is below — DASH-3 wires
          per-detail rendering.
        </p>
      ) : null}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(15rem, 1fr))",
          gap: "1rem",
        }}
      >
        {rendered.map((w) => (
          <div
            key={w.id}
            style={{
              gridColumn:
                w.size === "lg" ? "span 2" : w.size === "md" ? "span 2" : "span 1",
            }}
          >
            {w.node}
          </div>
        ))}
      </div>
    </div>
  );
}
