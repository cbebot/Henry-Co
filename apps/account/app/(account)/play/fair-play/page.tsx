import { getArenaCopy } from "@henryco/i18n";
import { getDivisionConfig } from "@henryco/config";

import { getAccountAppLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getAccountAppLocale();
  const copy = getArenaCopy(locale);
  return { title: copy.fairness.title, description: copy.fairness.body };
}

export default async function FairPlayPage() {
  const locale = await getAccountAppLocale();
  const copy = getArenaCopy(locale);
  const division = getDivisionConfig("gaming");

  return (
    <div className="acct-play acct-fade-in" style={{ maxWidth: 680, margin: "0 auto", display: "grid", gap: 16 }}>
      <header>
        <p style={{ color: "var(--acct-div-gaming)", fontWeight: 600, margin: 0 }}>{division.name}</p>
        <h1 style={{ fontSize: 26, color: "var(--acct-ink)", margin: "6px 0" }}>{copy.fairness.title}</h1>
      </header>
      <p style={{ color: "var(--acct-muted)", lineHeight: 1.6 }}>{copy.fairness.body}</p>
      <div
        style={{
          background: "var(--acct-surface)",
          border: "1px solid var(--acct-line)",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <p style={{ color: "var(--acct-ink)", margin: 0, fontWeight: 600 }}>{copy.games["onyx-lines"].name}</p>
        <p style={{ color: "var(--acct-muted)", margin: "6px 0 0", lineHeight: 1.6 }}>{copy.fairness.zeroRngNote}</p>
      </div>
    </div>
  );
}
