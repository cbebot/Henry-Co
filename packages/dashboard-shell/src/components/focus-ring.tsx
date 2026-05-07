import type { CSSProperties } from "react";
import { focusVisibleStyle } from "../tokens/focus";

/**
 * FocusRing — a render-prop primitive that wraps a focusable child
 * with the canonical HenryCo focus-visible ring.
 *
 * Use this when a child element doesn't have a natural focus state
 * (a non-focusable surface that gains keyboard focus via a wrapping
 * Link or button) or when a third-party component overrides focus
 * styles in a way that breaks the WCAG 2.4.7 visible-focus rule.
 *
 * Most shell primitives don't need this — they apply
 * `focusVisibleStyle()` directly. FocusRing is the escape hatch.
 */
export type FocusRingProps = {
  children: React.ReactElement<{ style?: CSSProperties }>;
};

export function FocusRing({ children }: FocusRingProps): React.ReactElement {
  // Use cloneElement to merge focus styles into the child without
  // adding an extra DOM node. Keeping the tree flat matters for the
  // surrounding layout's grid/flex children-count assumptions.
  const existingStyle: CSSProperties = (children.props as { style?: CSSProperties }).style ?? {};
  return cloneElement(children, {
    style: {
      ...existingStyle,
      ...focusVisibleStyle(),
    },
  });
}

// Inline import to keep the focus-ring helper in one self-contained file.
import { cloneElement } from "react";
import type * as React from "react";
