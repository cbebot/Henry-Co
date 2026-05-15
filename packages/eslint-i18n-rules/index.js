// ---------------------------------------------------------------------------
// @henryco/eslint-i18n-rules
//
// Custom ESLint plugin shipping two rules that prevent regressions to the
// HenryCo i18n closure:
//
//   no-hardcoded-jsx-text       — flags <JSXText> literals that contain
//                                 user-visible English copy.
//   no-hardcoded-string-prop    — flags string literals passed to common
//                                 user-facing props (placeholder, title,
//                                 aria-label, aria-description, alt, label,
//                                 description, helperText).
//
// Both rules are intentionally permissive on patterns the codebase has
// already adopted:
//
//   - The literal is the direct argument to t(...), translateSurfaceLabel(...),
//     autoTranslate(...), autoTranslateMany(...), useHenryCoSurfaceCopy()...
//   - The literal is read from a typed copy module accessor: getXxxCopy(locale).
//   - The literal lives inside an i18n-source file: *-copy.ts, surface-extra-
//     labels*.ts, *-seed.ts, *-data.ts (mock fixtures), verify-*.ts,
//     scripts/*, or a test file (*.test.{ts,tsx}, *.spec.{ts,tsx}).
//
// Shipped in `'warn'` severity in this PR so Wave B can absorb the lint
// noise. The closure PR (Wave D, conductor) graduates both rules to
// `'error'`.
// ---------------------------------------------------------------------------

import noHardcodedJsxText from "./rules/no-hardcoded-jsx-text.js";
import noHardcodedStringProp from "./rules/no-hardcoded-string-prop.js";

const plugin = {
  meta: {
    name: "@henryco/eslint-i18n-rules",
    version: "0.1.0",
  },
  rules: {
    "no-hardcoded-jsx-text": noHardcodedJsxText,
    "no-hardcoded-string-prop": noHardcodedStringProp,
  },
};

export default plugin;
