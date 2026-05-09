import { PageHeader, Section, Panel } from "@henryco/dashboard-shell/components";

export const metadata = {
  title: "Keyboard cheatsheet — Track C",
};

/**
 * Track C keyboard cheatsheet — operator hotkeys differ from owner.
 *
 * Sections:
 *   1. Navigation
 *   2. Selection
 *   3. Actions (per-module hotkey hints)
 *   4. Search
 */
export default function CheatsheetPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <PageHeader
        kicker="Keyboard"
        title="Track C cheatsheet"
        description="Density-first operator surface — every queue is keyboard-driven."
      />
      <Section kicker="Navigation">
        <Panel tone="flat" aria-label="Navigation hotkeys">
          <KeyTable rows={[
            ["j", "next row"],
            ["k", "previous row"],
            ["↓ / ↑", "next / previous row"],
            ["Enter", "open row"],
            ["⌘K / Ctrl+K", "command palette"],
            ["⌘B / Ctrl+B", "toggle workspace rail"],
            ["?", "show this cheatsheet"],
          ]} />
        </Panel>
      </Section>
      <Section kicker="Selection">
        <Panel tone="flat" aria-label="Selection hotkeys">
          <KeyTable rows={[
            ["x", "toggle selection on focused row"],
            ["Space", "toggle selection on focused row (alt)"],
            ["⇧+x", "range select from anchor"],
            ["⌘A / Ctrl+A", "select all visible rows"],
            ["Esc", "clear selection"],
          ]} />
        </Panel>
      </Section>
      <Section kicker="Bulk actions" description="Keys differ per module — see the per-module action stack.">
        <Panel tone="flat" aria-label="Bulk-action hotkeys">
          <KeyTable rows={[
            ["a", "primary action (varies by module: assign / approve)"],
            ["e", "secondary action (escalate / request edits)"],
            ["c", "close / cancel — destructive, prompts for reason"],
            ["d", "defer — secondary"],
            ["r", "refund — destructive, prompts for reason"],
          ]} />
        </Panel>
      </Section>
      <Section kicker="Search">
        <Panel tone="flat" aria-label="Search hotkeys">
          <KeyTable rows={[
            ["/", "focus the queue search input"],
            ["⌘K / Ctrl+K", "open the federated palette (jump to any module)"],
          ]} />
        </Panel>
      </Section>
    </div>
  );
}

function KeyTable({ rows }: { rows: ReadonlyArray<[string, string]> }) {
  return (
    <ul
      style={{
        listStyle: "none",
        margin: 0,
        padding: 0,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "0.5rem",
      }}
    >
      {rows.map(([keys, desc]) => (
        <li
          key={keys}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.5rem 0.75rem",
            border: "1px solid rgba(10,10,10,0.08)",
            borderRadius: "0.5rem",
            fontSize: "0.85rem",
          }}
        >
          <code
            style={{
              fontFamily: "ui-monospace,monospace",
              background: "rgba(10,10,10,0.04)",
              padding: "0.15rem 0.4rem",
              borderRadius: "0.375rem",
            }}
          >
            {keys}
          </code>
          <span style={{ color: "rgba(10,10,10,0.65)" }}>{desc}</span>
        </li>
      ))}
    </ul>
  );
}
