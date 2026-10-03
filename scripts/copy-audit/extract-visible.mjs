/**
 * COPY-RESET — in-page visible-text extractor.
 *
 * `extractVisible` is serialised by Playwright and runs INSIDE the page, so it
 * must stay self-contained (no imports, no closures over module scope).
 *
 * What counts as a visible word: a whitespace-separated token that contains a
 * letter or a digit, inside a text node that the browser actually paints at
 * load time. Excluded: display:none / visibility:hidden / opacity:0 subtrees,
 * screen-reader-only text (1px clipped boxes, clip/clip-path tricks), closed
 * <details> bodies, closed menus/dialogs, off-screen skip links, <script>,
 * <style>, <noscript>, <template>, SVG <title>/<desc>, and unselected <option>s.
 * Included on top of text nodes: visible input placeholders, the selected
 * option of a visible <select>, and visible submit/button input values.
 *
 * Regions:
 *   main     — inside #henryco-main (the skip-link target) or <main>
 *   outside  — painted page content outside <main> (flagged; counts as page)
 *   chrome   — header / footer / nav / banner / contentinfo outside <main>
 *   overlay  — position:fixed widgets outside <main> (consent, launchers)
 * Page words = main + outside. Chrome and overlay are budgeted separately.
 */
export function extractVisible(opts) {
  const options = opts || {};
  const WORD_CHAR = /[\p{L}\p{N}]/u;
  const countWords = (s) => s.split(/\s+/).filter((t) => WORD_CHAR.test(t)).length;
  const norm = (s) => s.replace(/\s+/g, " ").trim();

  const main = document.querySelector("#henryco-main") || document.querySelector("main");
  const viewportH = window.innerHeight;
  const hiddenCache = new WeakMap();
  const regionCache = new WeakMap();
  const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "TITLE", "DESC", "OPTION", "TEXTAREA"]);
  const BLOCK_TAGS = new Set([
    "H1", "H2", "H3", "H4", "H5", "H6", "P", "LI", "DT", "DD", "TD", "TH", "FIGCAPTION",
    "BLOCKQUOTE", "LABEL", "BUTTON", "A", "SUMMARY", "LEGEND", "CAPTION", "TIME",
  ]);

  function hidden(el) {
    if (!el || el.nodeType !== 1) return false;
    if (hiddenCache.has(el)) return hiddenCache.get(el);
    let h = false;
    if (SKIP_TAGS.has(el.tagName.toUpperCase())) h = true;
    else if (el.hidden || el.getAttribute("aria-hidden") === "true" && el.getAttribute("data-copy-audit") === "ignore") h = true;
    else {
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden" || cs.visibility === "collapse" || cs.contentVisibility === "hidden") h = true;
      else if (Number(cs.opacity) === 0) h = true;
      else if (/rect\(0(px)?,? ?0(px)?,? ?0(px)?,? ?0(px)?\)/.test(cs.clip) || /inset\(\s*50%/.test(cs.clipPath)) h = true;
      else {
        const r = el.getBoundingClientRect();
        const clipsOverflow = /(hidden|clip)/.test(cs.overflow + cs.overflowX + cs.overflowY);
        if (clipsOverflow && r.width <= 2 && r.height <= 2) h = true; // sr-only
        else if (
          (cs.position === "absolute" || cs.position === "fixed") &&
          (r.right <= 0 || r.left >= window.innerWidth * 3 || r.bottom + window.scrollY <= 0)
        )
          h = true; // off-screen until focused (skip links)
      }
    }
    if (!h && el.parentElement) h = hidden(el.parentElement);
    hiddenCache.set(el, h);
    return h;
  }

  function region(el) {
    if (regionCache.has(el)) return regionCache.get(el);
    let r;
    if (main && main.contains(el)) r = "main";
    else if (el.closest("header, footer, nav, [role=banner], [role=contentinfo], [role=navigation]")) r = "chrome";
    else {
      r = main ? "outside" : "main";
      for (let a = el; a && a !== document.body; a = a.parentElement) {
        if (getComputedStyle(a).position === "fixed") {
          r = "overlay";
          break;
        }
      }
    }
    regionCache.set(el, r);
    return r;
  }

  function blockOf(el) {
    for (let a = el; a && a !== document.body; a = a.parentElement) {
      if (BLOCK_TAGS.has(a.tagName.toUpperCase())) return a;
      const d = getComputedStyle(a).display;
      if (d === "block" || d === "flex" || d === "grid" || d === "list-item" || d === "table-cell") return a;
    }
    return el;
  }

  function pathOf(el) {
    const parts = [];
    for (let a = el; a && a !== document.body && parts.length < 5; a = a.parentElement) {
      let p = a.tagName.toLowerCase();
      if (a.id) {
        p += "#" + a.id;
        parts.unshift(p);
        break;
      }
      const cls = (a.getAttribute("class") || "").split(/\s+/).filter((c) => c && !c.includes(":") && !c.includes("[") && c.length < 24).slice(0, 2);
      if (cls.length) p += "." + cls.join(".");
      parts.unshift(p);
    }
    return parts.join(" > ");
  }

  const range = document.createRange();
  function paintedRect(node) {
    range.selectNodeContents(node);
    const rects = range.getClientRects();
    for (const r of rects) if (r.width > 0 && r.height > 0) return r;
    return null;
  }

  const blocks = new Map(); // block element -> {text[], top}
  const order = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const raw = n.nodeValue;
    if (!raw || !WORD_CHAR.test(raw)) continue;
    const parent = n.parentElement;
    if (!parent || hidden(parent)) continue;
    const rect = paintedRect(n);
    if (!rect) continue;
    const blk = blockOf(parent);
    let entry = blocks.get(blk);
    if (!entry) {
      entry = { el: blk, parts: [], top: rect.top + window.scrollY, region: region(blk) };
      blocks.set(blk, entry);
      order.push(entry);
    }
    entry.parts.push(raw);
  }

  // Form affordances that paint text without a text node.
  const extras = [];
  for (const el of document.querySelectorAll("input[placeholder], textarea[placeholder]")) {
    if (hidden(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    if (el.value) continue; // a filled field paints its value, not the placeholder
    extras.push({ el, text: el.getAttribute("placeholder"), top: r.top + window.scrollY, kind: "placeholder" });
  }
  for (const el of document.querySelectorAll("select")) {
    if (hidden(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    const opt = el.selectedOptions && el.selectedOptions[0];
    if (opt && opt.textContent) extras.push({ el, text: opt.textContent, top: r.top + window.scrollY, kind: "select" });
  }
  for (const el of document.querySelectorAll("input[type=submit][value], input[type=button][value]")) {
    if (hidden(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    extras.push({ el, text: el.value, top: r.top + window.scrollY, kind: "input-value" });
  }

  const out = [];
  for (const e of order) {
    const text = norm(e.parts.join(" "));
    if (!text) continue;
    out.push({
      region: e.region,
      tag: e.el.tagName.toLowerCase(),
      path: pathOf(e.el),
      top: Math.round(e.top),
      aboveFold: e.top < viewportH,
      words: countWords(text),
      text,
    });
  }
  for (const x of extras) {
    const text = norm(x.text || "");
    if (!text) continue;
    out.push({
      region: region(x.el),
      tag: x.el.tagName.toLowerCase() + ":" + x.kind,
      path: pathOf(x.el),
      top: Math.round(x.top),
      aboveFold: x.top < viewportH,
      words: countWords(text),
      text,
    });
  }

  const sum = (pred) => out.filter(pred).reduce((a, b) => a + b.words, 0);
  const h1s = [...document.querySelectorAll("h1")].map((h) => ({ text: norm(h.innerText || h.textContent || ""), visible: !hidden(h) && h.getBoundingClientRect().height > 0 }));
  const headings = [...document.querySelectorAll("h2, h3")]
    .filter((h) => !hidden(h) && h.getBoundingClientRect().height > 0)
    .map((h) => ({ tag: h.tagName.toLowerCase(), region: region(h), text: norm(h.innerText || "") }));
  const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute("content") || null;
  const images = [...document.querySelectorAll("img")]
    .filter((i) => !hidden(i))
    .map((i) => ({ alt: i.getAttribute("alt"), src: (i.currentSrc || i.src || "").slice(0, 160), region: region(i) }));
  const links = [];
  if (options.collectLinks) {
    for (const a of document.querySelectorAll("a[href]")) {
      try {
        const u = new URL(a.getAttribute("href"), location.href);
        if (u.origin === location.origin) links.push(u.pathname);
      } catch {
        /* ignore malformed */
      }
    }
  }

  return {
    url: location.href,
    title: document.title,
    lang: document.documentElement.lang || null,
    metaDescription: metaDesc,
    metaDescriptionWords: metaDesc ? countWords(metaDesc) : 0,
    metaDescriptionChars: metaDesc ? metaDesc.length : 0,
    hasMain: Boolean(main),
    counts: {
      page: sum((b) => b.region === "main" || b.region === "outside"),
      main: sum((b) => b.region === "main"),
      outside: sum((b) => b.region === "outside"),
      chrome: sum((b) => b.region === "chrome"),
      overlay: sum((b) => b.region === "overlay"),
      pageAboveFold: sum((b) => (b.region === "main" || b.region === "outside") && b.aboveFold),
    },
    h1s,
    headings,
    images,
    links: [...new Set(links)],
    blocks: out,
  };
}
