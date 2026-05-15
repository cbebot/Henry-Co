// ---------------------------------------------------------------------------
// no-hardcoded-string-prop
//
// Flags string-literal values for a fixed set of user-facing props
// (placeholder, title, aria-label, aria-description, alt, label,
// description, helperText). Both JSX attributes and object-literal
// properties of the same name are linted, because both forms are
// commonly seen in HenryCo (e.g. <Input placeholder="..."> and
// fields: [{ label: "..." }]).
// ---------------------------------------------------------------------------

import {
  isAllowlistedFile,
  isInsideTranslator,
  isMonitoredJsxProp,
  looksLikeUserCopy,
} from "../shared.js";

function getJsxAttrName(node) {
  if (!node || !node.name) return null;
  if (node.name.type === "JSXIdentifier") return node.name.name;
  if (node.name.type === "JSXNamespacedName") {
    return `${node.name.namespace?.name ?? ""}:${node.name.name?.name ?? ""}`;
  }
  return null;
}

function getObjectPropKey(node) {
  if (!node || !node.key) return null;
  if (node.computed) return null;
  if (node.key.type === "Identifier") return node.key.name;
  if (node.key.type === "Literal" && typeof node.key.value === "string") return node.key.value;
  return null;
}

/** @type {import("eslint").Rule.RuleModule} */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow user-visible English copy as a value for placeholder / title / aria-label / alt / label / description / helperText props.",
      recommended: false,
    },
    schema: [],
    messages: {
      hardcoded:
        "Hardcoded {{ prop }}='{{ text }}'. Source from a *-copy.ts module or translateSurfaceLabel('{{ text }}').",
    },
  },
  create(context) {
    const filename = context.getFilename();
    if (isAllowlistedFile(filename)) return {};

    function reportLiteral(literal, propName) {
      if (!literal) return;
      if (literal.type === "Literal" && typeof literal.value === "string") {
        if (!looksLikeUserCopy(literal.value)) return;
        if (isInsideTranslator(literal)) return;
        const preview = literal.value.trim().slice(0, 60);
        context.report({
          node: literal,
          messageId: "hardcoded",
          data: { prop: propName, text: preview },
        });
        return;
      }
      // Template literal with no expressions.
      if (literal.type === "TemplateLiteral" && literal.expressions.length === 0 && literal.quasis.length === 1) {
        const raw = literal.quasis[0].value.cooked ?? literal.quasis[0].value.raw;
        if (!looksLikeUserCopy(raw)) return;
        if (isInsideTranslator(literal)) return;
        const preview = String(raw).trim().slice(0, 60);
        context.report({
          node: literal,
          messageId: "hardcoded",
          data: { prop: propName, text: preview },
        });
      }
    }

    return {
      JSXAttribute(node) {
        const name = getJsxAttrName(node);
        if (!isMonitoredJsxProp(name)) return;
        const v = node.value;
        if (!v) return;
        if (v.type === "Literal") {
          reportLiteral(v, name);
          return;
        }
        if (v.type === "JSXExpressionContainer") {
          reportLiteral(v.expression, name);
        }
      },
      Property(node) {
        const key = getObjectPropKey(node);
        if (!isMonitoredJsxProp(key)) return;
        reportLiteral(node.value, key);
      },
    };
  },
};

export default rule;
