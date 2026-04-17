import Link from "next/link";
import { headers } from "next/headers";
import { PublicAccountChip } from "@henryco/ui";
import { getAccountUrl, getDivisionConfig } from "@henryco/config";
import { getStudioCatalog } from "@/lib/studio/catalog";
import { getStudioViewer } from "@/lib/studio/auth";
import { getStudioAccountUrl, getStudioLoginUrl, getStudioSignupUrl } from "@/lib/studio/links";

const studio = getDivisionConfig("studio");

export async function ProjectWorkspaceHeader() {
  const catalog = await getStudioCatalog();
  const viewer = await getStudioViewer();
  const h = await headers();
  const returnPath = h.get("x-studio-return-path") || "/";
  const loginHref = getStudioLoginUrl(returnPath);
  const signupHref = getStudioSignupUrl(returnPath);
  const accountUrl = getStudioAccountUrl();
  const chipUser = viewer.user
    ? {
        displayName: viewer.user.fullName || viewer.user.email || "Your account",
        email: viewer.user.email,
        avatarUrl: viewer.user.avatarUrl,
      }
    : null;

  return (
    <header className="border-b border-[var(--studio-line)] bg-[var(--studio-bg)] shadow-[inset_0_-1px_0_rgba(255,255,255,0.04)]">
      <div className="mx-auto flex max-w-[88rem] flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="studio-brand-mark">
              <span>HC</span>
            </div>
            <div>
              <div className="studio-kicker">{studio.shortName}</div>
              <div className="text-sm font-semibold text-[var(--studio-ink)]">Client workspace</div>
            </div>
          </Link>
          <span className="hidden h-8 w-px bg-[var(--studio-line)] sm:block" aria-hidden />
          <p className="hidden max-w-md text-xs leading-5 text-[var(--studio-ink-soft)] sm:block">
            Payments, milestones, and deliverables — all in one secure workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={accountUrl}
            className="hidden rounded-full border border-[var(--studio-line)] px-4 py-2.5 text-sm font-medium text-[var(--studio-ink-soft)] transition hover:border-[rgba(151,244,243,0.28)] hover:text-[var(--studio-ink)] sm:inline-flex"
          >
            My account
          </Link>
          <PublicAccountChip
            user={chipUser}
            loginHref={loginHref}
            signupHref={signupHref}
            accountHref={accountUrl}
            preferencesHref={getAccountUrl("/settings#privacy-controls")}
            settingsHref={getAccountUrl("/security")}
            showSignOut
            buttonClassName="border-[var(--studio-line)] bg-[var(--studio-bg-soft)] text-[var(--studio-ink)] hover:border-[rgba(151,244,243,0.35)] hover:bg-[color-mix(in_srgb,var(--studio-bg-soft)_92%,#000)]"
            dropdownClassName="border-[var(--studio-line)] bg-[var(--studio-bg-soft)] shadow-[0_24px_64px_rgba(0,0,0,0.45)]"
            menuItems={[
              { label: "View in my account", href: `${accountUrl}?ref=studio-project` },
              { label: "Start another project", href: "/request" },
              { label: "Studio home", href: "/" },
            ]}
          />
        </div>
      </div>
      {catalog.platform.supportEmail ? (
        <div className="border-t border-[var(--studio-line)]/60 bg-black/10 px-5 py-2 text-center text-[11px] text-[var(--studio-ink-soft)] sm:px-8 lg:px-10">
          Questions on payment or scope?{" "}
          <a className="font-medium text-[var(--studio-signal)]" href={`mailto:${catalog.platform.supportEmail}`}>
            {catalog.platform.supportEmail}
          </a>
        </div>
      ) : null}
    </header>
  );
}
