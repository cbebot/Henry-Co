/**
 * Tiny safe markdown subset used by MessageThread bubbles when
 * `renderMarkdown` is enabled. Hand-rolled — no dep, no DOM
 * sanitizer needed because we render to React nodes (never to
 * dangerouslySetInnerHTML), so attribute injection is impossible.
 *
 * Block grammar (line-level):
 *   - blank line              → paragraph break
 *   - "> text"                → blockquote (consecutive lines join)
 *   - "- text" / "* text"     → unordered list item
 *   - "1. text" / "12. text"  → ordered list item
 *   - everything else         → paragraph line
 *
 * Inline grammar (within a line):
 *   - **bold**  /  __bold__   → <strong>
 *   - *italic*  /  _italic_   → <em>
 *   - `code`                  → <code>
 *   - [label](https://url)    → <a> (mailto: + http(s): only)
 *
 * Anything unrecognized is rendered as plain text. Newlines inside a
 * paragraph are preserved as <br />.
 */
import { Fragment, type ReactNode } from "react";

const SAFE_PROTOCOL = /^(https?:|mailto:)/i;

type Block =
  | { kind: "p"; lines: string[] }
  | { kind: "blockquote"; lines: string[] }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] };

function classifyLine(line: string): {
  kind: "blockquote" | "ul" | "ol" | "blank" | "p";
  rest: string;
} {
  if (line.trim() === "") return { kind: "blank", rest: "" };
  const bq = /^>\s?(.*)$/.exec(line);
  if (bq) return { kind: "blockquote", rest: bq[1] };
  const ul = /^[-*]\s+(.*)$/.exec(line);
  if (ul) return { kind: "ul", rest: ul[1] };
  const ol = /^\d{1,3}\.\s+(.*)$/.exec(line);
  if (ol) return { kind: "ol", rest: ol[1] };
  return { kind: "p", rest: line };
}

function blockize(body: string): Block[] {
  const blocks: Block[] = [];
  const lines = body.replace(/\r\n?/g, "\n").split("\n");
  let cursor: Block | null = null;
  const flush = () => {
    if (cursor) {
      blocks.push(cursor);
      cursor = null;
    }
  };
  for (const raw of lines) {
    const { kind, rest } = classifyLine(raw);
    if (kind === "blank") {
      flush();
      continue;
    }
    if (kind === "blockquote") {
      if (!cursor || cursor.kind !== "blockquote") {
        flush();
        cursor = { kind: "blockquote", lines: [] };
      }
      cursor.lines.push(rest);
    } else if (kind === "ul") {
      if (!cursor || cursor.kind !== "ul") {
        flush();
        cursor = { kind: "ul", items: [] };
      }
      cursor.items.push(rest);
    } else if (kind === "ol") {
      if (!cursor || cursor.kind !== "ol") {
        flush();
        cursor = { kind: "ol", items: [] };
      }
      cursor.items.push(rest);
    } else {
      if (!cursor || cursor.kind !== "p") {
        flush();
        cursor = { kind: "p", lines: [] };
      }
      cursor.lines.push(rest);
    }
  }
  flush();
  return blocks;
}

/**
 * Inline scanner. Returns React nodes for a single string. Order of
 * scans matters: code spans win (their contents are LITERAL — no other
 * markdown applies), then links, then bold (** / __), then italic
 * (* / _).
 */
