import { getArenaCopy } from "@henryco/i18n";

import { getAccountAppLocale } from "@/lib/locale-server";
import { VerifyClient } from "./VerifyClient";

export const dynamic = "force-dynamic";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ match?: string }>;
}) {
  const [{ match }, locale] = await Promise.all([searchParams, getAccountAppLocale()]);
  const copy = getArenaCopy(locale);
  return (
    <div className="acct-play acct-fade-in" style={{ maxWidth: 640, margin: "0 auto", padding: "8px 0" }}>
      <VerifyClient copy={copy} matchId={match ?? ""} />
    </div>
  );
}
