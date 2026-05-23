import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  getRegisteredModules,
  WorkspaceSlot,
  LoadingSkeleton,
  ErrorBoundary,
} from "@henryco/dashboard-shell";
import {
  HeroCard,
  EmptyStateCard,
  DivisionLanding,
} from "@henryco/dashboard-shell/surfaces";
import { buildUnifiedViewer } from "@henryco/auth/server";
import { translateSurfaceLabel } from "@henryco/i18n";
import { requireAccountUser } from "@/lib/auth";
import { getAccountAppLocale } from "@/lib/locale-server";

// Side-effect: register modules. Without this import the registry is
// empty and getRegisteredModules() returns [].
import "@/app/(account)/_modules";

/**
 * Catch-all module router — `/modules/[...slug]/page.tsx`.
 *
 * ACCOUNT-PREMIUM-01 (session 2, Phase 2E). Lifts the bare typography
 * header into a compact HeroCard so registered modules feel like
 * first-class dashboard surfaces.
 *
 * Module registry contract NOT extended this session — `module.title` and
 * `module.description` remain the only state-free source. When the
 * registry adds `getHero(viewer)` the compact hero below picks it up
 * automatically.
 */
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

export default async function ModulePage({ params }: PageProps) {
  const { slug } = await params;
  const [moduleSlug, ...rest] = slug;
  if (!moduleSlug) notFound();

  const [locale, user] = await Promise.all([
    getAccountAppLocale(),
    requireAccountUser(),
  ]);
  const t = (text: string) => translateSurfaceLabel(locale, text);
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

  const isDetail = rest.length > 0;
  const widgetsPromise = targetModule.getHomeWidgets(viewer);

  return (
    <WorkspaceSlot>
      <DivisionLanding
        className="acct-fade-in"
        hero={
          <HeroCard
            variant="compact"
            tone="calm"
            eyebrow={t("Module")}
            headline={targetModule.title}
            blurb={targetModule.description}
          />
        }
        sections={[
          ...(isDetail
            ? [
                {
                  id: "module-detail-notice",
                  title: t("Deep-link landing pending"),
                  meta: t("Module sub-route"),
                  content: (
                    <EmptyStateCard
                      tone="ghost"
                      kicker={targetModule.title}
                      title={t(
                        "Deep-link landing for this module is being built.",
                      )}
                      body={t(
                        "The module's home view is below — DASH-3 wires per-detail rendering.",
                      )}
                    />
                  ),
                },
              ]
            : []),
          {
            id: "module-home",
            title: targetModule.title,
            meta: t("Live widgets"),
            content: (
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
                    <EmptyStateCard
                      kicker={targetModule.title}
                      title={t("Something went wrong loading this module.")}
                      body={t("Refresh the page or come back in a moment.")}
                    />
                  )}
                >
                  <ModuleHome
                    moduleSlug={targetModule.slug}
                    moduleTitle={targetModule.title}
                    widgetsPromise={widgetsPromise}
                  />
                </ErrorBoundary>
              </Suspense>
            ),
          },
        ]}
      />
    </WorkspaceSlot>
  );
}

async function ModuleHome({
  moduleSlug,
  moduleTitle,
  widgetsPromise,
}: {
  moduleSlug: string;
  moduleTitle: string;
  widgetsPromise: Promise<
    ReadonlyArray<{
      id: string;
      render: () => Promise<React.ReactNode>;
      size: "sm" | "md" | "lg";
    }>
  >;
}) {
  const locale = await getAccountAppLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const widgets = await widgetsPromise;

  if (widgets.length === 0) {
    return (
      <EmptyStateCard
        kicker={moduleTitle || moduleSlug}
        title={t("Nothing to show yet.")}
        body={t("When activity arrives in this module it will surface here.")}
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
  );
}
