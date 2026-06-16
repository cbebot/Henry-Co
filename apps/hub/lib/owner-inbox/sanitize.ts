/**
 * Email HTML sanitization + text extraction.
 *
 * IMPORTANT: the owner inbox renders email HTML inside a *sandboxed iframe*
 * (sandbox attribute WITHOUT allow-scripts), which is the primary isolation —
 * scripts cannot execute there regardless of markup. This sanitizer is
 * defense-in-depth: it strips the most dangerous constructs at write-time so
 * even the stored value is conservative. Pure module (no deps) — unit-testable.
 */

const DANGEROUS_BLOCKS = [
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "applet",
  "form",
  "noscript",
];

export function sanitizeEmailHtml(input: string | null | undefined): string {
  let html = String(input ?? "");
  if (!html.trim()) return "";

  // Remove dangerous block elements and their contents.
  for (const tag of DANGEROUS_BLOCKS) {
    const block = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi");
    html = html.replace(block, "");
    // Also drop any unclosed/self-terminated variants.
    const open = new RegExp(`<\\/?${tag}\\b[^>]*>`, "gi");
    html = html.replace(open, "");
  }

  // Remove void/standalone dangerous tags that have no closing form.
  html = html.replace(/<\/?(?:link|meta|base)\b[^>]*>/gi, "");

  // Strip inline event handlers: on*="..." | on*='...' | on*=unquoted
  html = html.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "");
  html = html.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "");
  html = html.replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "");

  // Neutralize javascript:/vbscript: and inline-script data: URLs in href/src.
  html = html.replace(
    /\s(href|src|xlink:href)\s*=\s*("|')\s*(javascript|vbscript|data:text\/html)[^"']*\2/gi,
    " $1=$2#blocked$2",
  );
  html = html.replace(
    /\s(href|src|xlink:href)\s*=\s*(javascript|vbscript):[^\s>]+/gi,
    " $1=#blocked",
  );

  return html.trim();
}

/**
 * Wrap sanitized email HTML in a minimal document with a strict CSP that blocks
 * remote resource loads — tracking pixels, remote CSS, web fonts — so opening a
 * message can't leak the owner's IP / read-receipt to the sender. Inline layout
 * (style attributes, data: images) still renders. Always paired with a
 * `sandbox=""` iframe (no script execution) as the primary isolation.
 */
export function wrapEmailHtmlForIframe(html: string | null | undefined): string {
  const body = sanitizeEmailHtml(html);
  return [
    "<!doctype html><html><head>",
    '<meta charset="utf-8">',
    "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:; media-src data:\">",
    '<meta name="referrer" content="no-referrer">',
    "</head><body>",
    body,
    "</body></html>",
  ].join("");
}

/** Collapse HTML to a plain-text approximation (for previews / text fallback). */
export function htmlToText(input: string | null | undefined): string {
  return String(input ?? "")
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const SNIPPET_MAX = 200;

/** A short one-line preview from the text part (preferred) or the HTML. */
export function buildSnippet(text: string | null | undefined, html: string | null | undefined): string {
  const source = (text && text.trim() ? text : htmlToText(html)) || "";
  const collapsed = source.replace(/\s+/g, " ").trim();
  if (collapsed.length <= SNIPPET_MAX) return collapsed;
  return collapsed.slice(0, SNIPPET_MAX - 1).trimEnd() + "…";
}
