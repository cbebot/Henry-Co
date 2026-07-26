import { redirect } from "next/navigation";
import { buildUnifiedViewer } from "@henryco/auth/server";
import { parseHenryFeatureFlags, isFlagEnabled } from "@henryco/intelligence";
import { getEligibleModules, type ModuleSlug } from "@henryco/dashboard-shell";
import type { SignalFeedItem, TypedSupabaseClient } from "@henryco/data";
import { getUserHomeLayout } from "@henryco/data/home-layout";
import { getPersonalizationCopy } from "@henryco/i18n/server";
import { translateSurfaceLabel } from "@henryco/i18n";
import { toBrandName } from "@henryco/config";
import { requireAccountUser } from "@/lib/auth";
import { getAccountAppLocale } from "@/lib/locale-server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getCachedSignalFeed } from "@/lib/smart-home/signal-feed-cache";
import { deriveBlockedModules } from "@/lib/personalization/signal-scores";
import { CustomizeHomeClient } from "@/components/customize/CustomizeHomeClient";

// Side-effect: register modules so getEligibleModules() has the registry.
import "@/app/(account)/_modules";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getAccountAppLocale();
  const copy = getPersonalizationCopy(locale);
  return { title: toBrandName(`${copy.customize.title} · Henry Onyx`) };
}

export default async function CustomizePage() {
  // Flag-dark: the customize surface only exists when the projection it drives
  // is live. Off ⇒ redirect home (the saved layout would otherwise not apply).
  if (
    !isFlagEnabled(
      parseHenryFeatureFlags(process.env as Record<string, string | undefined>),
      "personalization_home",
    )
  ) {
    redirect("/");
  }

  const user = await requireAccountUser();
  const [viewer, locale] = await Promise.all([
    buildUnifiedViewer({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
    }),
    getAccountAppLocale(),
  ]);

  const copy = getPersonalizationCopy(locale).customize;
  const modules = getEligibleModules(viewer);
  const known = new Set<ModuleSlug>(modules.map((m) => m.slug));

  const client = (await createSupabaseServer()) as unknown as TypedSupabaseClient;
  const [layout, feed] = await Promise.all([
    getUserHomeLayout(client, viewer, "account").catch(() => null),
    getCachedSignalFeed(viewer, { limit: 50 }).catch(
      () => ({ items: [] as SignalFeedItem[], nextCursor: null }),
    ),
  ]);
  const blocked = deriveBlockedModules(feed.items, null, known);

  const moduleList = modules.map((m) => ({
    slug: m.slug,
    title: translateSurfaceLabel(locale, m.title),
    blocked: blocked.has(m.slug),
  }));

  return (
    <div className="acct-fade-in">
      <CustomizeHomeClient
        modules={moduleList}
        initial={{
          desktopOrder: layout?.desktopModuleOrder ?? [],
          mobileOrder: layout?.mobileModuleOrder ?? [],
          hidden: layout?.hiddenModules ?? [],
          pinned: layout?.pinnedModules ?? [],
        }}
        copy={copy}
      />
    </div>
  );
}
