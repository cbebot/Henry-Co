"use client";

/**
 * KeyboardCheatSheet — opens on "?" anywhere outside an input. Renders
 * inside the shell's `<Drawer>` primitive so the surface matches the
 * ContextDrawer + module drawers (anti-pattern #14 — no default
 * tailwind dialogs).
 *
 * The shortcut list is the single source of truth users will reference
 * to learn the palette. We keep it short — exhaustive listings hide
 * the important bindings.
 */

import { Drawer } from "@henryco/dashboard-shell/components";
import { CSS_VARS, RADIUS, typeStyle } from "@henryco/dashboard-shell/tokens";

export interface KeyboardCheatSheetProps {
  open: boolean;
  onClose: () => void;
  /** Number of eligible modules — drives the Cmd+1..N hint. */
  moduleCount: number;
}

interface Shortcut {
  keys: string[];
  description: string;
  scope: string;
}

const SHORTCUTS: Shortcut[] = [
  { keys: ["⌘", "K"], description: "Open the command palette", scope: "Anywhere" },
  { keys: ["/"], description: "Open the command palette", scope: "Anywhere (not inside an input)" },
  { keys: ["?"], description: "Open this keyboard cheat sheet", scope: "Anywhere (not inside an input)" },
  { keys: ["Esc"], description: "Close the palette or this sheet", scope: "Palette open" },
  { keys: ["↑", "↓"], description: "Move between rows", scope: "Palette open" },
  { keys: ["Tab"], description: "Cycle to next group", scope: "Palette open" },
  { keys: ["Shift", "Tab"], description: "Cycle to previous group", scope: "Palette open" },
  { keys: ["↵"], description: "Open the highlighted row", scope: "Palette open" },
];

export function KeyboardCheatSheet({ open, onClose, moduleCount }: KeyboardCheatSheetProps) {
  const moduleHint = moduleCount > 0
    ? {
        keys: ["⌘", "1", "—", `${Math.min(moduleCount, 9)}`],
        description: "Jump to a module on the rail by its position",
        scope: "Anywhere (not inside an input)",
      }
    : null;

  return (
    <Drawer open={open} onClose={onClose} kicker="Keyboard" title="Shortcuts">
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        {[...SHORTCUTS, ...(moduleHint ? [moduleHint] : [])].map((s, index) => (
          <li
            key={`shortcut-${index}`}
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: "0.75rem",
              alignItems: "baseline",
              paddingBottom: "0.625rem",
              borderBottom: `1px solid var(${CSS_VARS.hairline})`,
            }}
          >
            <span
              aria-hidden
              style={{
                display: "inline-flex",
                gap: 4,
                flexWrap: "wrap",
              }}
            >
              {s.keys.map((key, ki) => (
                <kbd
                  key={`s-${index}-${ki}`}
                  style={{
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    padding: "0.15rem 0.4rem",
                    border: `1px solid var(${CSS_VARS.hairline})`,
                    borderRadius: RADIUS.sm,
                    fontSize: "0.7rem",
                    color: `var(${CSS_VARS.ink})`,
                    backgroundColor: `var(${CSS_VARS.surfaceElevated})`,
                  }}
                >
                  {key}
                </kbd>
              ))}
            </span>
            <span>
              <span
                style={{
                  ...typeStyle("bodyStrong"),
                  color: `var(${CSS_VARS.ink})`,
                  display: "block",
                }}
              >
                {s.description}
              </span>
              <span
                style={{
                  ...typeStyle("small"),
                  color: `var(${CSS_VARS.inkSoft})`,
                  display: "block",
                  marginTop: "0.125rem",
                }}
              >
                {s.scope}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <p
        style={{
          ...typeStyle("small"),
          color: `var(${CSS_VARS.inkMuted})`,
          marginTop: "0.75rem",
        }}
      >
        On Windows / Linux, ⌘ is Ctrl.
      </p>
    </Drawer>
  );
}
