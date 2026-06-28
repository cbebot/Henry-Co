"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Compass, Search, X } from "lucide-react";

import { accountNavItems, type NavItem } from "@/lib/navigation";

const SECTION_ORDER = ["Account", "Financial", "Services", "Settings"] as const;

function uniqueNavItems(items: NavItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function sectionForPath(pathname: string, items: NavItem[]) {
  const match = [...items]
    .sort((left, right) => right.href.length - left.href.length)
    .find((item) => isActive(pathname, item.href));
  return match?.section || "Account";
}

export function MobileDashboardNavigator() {
  const pathname = usePathname() ?? "/";
  const navItems = useMemo(() => uniqueNavItems(accountNavItems), []);
  const grouped = useMemo(() => {
    const map = new Map<string, NavItem[]>();
    for (const item of navItems) {
      const section = item.section || "Account";
      map.set(section, [...(map.get(section) ?? []), item]);
    }
    return map;
  }, [navItems]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const currentSection = sectionForPath(pathname, navItems);
  const [activeSection, setActiveSection] = useState(currentSection);
  const selectedSection = open ? activeSection : currentSection;

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const normalizedQuery = query.trim().toLowerCase();
  const visibleItems = normalizedQuery
    ? navItems.filter((item) =>
        `${item.label} ${item.section || ""} ${item.href}`.toLowerCase().includes(normalizedQuery),
      )
    : grouped.get(selectedSection) ?? navItems;
  const sections = SECTION_ORDER.filter((section) => grouped.has(section));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: MOBILE_DASHBOARD_NAV_CSS }} />
      <button
        type="button"
        className="acct-mobile-dashnav__trigger"
        onClick={() => {
          setActiveSection(currentSection);
          setOpen(true);
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Open dashboard navigation"
      >
        <Compass size={18} aria-hidden />
        <span>Dashboard</span>
      </button>

      {open ? (
        <div
          className="acct-mobile-dashnav__overlay"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <section
            className="acct-mobile-dashnav__panel"
            role="dialog"
            aria-modal="true"
            aria-label="Dashboard navigation"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="acct-mobile-dashnav__handle" aria-hidden />
            <header className="acct-mobile-dashnav__head">
              <div>
                <p className="acct-mobile-dashnav__kicker">Dashboard</p>
                <h2>All pages</h2>
              </div>
              <button
                type="button"
                className="acct-mobile-dashnav__icon-button"
                onClick={() => setOpen(false)}
                aria-label="Close dashboard navigation"
              >
                <X size={18} aria-hidden />
              </button>
            </header>

            <label className="acct-mobile-dashnav__search">
              <Search size={16} aria-hidden />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search pages"
                data-hc-no-zoom
              />
            </label>

            {!normalizedQuery ? (
              <div className="acct-mobile-dashnav__tabs" role="tablist" aria-label="Navigation sections">
                {sections.map((section) => (
                  <button
                    key={section}
                    type="button"
                    role="tab"
                    aria-selected={selectedSection === section}
                    className="acct-mobile-dashnav__tab"
                    data-active={selectedSection === section ? "true" : "false"}
                    onClick={() => setActiveSection(section)}
                  >
                    {section}
                  </button>
                ))}
              </div>
            ) : null}

            <nav className="acct-mobile-dashnav__list" aria-label="Dashboard pages">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={`${item.section || "Account"}-${item.href}`}
                    href={item.href}
                    className="acct-mobile-dashnav__item"
                    data-active={active ? "true" : "false"}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    <span className="acct-mobile-dashnav__item-icon" aria-hidden>
                      <Icon size={17} />
                    </span>
                    <span className="acct-mobile-dashnav__item-body">
                      <span className="acct-mobile-dashnav__item-label">{item.label}</span>
                      <span className="acct-mobile-dashnav__item-section">{item.section || "Account"}</span>
                    </span>
                    <ChevronRight size={16} aria-hidden />
                  </Link>
                );
              })}
            </nav>
          </section>
        </div>
      ) : null}
    </>
  );
}