function renderInline(input: string, keyPrefix: string): ReactNode[] {
  // 1. Pull code spans out first; they're literal.
  const segments: Array<{ kind: "code" | "text"; value: string }> = [];
  const codeRe = /`([^`\n]+)`/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = codeRe.exec(input)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ kind: "text", value: input.slice(lastIndex, match.index) });
    }
    segments.push({ kind: "code", value: match[1] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < input.length) {
    segments.push({ kind: "text", value: input.slice(lastIndex) });
  }
  if (segments.length === 0) {
    segments.push({ kind: "text", value: input });
  }

  const out: ReactNode[] = [];
  segments.forEach((seg, i) => {
    const k = `${keyPrefix}-${i}`;
    if (seg.kind === "code") {
      out.push(
        <code key={`${k}-c`} className="mt-md-code">
          {seg.value}
        </code>,
      );
      return;
    }
    out.push(...renderTextRich(seg.value, k));
  });
  return out;
}

/**
 * Inline rich-text scanner for non-code text. Resolves links → bold →
 * italic in that order. Simple back-scan; nested bold/italic is not
 * supported (kept intentional to avoid pathological backtracking).
 */
function renderTextRich(input: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];

  // Links: [label](url)
  const linkRe = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let pieces: Array<{ kind: "text" | "link"; value: string; url?: string }> = [];
  while ((match = linkRe.exec(input)) !== null) {
    if (match.index > lastIndex) {
      pieces.push({ kind: "text", value: input.slice(lastIndex, match.index) });
    }
    const url = match[2].trim();
    if (SAFE_PROTOCOL.test(url)) {
      pieces.push({ kind: "link", value: match[1], url });
    } else {
      // Unsafe protocol — render as plain text, drop the brackets.
      pieces.push({ kind: "text", value: `${match[1]} (${url})` });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < input.length) {
    pieces.push({ kind: "text", value: input.slice(lastIndex) });
  }
  if (pieces.length === 0) pieces = [{ kind: "text", value: input }];

  pieces.forEach((p, i) => {
    const k = `${keyPrefix}-l${i}`;
    if (p.kind === "link") {
      out.push(
        <a
          key={k}
          href={p.url}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-md-link"
        >
          {renderEmphasis(p.value, k)}
        </a>,
      );
    } else {
      out.push(...renderEmphasis(p.value, k));
    }
  });
  return out;
}

/** Bold (** / __) and italic (* / _) — single pass, non-overlapping. */
function renderEmphasis(input: string, keyPrefix: string): ReactNode[] {
  // Combined regex: bold OR italic. Bold first (longer match wins via
  // RegExp alternation order).
  const re = /(\*\*|__)([^*_\n]+)\1|(\*|_)([^*_\n]+)\3/g;
  const out: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = re.exec(input)) !== null) {
    if (match.index > lastIndex) {
      out.push(input.slice(lastIndex, match.index));
    }
    const k = `${keyPrefix}-e${i++}`;
    if (match[1]) {
      out.push(
        <strong key={k} className="mt-md-strong">
          {match[2]}
        </strong>,
      );
    } else if (match[3]) {
      out.push(
        <em key={k} className="mt-md-em">
          {match[4]}
        </em>,
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < input.length) {
    out.push(input.slice(lastIndex));
  }
  if (out.length === 0) out.push(input);
  return out;
}

/** Render the body string as React nodes. Pure — no side effects, no
 * hooks. Safe to call inside MessageBubble. */
export function renderBody(body: string, keyPrefix = "md"): ReactNode {
  const blocks = blockize(body);
  if (blocks.length === 0) return null;

  return (
    <Fragment>
      {blocks.map((block, idx) => {
        const k = `${keyPrefix}-b${idx}`;
        switch (block.kind) {
          case "p":
            return (
              <p key={k} className="mt-bubble-body">
                {block.lines.map((line, j) => (
                  <Fragment key={`${k}-l${j}`}>
                    {j > 0 ? <br /> : null}
                    {renderInline(line, `${k}-${j}`)}
                  </Fragment>
                ))}
              </p>
            );
          case "blockquote":
            return (
              <blockquote key={k} className="mt-bubble-blockquote">
                {block.lines.map((line, j) => (
                  <Fragment key={`${k}-l${j}`}>
                    {j > 0 ? <br /> : null}
                    {renderInline(line, `${k}-${j}`)}
                  </Fragment>
                ))}
              </blockquote>
            );
          case "ul":
            return (
              <ul key={k} className="mt-bubble-list">
                {block.items.map((item, j) => (
                  <li key={`${k}-i${j}`}>{renderInline(item, `${k}-${j}`)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={k} className="mt-bubble-list mt-bubble-list-ordered">
                {block.items.map((item, j) => (
                  <li key={`${k}-i${j}`}>{renderInline(item, `${k}-${j}`)}</li>
                ))}
              </ol>
            );
        }
      })}
    </Fragment>
  );
}
