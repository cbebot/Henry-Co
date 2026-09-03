import { headers } from "next/headers";
import { LEARN_ROLE_VOCAB, resolveChromePlan, standingFromRoles } from "@henryco/aware";
import { getAccountUrl } from "@henryco/config";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import { getLearnViewer } from "@/lib/learn/auth";
import { getLearnPublicLocale } from "@/lib/locale-server";
import { getAccountLearnUrl, getSharedAuthUrl } from "@/lib/learn/links";
import { LearnSiteHeaderClient } from "@/components/learn/site-header-client";

export async function LearnSiteHeader() {
  const [viewer, h, locale] = await Promise.all([
    getLearnViewer(),
    headers(),
    getLearnPublicLocale(),
  ]);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const returnPath = h.get("x-learn-return-path") || "/";
  const accountHref = getAccountLearnUrl();
  const loginHref = getSharedAuthUrl("login", returnPath);
  const signupHref = getSharedAuthUrl("signup", returnPath);
  const chipUser = viewer.user
    ? {
        displayName: viewer.user.fullName || viewer.user.email || "Your account",
        email: viewer.user.email,
        avatarUrl: viewer.user.avatarUrl,
      }
    : null;

  // AWARE-SP3: an instructor's chrome opens their console; a learner/visitor
  // gets "Explore courses" with a "teach with us" aside. Tested matrix in
  // @henryco/aware.
  const standing = standingFromRoles(
    { signedIn: Boolean(viewer.user), roles: viewer.roles },
    LEARN_ROLE_VOCAB,
  );
  const plan = resolveChromePlan("learn", standing);
  const localize = (cta: { label: string; href: string }) => ({ label: t(cta.label), href: cta.href });

  return (
    <LearnSiteHeaderClient
      accountChipUser={chipUser}
      accountHref={accountHref}
      loginHref={loginHref}
      signupHref={signupHref}
      preferencesHref={getAccountUrl("/settings")}
      settingsHref={getAccountUrl("/security")}
      primaryCta={localize(plan.primaryCta)}
      auxLink={plan.aside ? localize(plan.aside) : undefined}
      operatorMenuItem={
        standing.kind === "operator" && plan.workspace ? localize(plan.workspace) : undefined
      }
    />
  );
}
