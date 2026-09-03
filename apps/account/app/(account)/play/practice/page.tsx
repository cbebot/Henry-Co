import { getArenaCopy } from "@henryco/i18n";

import { requireAccountUser } from "@/lib/auth";
import { getAccountAppLocale } from "@/lib/locale-server";
import { PracticeClient } from "../_components/PracticeClient";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getAccountAppLocale();
  const copy = getArenaCopy(locale);
  return { title: `${copy.practice.cta} — ${copy.metadata.title}` };
}

/**
 * Practice vs the Onyx AI. Needs no arena flag and no server match: the games
 * run entirely client-side on the pure rules, so a signed-in user can learn
 * and play immediately even while live multiplayer stays dark.
 */
export default async function PracticePage() {
  await requireAccountUser();
  const locale = await getAccountAppLocale();
  const copy = getArenaCopy(locale);
  return (
    <div className="acct-play acct-fade-in" style={{ maxWidth: 860, margin: "0 auto" }}>
      <PracticeClient copy={copy} />
    </div>
  );
}
