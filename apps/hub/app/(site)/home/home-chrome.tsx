"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
import { cn, HenryCoPublicAccountPresets, PublicAccountChip, ThemeToggle } from "@henryco/ui";
import { HenryCoLogo } from "@henryco/brand";

// House curve — shared with home-motion's reveal so the chrome settles like the
// rest of the page.
const EASE_OUT: Transition["ease"] = [0.22, 1, 0.36, 1];

// The in-page section anchors the scroll-spy watches — every editorial section,
// in document order. Sections without a matching nav link (e.g. "proof") are
// still observed so the active state clears cleanly there instead of freezing
// on the previous link. Stable module constant so the IntersectionObserver
// effect never re-subscribes on re-render.
const SPY_IDS = ["standard", "engines", "standard-why", "proof", "questions"] as const;

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
      className="sr-only left-4 top-4 z-[80] rounded-xl bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-black focus:not-sr-only focus:absolute focus:outline-none focus:ring-2 focus:ring-[color:var(--home-ink-70)]"
    >
      {label}
    </a>
  );
}

function HomeWordmark({
  brandTitle,
  brandSub,
}: {
  brandTitle: string;
  brandSub: string;
}) {
  return (
    <a href="#top" aria-label={brandTitle} className="flex shrink-0 items-center gap-3">
      <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl border border-[color:var(--home-line-12)] bg-[color:var(--home-surface)]">
        <HenryCoLogo variant="mark" label={brandTitle} className="h-full w-full p-1.5" />
      </span>
      <span className="leading-tight">
        <span
          className="block text-sm font-semibold tracking-[0.16em] text-[color:var(--home-ink-92)]"
          style={{ fontFamily: "var(--acct-font-display)" }}
        >
          {brandTitle}
        </span>
        <span className="block text-[10px] uppercase tracking-[0.3em] text-[color:var(--home-ink-50)]">
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

  // Render OUTSIDE the sticky header via a portal. The header has
  // `backdrop-blur`, which establishes a containing block for fixed descendants
  // — so a sheet rendered inside it would size to the header (≈64px), not the
  // viewport, and its content would spill out transparently. Portaling to
  // <body> anchors the overlay to the viewport, exactly like the shared shell's
  // mobile drawer does on every other public page.
  if (typeof document === "undefined") return null;

  return createPortal(
    <motion.div className="fixed inset-0 z-[120] md:hidden" initial="hidden" animate="visible" exit="hidden">
      <motion.button
        type="button"
        aria-label={copy.nav.closeMenu}
        onClick={onClose}
        variants={backdrop}
        className="absolute inset-0 h-full w-full bg-black/55 backdrop-blur-md"
      />
      <motion.div
        ref={panelRef}
        id={menuId}
        role="dialog"
        aria-modal="true"
        aria-label={copy.nav.menu}
        variants={panel}
        onKeyDown={handleKeyDown}
        className="absolute inset-y-0 right-0 flex h-full w-[86%] max-w-sm flex-col border-l border-[color:var(--home-line-12)] bg-[color:var(--home-sheet)] shadow-[0_40px_140px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-center justify-between border-b border-[color:var(--home-line)] px-5 py-4">
          <span className="home-eyebrow text-[color:var(--home-ink-50)]">{copy.nav.menu}</span>
          <button
            ref={closeRef}
            type="button"
            aria-label={copy.nav.closeMenu}
            onClick={onClose}
            className="home-focus grid h-10 w-10 place-items-center rounded-xl border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-04)] text-[color:var(--home-ink-80)] transition hover:bg-[color:var(--home-surface-10)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav
          aria-label={copy.nav.menu}
          className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-5"
        >
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
                  "home-focus rounded-2xl border px-4 py-3.5 text-base font-medium transition-colors",
                  isActive
                    ? "border-[color:var(--home-accent)] bg-[color:var(--home-accent-soft)] text-[color:var(--home-ink)]"
                    : "border-[color:var(--home-line-12)] bg-[color:var(--home-surface-04)] text-[color:var(--home-ink-75)] hover:border-[color:var(--home-line-15)] hover:bg-[color:var(--home-surface-07)] hover:text-[color:var(--home-ink)]",
                )}
              >
                {target.label}
              </a>
            );
          })}
        </nav>

        <div className="border-t border-[color:var(--home-line)] px-4 pb-[max(env(safe-area-inset-bottom,0px),1rem)] pt-4">
          <ThemeToggle className="w-full justify-center" />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a
              href="/search"
              onClick={onClose}
              className="home-focus rounded-xl border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-04)] px-3 py-2.5 text-center text-sm text-[color:var(--home-ink-65)] transition-colors hover:text-[color:var(--home-ink)]"
            >
              {copy.topBar.search}
            </a>
            <a
              href="/preferences"
              onClick={onClose}
              className="home-focus rounded-xl border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-04)] px-3 py-2.5 text-center text-sm text-[color:var(--home-ink-65)] transition-colors hover:text-[color:var(--home-ink)]"
            >
              {copy.footer.linkPreferences}
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
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
  // viewport. Subscribes once on mount; every SPY_IDS section is a real,
  // always-present landmark, so the observer set is stable.
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
    { kind: "spy", id: "questions", label: copy.nav.faq },
    { kind: "route", href: "/about", label: copy.nav.about },
    { kind: "route", href: "/contact", label: copy.nav.contact },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-lg transition-[background-color,border-color,box-shadow,padding] duration-300",
        scrolled
          ? "border-[color:var(--home-line-12)] bg-[color:var(--home-glass-strong)] shadow-[0_18px_50px_-30px_rgba(0,0,0,0.9)]"
          : "border-[color:var(--home-line-08)] bg-[color:var(--home-glass)]",
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 transition-[padding] duration-300 sm:px-6 lg:px-8",
          // CHROME-64: resting height 12+40+12 = 64px — the ecosystem chrome
          // standard every division header sits at; scrolled tightens further.
          scrolled ? "py-2.5" : "py-3",
        )}
      >
        <HomeWordmark brandTitle={brandTitle} brandSub={brandSub} />

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
                  isActive ? "text-[color:var(--home-ink)]" : "text-[color:var(--home-ink-60)] hover:text-[color:var(--home-ink-90)]",
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
          <ThemeToggle className="hidden md:inline-flex" />

          {accountChip ? (
            <PublicAccountChip
              {...HenryCoPublicAccountPresets.standard}
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
            className="grid h-10 w-10 place-items-center rounded-xl border border-[color:var(--home-line-12)] bg-[color:var(--home-surface)] text-[color:var(--home-ink-80)] transition hover:bg-[color:var(--home-surface-10)] md:hidden"
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
