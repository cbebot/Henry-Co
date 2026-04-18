import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Shield } from "lucide-react";
import { formatSurfaceTemplate, translateSurfaceLabel } from "@henryco/i18n/server";
import { requireAccountUser } from "@/lib/auth";
import { getSecurityMessageBoard } from "@/lib/message-center";
import { formatDateTime } from "@/lib/format";
import { getAccountAppLocale } from "@/lib/locale-server";
import PageHeader from "@/components/layout/PageHeader";

function localizeSecurityCategory(
  t: (text: string) => string,
  category: string
) {
  const normalized = category.trim().toLowerCase().replace(/[_-]+/g, " ");

  switch (normalized) {
    case "alert":
      return t("Alert");
    case "sensitive change":
      return t("Sensitive change");
    case "session":
      return t("Session");
    case "sign in":
      return t("Sign in");
    default: {
      const capitalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
      const translated = t(capitalized);
      return translated !== capitalized ? translated : capitalized;
    }
  }
}

function localizeRiskLabel(
  t: (text: string) => string,
  riskLevel: string
) {
  switch (riskLevel.trim().toLowerCase()) {
    case "high":
      return t("High risk");
    case "medium":
      return t("Medium risk");
    default:
      return t("Low risk");
  }
}

function localizeDeviceSummary(
  t: (text: string) => string,
  summary: string
) {
  const trimmed = summary.trim();
  if (!trimmed) return "";
  if (trimmed === "Unknown device") return t(trimmed);

  const match = trimmed.match(/^(Desktop|Mobile|Tablet) · (.+) on (.+)$/);
  if (!match) return trimmed;

  const [, device, browser, platform] = match;
  return formatSurfaceTemplate(t("{device} · {browser} on {platform}"), {
    device: t(device),
    browser: t(browser),
    platform: t(platform),
  });
}

function localizeLocationSummary(
  t: (text: string) => string,
  summary: string
) {
  const trimmed = summary.trim();
  if (!trimmed) return "";
  if (trimmed === "Location not available") return t(trimmed);
  if (trimmed.startsWith("Approximate source IP ")) {
    return formatSurfaceTemplate(t("Approximate source IP {ip}"), {
      ip: trimmed.slice("Approximate source IP ".length),
    });
  }

  return trimmed;
}

function localizeSecurityTitle(
  t: (text: string) => string,
  eventType: string,
  fallback: string
) {
  const humanized = eventType
    .trim()
    .replace(/sign_in/gi, "Sign in")
    .replace(/sign_out/gi, "Sign out")
    .replace(/login/gi, "Login")
    .replace(/logout/gi, "Logout")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());

  const direct = humanized ? t(humanized) : fallback;
  if (humanized && direct !== humanized) {
    return direct;
  }

  return fallback
    .replaceAll("Suspicious", t("Suspicious"))
    .replaceAll("Failed", t("Failed"))
    .replaceAll("Blocked", t("Blocked"))
    .replaceAll("Password", t("Password"))
    .replaceAll("Credential", t("Credential"))
    .replaceAll("Recovery", t("Recovery"))
    .replaceAll("OTP", t("OTP"))
    .replaceAll("Login", t("Login"))
    .replaceAll("Logout", t("Logout"))
    .replaceAll("Sign In", t("Sign in"))
    .replaceAll("Sign Out", t("Sign out"))
    .replaceAll("Session", t("Session"))
    .replaceAll("Security", t("Security"))
    .replaceAll("Alert", t("Alert"));
}

export default async function SecurityMessageBoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const data = await getSecurityMessageBoard(user.id, id);

  if (!data) {
    notFound();
  }

  const sourceLabel = t(data.source.label);
  const eventTitle = localizeSecurityTitle(t, data.record.eventType, data.record.title);

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title={t("Security event")}
        description={t("A deeper drill-down into one account-safety event.")}
        icon={Shield}
        actions={
          <Link href={data.record.relatedUrl} className="acct-button-primary rounded-xl">
            {t(data.record.relatedLabel)} <ChevronRight size={14} />
          </Link>
        }
      />

      <section className="rounded-[2rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em]"
            style={{
              backgroundColor: `${data.source.accent}18`,
              color: data.source.accent,
            }}
          >
            {sourceLabel}
          </span>
          <span className="rounded-full bg-[var(--acct-red-soft)] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-red)]">
            {localizeRiskLabel(t, data.record.riskLevel)}
          </span>
          <span className="rounded-full bg-[var(--acct-surface)] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">
            {localizeSecurityCategory(t, data.record.category)}
          </span>
        </div>

        <h2 className="mt-4 text-xl font-semibold text-[var(--acct-ink)]">{eventTitle}</h2>
        <p className="mt-2 text-sm text-[var(--acct-muted)]">
          {formatDateTime(data.record.createdAt, { locale })}
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.5rem] bg-[var(--acct-bg)] p-5">
            <p className="acct-kicker">{t("Device summary")}</p>
            <p className="mt-3 text-sm leading-7 text-[var(--acct-ink)]">
              {localizeDeviceSummary(t, data.record.deviceSummary)}
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-[var(--acct-bg)] p-5">
            <p className="acct-kicker">{t("Location summary")}</p>
            <p className="mt-3 text-sm leading-7 text-[var(--acct-ink)]">
              {localizeLocationSummary(t, data.record.locationSummary)}
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-[var(--acct-surface)] p-5">
            <p className="acct-kicker">{t("IP address")}</p>
            <p className="mt-3 text-sm leading-7 text-[var(--acct-ink)]">
              {data.record.ipAddress || t("Not captured")}
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-[var(--acct-surface)] p-5">
            <p className="acct-kicker">{t("Browser string")}</p>
            <p className="mt-3 break-words text-sm leading-7 text-[var(--acct-ink)]">
              {data.record.userAgent || t("Not captured")}
            </p>
          </div>
        </div>
      </section>

      <section className="acct-card p-5">
        <p className="acct-kicker">{t("Related alerts")}</p>
        {data.history.length === 0 ? (
          <p className="mt-4 rounded-[1.3rem] bg-[var(--acct-surface)] px-4 py-5 text-sm text-[var(--acct-muted)]">
            {t("No related security notices are attached yet.")}
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {data.history.map((item) => (
              <Link
                key={`${item.kind}-${item.id}`}
                href={item.href}
                className="block rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] px-4 py-4 transition hover:border-[var(--acct-gold)]/30 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--acct-ink)]">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--acct-muted)]">{item.body}</p>
                  </div>
                  <span className="text-[0.72rem] text-[var(--acct-muted)]">
                    {formatDateTime(item.createdAt, { locale })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
