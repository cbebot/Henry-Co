"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  type Transition,
  type Variants,
} from "framer-motion";
import { Menu, X } from "lucide-react";
import type { HubHomeCopy } from "@henryco/i18n";
import type { PublicAccountUser } from "@henryco/ui";
import { cn, HenryCoPublicAccountPresets, PublicAccountChip } from "@henryco/ui";
import { HenryCoLogo } from "@henryco/brand";

// House curve — shared with home-motion's reveal so the chrome settles like the
// rest of the page.
const EASE_OUT: Transition["ease"] = [0.22, 1, 0.36, 1];

// The in-page section anchors the scroll-spy watches. Stable module constant so
// the IntersectionObserver effect never re-subscribes on re-render.
const SPY_IDS = ["standard", "engines", "standard-why"] as const;

export type HomeAccountChip = {
  user: PublicAccountUser | null;
  loginHref: string;
  signupHref: string;
  accountHref: string;
};

type NavTarget =
  | { kind: "spy"; id: string; label: string }
  | { kind: "route"; href: string; label: string };

type HomeHeaderProps = {
  brandTitle: string;
  brandSub: string;
  brandLogoUrl: string | null;
  copy: HubHomeCopy;
  accountChip?: HomeAccountChip;
};

/**
 * Skip-link the shared shell would normally provide. The homepage renders
 * `children` alone, so we restore the keyboard entry point ourselves: it jumps
 * focus to `<main id="henryco-main">`, which the orchestrator owns.
 */
export function HomeSkipLink({ label }: { label: string }) {
  return (
    <a
      href="#henryco-main"
      className="sr-only left-4 top-4 z-[80] rounded-xl bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-black focus:not-sr-only focus:absolute focus:outline-none focus:ring-2 focus:ring-white/70"
    >
      {label}
    </a>
  );
}

function HomeWordmark({
  brandTitle,
  brandSub,
  brandLogoUrl,
}: {
  brandTitle: string;
  brandSub: string;
  brandLogoUrl: string | null;
}) {
  return (
    <a href="#top" aria-label={brandTitle} className="flex shrink-0 items-center gap-3">
      <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl border border-white/12 bg-white/[0.05]">
        {brandLogoUrl ? (
          <Image
            src={brandLogoUrl}
            alt={`${brandTitle} logo`}
            fill
            sizes="40px"
            className="object-contain p-1.5"
          />
        ) : (
          <HenryCoLogo variant="mark" label={brandTitle} className="h-full w-full p-1.5" />
        )}
      </span>
      <span className="leading-tight">
        <span
          className="block text-sm font-semibold tracking-[0.16em] text-white/92"
          style={{ fontFamily: "var(--acct-font-display)" }}
        >
          {brandTitle}
        </span>
        <span className="block text-[10px] uppercase tracking-[0.3em] text-white/45">
          {brandSub}
        </span>
      </span>
    </a>
  );
}

function MobileSheet({
  onClose,
  targets,
  active,
  reduce,
  copy,
  menuId,
}: {
  onClose: () => void;
  targets: NavTarget[];
  active: string;
  reduce: boolean;
  copy: HubHomeCopy;
  menuId: string;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  // Move focus into the sheet on open (the shared shell's focus management is
  // absent here, so the dialog owns it).
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // Minimal focus trap: keep Tab inside the panel while the dialog is open.
  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key !== "Tab") return;
    const container = panelRef.current;
    if (!container) return;
    const focusables = Array.from(
      container.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const backdrop: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: reduce ? 0 : 0.2, ease: EASE_OUT } },
  };
  const panel: Variants = {
    hidden: { x: reduce ? 0 : "100%" },
    visible: { x: 0, transition: { duration: reduce ? 0 : 0.3, ease: EASE_OUT } },
  };

  return (
    <motion.div className="fixed inset-0 z-[70] md:hidden" initial="hidden" animate="visible" exit="hidden">
      <motion.button
        type="button"
        aria-label={copy.nav.closeMenu}
        onClick={onClose}
        variants={backdrop}
        className="absolute inset-0 h-full w-full bg-black/70 backdrop-blur-sm"
      />
      <motion.div
        ref={panelRef}
        id={menuId}
        role="dialog"
        aria-modal="true"
        aria-label={copy.nav.menu}
        variants={panel}
        onKeyDown={handleKeyDown}
        className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col border-l border-white/10 bg-[#0B1020] shadow-[0_40px_140px_rgba(0,0,0,0.55)]"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45">
            {copy.nav.menu}
          </span>
          <button
            ref={closeRef}
            type="button"
            aria-label={copy.nav.closeMenu}
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl border border-white/12 bg-white/[0.05] text-white/80 transition hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label={copy.nav.menu} className="flex flex-1 flex-col gap-1 px-4 py-6">
          {targets.map((target) => {
            const href = target.kind === "spy" ? `#${target.id}` : target.href;
            const isActive = target.kind === "spy" && active === target.id;
            return (
              <a
                key={target.label}
                href={href}
                onClick={onClose}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "border-l-2 py-3 pl-4 text-base transition-colors",
                  isActive
                    ? "border-[color:var(--accent)] text-white"
                    : "border-transparent text-white/70 hover:text-white",
                )}
                style={isActive ? undefined : { fontFamily: "var(--acct-font-display)" }}
              >
                {target.label}
              </a>
            );
          })}

          <div className="my-4 h-px bg-white/10" />

          <a
            href="/search"
            onClick={onClose}
            className="py-2.5 pl-4 text-sm text-white/55 transition-colors hover:text-white"
          >
            {copy.topBar.search}
          </a>
          <a
            href="/preferences"
            onClick={onClose}
            className="py-2.5 pl-4 text-sm text-white/55 transition-colors hover:text-white"
          >
            {copy.footer.linkPreferences}
          </a>
        </nav>
      </motion.div>
    </motion.div>
  );
}

