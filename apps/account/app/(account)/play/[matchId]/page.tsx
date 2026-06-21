import { notFound } from "next/navigation";
import { getArenaCopy } from "@henryco/i18n";

import { requireAccountUser } from "@/lib/auth";
import { getAccountAppLocale } from "@/lib/locale-server";
import { isGamingArenaReady } from "@/lib/gaming/arena-flag";
import { MatchClient } from "../_components/MatchClient";

export const dynamic = "force-dynamic";

export default async function MatchPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  if (!isGamingArenaReady()) notFound();
  const [locale] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const copy = getArenaCopy(locale);
  return (
    <div className="acct-play acct-fade-in" style={{ padding: "8px 0" }}>
      <MatchClient matchId={matchId} copy={copy} />
    </div>
  );
}