const MOBILE_DASHBOARD_NAV_CSS = `
.acct-mobile-dashnav__trigger,
.acct-mobile-dashnav__overlay {
  display: none;
}

@media (max-width: 767px) {
  .acct-mobile-dashnav__trigger {
    position: fixed;
    right: 14px;
    bottom: calc(74px + env(safe-area-inset-bottom, 0px));
    z-index: 91;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    max-width: calc(100vw - 28px);
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--acct-gold) 38%, var(--acct-line, transparent));
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--acct-bg-elevated, var(--acct-bg)) 90%, var(--acct-gold-soft, transparent)), var(--acct-bg-elevated, var(--acct-bg)));
    color: var(--acct-ink);
    box-shadow: 0 18px 42px color-mix(in srgb, var(--acct-ink) 20%, transparent);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0;
    cursor: pointer;
    touch-action: manipulation;
  }

  .acct-mobile-dashnav__trigger svg {
    color: var(--acct-gold-text, var(--acct-gold));
  }

  .acct-mobile-dashnav__overlay {
    position: fixed;
    inset: 0;
    z-index: 120;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 12px 12px calc(76px + env(safe-area-inset-bottom, 0px));
    background: color-mix(in srgb, var(--acct-ink) 42%, transparent);
  }

  .acct-mobile-dashnav__panel {
    width: min(100%, 520px);
    max-height: min(78dvh, 680px);
    display: flex;
    flex-direction: column;
    gap: 14px;
    overflow: hidden;
    border-radius: 22px;
    border: 1px solid color-mix(in srgb, var(--acct-gold) 22%, var(--acct-line, transparent));
    background:
      radial-gradient(90% 65% at 100% 0%, color-mix(in srgb, var(--acct-gold-soft, var(--acct-gold)) 34%, transparent) 0%, transparent 62%),
      var(--acct-bg-elevated, var(--acct-bg));
    color: var(--acct-ink);
    box-shadow: 0 24px 80px color-mix(in srgb, var(--acct-ink) 34%, transparent);
    padding: 10px 14px 14px;
  }

  .acct-mobile-dashnav__handle {
    align-self: center;
    width: 44px;
    height: 4px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--acct-muted) 42%, transparent);
  }

  .acct-mobile-dashnav__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .acct-mobile-dashnav__head h2 {
    margin: 2px 0 0;
    font-family: var(--acct-font-display, "Iowan Old Style", "Newsreader", serif);
    font-size: 24px;
    line-height: 1.1;
    letter-spacing: 0;
    color: var(--acct-ink);
  }

  .acct-mobile-dashnav__kicker,
  .acct-mobile-dashnav__item-section {
    margin: 0;
    color: var(--acct-muted);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .acct-mobile-dashnav__icon-button {
    width: 40px;
    height: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    border: 1px solid var(--acct-line);
    background: var(--acct-bg);
    color: var(--acct-ink);
    cursor: pointer;
  }

  .acct-mobile-dashnav__search {
    display: flex;
    align-items: center;
    gap: 9px;
    min-height: 44px;
    border-radius: 14px;
    border: 1px solid var(--acct-line);
    background: color-mix(in srgb, var(--acct-bg) 86%, transparent);
    color: var(--acct-muted);
    padding: 0 12px;
  }

  .acct-mobile-dashnav__search input {
    width: 100%;
    min-width: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--acct-ink);
    font-size: 16px;
  }

  .acct-mobile-dashnav__tabs {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px;
  }

  .acct-mobile-dashnav__tab {
    min-height: 40px;
    border-radius: 12px;
    border: 1px solid var(--acct-line);
    background: var(--acct-bg);
    color: var(--acct-muted);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0;
    cursor: pointer;
  }

  .acct-mobile-dashnav__tab[data-active="true"] {
    border-color: color-mix(in srgb, var(--acct-gold) 58%, var(--acct-line));
    background: var(--acct-gold-soft, color-mix(in srgb, var(--acct-gold) 16%, transparent));
    color: var(--acct-ink);
  }

  .acct-mobile-dashnav__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow-y: auto;
    padding-right: 2px;
    overscroll-behavior: contain;
  }

  .acct-mobile-dashnav__item {
    display: flex;
    align-items: center;
    gap: 11px;
    min-height: 56px;
    border-radius: 14px;
    border: 1px solid var(--acct-line);
    background: color-mix(in srgb, var(--acct-bg) 80%, transparent);
    color: var(--acct-ink);
    padding: 9px 10px;
    text-decoration: none;
  }

  .acct-mobile-dashnav__item[data-active="true"] {
    border-color: color-mix(in srgb, var(--acct-gold) 54%, var(--acct-line));
    background: color-mix(in srgb, var(--acct-gold-soft, var(--acct-gold)) 54%, var(--acct-bg));
  }

  .acct-mobile-dashnav__item-icon {
    width: 36px;
    height: 36px;
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: var(--acct-bg-elevated, var(--acct-bg));
    color: var(--acct-gold-text, var(--acct-gold));
  }

  .acct-mobile-dashnav__item-body {
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .acct-mobile-dashnav__item-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 0;
  }
}
` as const;
