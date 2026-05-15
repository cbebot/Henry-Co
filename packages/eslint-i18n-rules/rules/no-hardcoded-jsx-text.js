// ---------------------------------------------------------------------------
// no-hardcoded-jsx-text
//
// Flags JSXText literals that contain alphabetic characters and length > 1.
// Whitespace-only text and punctuation-only text (such as a period or an
// arrow glyph) are ignored. Literals inside translator invocations are
// allow-listed via shared.js.
// ---------------------------------------------------------------------------

import { isAllowlistedFile, isInsideTranslator, looksLikeUserCopy } from "../shared.js";

/** @type {import("eslint").Rule.RuleModule} */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow user-visible English copy in JSX text. Use a typed copy module or translateSurfaceLabel().",
      recommended: false,
    },
    schema: [],
    messages: {
      hardcoded:
        "Hardcoded JSX text '{{ text }}'. Move into a *-copy.ts module or wrap in translateSurfaceLabel()/autoTranslate().",
    },
  },
  create(context) {
    const filename = context.getFilename();
    if (isAllowlistedFile(filename)) return {};
    return {
      JSXText(node) {
        const raw = String(node.value || "");
        if (!looksLikeUserCopy(raw)) return;
        if (isInsideTranslator(node)) return;
        const preview = raw.trim().slice(0, 60);
        context.report({
          node,
          messageId: "hardcoded",
          data: { text: preview },
        });
      },
    };
  },
};

export default rule;
