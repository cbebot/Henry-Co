"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@henryco/ui/cn";

export type AutosizeTextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "rows"
> & {
  minRows?: number;
  maxRows?: number;
  /** Force the textarea to fill its parent height (used in full-screen mode) */
  fill?: boolean;
};

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export const AutosizeTextarea = forwardRef<
  HTMLTextAreaElement,
  AutosizeTextareaProps
>(function AutosizeTextarea(
  {
    minRows = 1,
    maxRows = 6,
    fill = false,
    className,
    value,
    onInput,
    style,
    ...rest
  },
  ref
) {
  const innerRef = useRef<HTMLTextAreaElement | null>(null);
  useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement);

  useIsoLayoutEffect(() => {
    const node = innerRef.current;
    if (!node) return;
    if (fill) {
      node.style.height = "100%";
      return;
    }
    node.style.height = "auto";
    const styles = window.getComputedStyle(node);
    const lineHeight = parseFloat(styles.lineHeight) || 24;
    const paddingTop = parseFloat(styles.paddingTop) || 0;
    const paddingBottom = parseFloat(styles.paddingBottom) || 0;
    const borderTop = parseFloat(styles.borderTopWidth) || 0;
    const borderBottom = parseFloat(styles.borderBottomWidth) || 0;
    const verticalNonContent =
      paddingTop + paddingBottom + borderTop + borderBottom;
    const contentHeight = node.scrollHeight - verticalNonContent;
    const lines = Math.max(
      minRows,
      Math.min(maxRows, Math.ceil(contentHeight / lineHeight))
    );
    const targetHeight = Math.round(
      lines * lineHeight + verticalNonContent
    );
    node.style.height = `${targetHeight}px`;
    node.style.overflowY =
      contentHeight > maxRows * lineHeight ? "auto" : "hidden";
  }, [value, minRows, maxRows, fill]);

  return (
    <textarea
      ref={innerRef}
      value={value}
      onInput={onInput}
      className={cn(
        "block w-full resize-none border-0 bg-transparent px-0 py-0",
        "text-[15px] leading-7 outline-none focus:outline-none",
        "placeholder:text-[color:var(--composer-muted,rgba(15,23,42,0.45))]",
        fill && "h-full",
        className
      )}
      style={style}
      {...rest}
    />
  );
});