/**
 * HomeHeader — the homepage's bespoke sticky-glass header.
 *
 * The shared `PublicSiteShell` renders the homepage's `children` alone (no
 * shared header), so this surface owns its entire top chrome: wordmark,
 * scroll-spy primary nav, the public account chip, and a focus-trapped mobile
 * sheet. It condenses slightly on scroll; under reduced motion the condense is
 * an instant style swap and the active-section underline never slides.
 */
export function HomeHeader({
  brandTitle,
  brandSub,
  brandLogoUrl,
  copy,
  accountChip,
}: HomeHeaderProps) {
  const reduce = useReducedMotion() ?? false;
  const menuId = useId();
  const [active, setActive] = useState<string>(SPY_IDS[0]);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const wasOpen = useRef(false);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => {
    const next = y > 8;
    setScrolled((prev) => (prev === next ? prev : next));
  });

  // Scroll-spy: highlight the nav link for whichever section dominates the
  // viewport. Re-runs only when section nodes mount (they exist as skeleton
  // slots in Stage 1, then fill with real content later).
  useEffect(() => {
    const elements = SPY_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => Boolean(el),
    );
    if (!elements.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Body scroll lock + Escape-to-close while the mobile sheet is open.
  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // Restore focus to the trigger after the sheet closes.
  useEffect(() => {
    if (wasOpen.current && !menuOpen) triggerRef.current?.focus();
    wasOpen.current = menuOpen;
  }, [menuOpen]);

  const targets: NavTarget[] = [
    { kind: "spy", id: "standard", label: copy.nav.overview },
    { kind: "spy", id: "engines", label: copy.nav.engines },
    { kind: "spy", id: "standard-why", label: copy.nav.oneStandard },
    { kind: "route", href: "/about", label: copy.nav.about },
    { kind: "route", href: "/contact", label: copy.nav.contact },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-lg transition-[background-color,border-color,box-shadow,padding] duration-300",
        scrolled
          ? "border-white/12 bg-[#050816]/95 shadow-[0_18px_50px_-30px_rgba(0,0,0,0.9)]"
          : "border-white/8 bg-[#050816]/70",
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 transition-[padding] duration-300 sm:px-6 lg:px-8",
          scrolled ? "py-2.5" : "py-4",
        )}
      >
        <HomeWordmark brandTitle={brandTitle} brandSub={brandSub} brandLogoUrl={brandLogoUrl} />

        <nav aria-label={copy.nav.company} className="hidden items-center gap-7 md:flex">
          {targets.map((target) => {
            const href = target.kind === "spy" ? `#${target.id}` : target.href;
            const isActive = target.kind === "spy" && active === target.id;
            return (
              <a
                key={target.label}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative py-1 text-sm tracking-tight transition-colors",
                  isActive ? "text-white" : "text-white/60 hover:text-white/90",
                )}
              >
                {target.label}
                {isActive ? (
                  reduce ? (
                    <span
                      aria-hidden
                      className="absolute -bottom-1 left-0 right-0 h-px bg-[color:var(--accent)]"
                    />
                  ) : (
                    <motion.span
                      aria-hidden
                      layoutId="home-nav-underline"
                      className="absolute -bottom-1 left-0 right-0 h-px bg-[color:var(--accent)]"
                      transition={{ duration: 0.32, ease: EASE_OUT }}
                    />
                  )
                ) : null}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {accountChip ? (
            <PublicAccountChip
              {...HenryCoPublicAccountPresets.onDarkMarketing}
              user={accountChip.user}
              loginHref={accountChip.loginHref}
              signupHref={accountChip.signupHref}
              accountHref={accountChip.accountHref}
              showSignOut
              menuItems={[
                { label: copy.nav.engines, href: "/#engines" },
                { label: copy.nav.about, href: "/about" },
                { label: copy.nav.contact, href: "/contact" },
              ]}
            />
          ) : null}

          <button
            ref={triggerRef}
            type="button"
            aria-label={copy.nav.menu}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/12 bg-white/[0.05] text-white/80 transition hover:bg-white/10 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen ? (
          <MobileSheet
            onClose={() => setMenuOpen(false)}
            targets={targets}
            active={active}
            reduce={reduce}
            copy={copy}
            menuId={menuId}
          />
        ) : null}
      </AnimatePresence>
    </header>
  );
}
