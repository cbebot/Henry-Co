import { headers } from "next/headers";
import { getAccountUrl, getDivisionConfig } from "@henryco/config";
import { getPassiveLearnViewer } from "@/lib/learn/auth";
import { getAccountLearnUrl, getSharedAuthUrl } from "@/lib/learn/links";
import { BrandMark } from "@/components/learn/ui";
import { LearnSiteHeaderClient } from "@/components/learn/site-header-client";

const learn = getDivisionConfig("learn");

export async function LearnSiteHeader() {
  const viewer = await getPassiveLearnViewer();
  const h = await headers();
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

  return (
    <LearnSiteHeaderClient
      brandName={learn.name}
      brandMark={<BrandMark />}
      accountChipUser={chipUser}
      accountHref={accountHref}
      loginHref={loginHref}
      signupHref={signupHref}
      preferencesHref={getAccountUrl("/settings#privacy-controls")}
      settingsHref={getAccountUrl("/security")}
    />
  );
}
