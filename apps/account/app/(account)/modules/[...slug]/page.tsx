import { notFound } from "next/navigation";
import { after } from "next/server";
import { Suspense } from "react";
import {
  getRegisteredModules,
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
import {
  deepLinkSourceFromUtm,
  recordDeepLinkArrived,
  recordDeepLinkDeadLink,
} from "@henryco/observability";
import { requireAccountUser } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getAccountAppLocale } from "@/lib/locale-server";
import { WidgetOpenOverlay } from "@/components/smart-home/WidgetOpenOverlay";

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

type SearchParams = { [key: string]: string | string[] | undefined };

type PageProps = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<SearchParams>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ModulePage({ params, searchParams }: PageProps) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const [moduleSlug, ...rest] = slug;
  if (!moduleSlug) notFound();

  // V3-04 (S8) — deep-link telemetry context. `source` stays "unknown" for
  // ordinary in-app navigations (no UTM), which we use to skip recording
  // those as attributed arrivals; a dead link is recorded regardless. The
  // emit+persist runs in `after()` so telemetry NEVER blocks routing.
  const source = deepLinkSourceFromUtm(firstParam(sp.utm_source));
  const sourceRef = firstParam(sp.utm_campaign) ?? null;
  const target = `/modules/${slug.join("/")}`;

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
  if (!targetModule) {
    const supabase = await createSupabaseServer();
    after(() =>
      recordDeepLinkDeadLink({
        supabase,
        actorId: user.id,
        source,
        target,
        sourceRef,
      }),
    );
    notFound();
  }

  // Role-gate denial is an authorization outcome, not a broken link, so it is
  // deliberately NOT recorded as a dead link (keeps the S7 dead-link tile to
  // genuinely broken targets).
  const decision = targetModule.getRoleGate(viewer);
  if (!decision || decision.kind !== "allow") {
    notFound();
  }

  // V3-04 (S8) — record a successful attributed arrival, gated on a known
  // source so in-app navigations don't flood the event sink.
  if (source !== "unknown") {
    const supabase = await createSupabaseServer();
    after(() =>
      recordDeepLinkArrived({
        supabase,
        actorId: user.id,
        source,
        target,
        outcome: "ok",
      }),
    );
  }

  const isDetail = rest.length > 0;
  const widgetsPromise = targetModule.getHomeWidgets(viewer);

  return (
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
      title: string;
      render: () => Promise<React.ReactNode>;
      size: "sm" | "md" | "lg";
      /** When set, the whole tile navigates here (HomeWidget contract). */
      href?: string;
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
      title: widget.title,
      size: widget.size,
      href: widget.href,
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
        // `hc-widget-linkable` + the stretched WidgetOpenOverlay make the
        // whole tile open `widget.href` (HomeWidget contract: "clicking
        // anywhere on the widget's chrome navigates here") without nesting
        // the card's own ActionButtons inside a <Link>.
        <div
          key={w.id}
          className="hc-widget-linkable"
          style={{
            gridColumn:
              w.size === "lg" ? "span 2" : w.size === "md" ? "span 2" : "span 1",
          }}
        >
          {w.node}
          {w.href ? <WidgetOpenOverlay href={w.href} label={w.title} /> : null}
        </div>
      ))}
    </div>
  );
}
