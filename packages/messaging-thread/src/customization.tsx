"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Settings2, Type, Rows3, Palette, RotateCcw } from "lucide-react";
import {
  useThreadAppearance,
  type ThreadDensity,
  type ThreadFontSize,
  type ThreadSurfaceTone,
} from "./appearance";

export type ThreadCustomizationMenuLabels = {
  trigger?: string;
  title?: string;
  fontSize?: string;
  fontSizeSm?: string;
  fontSizeMd?: string;
  fontSizeLg?: string;
  density?: string;
  densityComfortable?: string;
  densityCompact?: string;
  surfaceTone?: string;
  surfaceToneDefault?: string;
  surfaceToneSoft?: string;
  surfaceToneWarm?: string;
  surfaceToneCool?: string;
  reset?: string;
  hint?: string;
};

const DEFAULT_LABELS: Required<ThreadCustomizationMenuLabels> = {
  trigger: "Customize thread",
  title: "Customize",
  fontSize: "Font size",
  fontSizeSm: "Small",
  fontSizeMd: "Medium",
  fontSizeLg: "Large",
  density: "Density",
  densityComfortable: "Comfortable",
  densityCompact: "Compact",
  surfaceTone: "Surface tone",
  surfaceToneDefault: "Default",
  surfaceToneSoft: "Soft",
  surfaceToneWarm: "Warm",
  surfaceToneCool: "Cool",
  reset: "Reset to defaults",
  hint: "Preferences save to this device.",
};

type Props = {
  /** Optional className appended to the wrapper. Hosts use this to align
   * the trigger button with their other header actions. */
  className?: string;
  /** Optional class applied to the trigger button only. */
  triggerClassName?: string;
  /** Optional override for the menu trigger glyph + label.
   * When omitted, the default Settings2 glyph + "Customize" tooltip is used. */
  triggerLabel?: ReactNode;
  /** Custom translations for each control. Missing keys fall back to
   * English defaults so a partial override still renders cleanly. */
  labels?: ThreadCustomizationMenuLabels;
};

/**
 * Host-agnostic customization popover for the support thread surface.
 *
 * Renders a trigger button (default: a small gear icon). Clicking opens
 * a popover with three segmented controls — font size, density,
 * surface tone — plus a reset action. Changes propagate through the
 * ThreadAppearanceContext so the MessageThread engine re-applies the
 * resulting data-* attrs instantly, and persist to localStorage so the
 * preferences survive refresh + device handoff (per browser).
 *
 * Lives in the engine package so account + studio share one implementation.
 */
export function ThreadCustomizationMenu({
  className,
  triggerClassName,
  triggerLabel,
  labels: labelsProp,
}: Props) {
  const appearance = useThreadAppearance();
  const labels = useMemo(
    () => ({ ...DEFAULT_LABELS, ...(labelsProp ?? {}) }),
    [labelsProp],
  );
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const firstOptionRef = useRef<HTMLButtonElement | null>(null);
  const panelId = useId();

  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => buttonRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
      }
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    requestAnimationFrame(() => firstOptionRef.current?.focus());
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  };

  return (
    <div className={cx("mt-customize", className)} ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        className={cx("mt-customize__trigger", triggerClassName)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={labels.trigger}
        title={labels.trigger}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={onTriggerKeyDown}
      >
        {triggerLabel ?? <Settings2 size={16} aria-hidden />}
      </button>
      {open ? (
        <div
          id={panelId}
          className="mt-customize__panel"
          role="dialog"
          aria-label={labels.title}
        >
          <header className="mt-customize__header">
            <span className="mt-customize__title">{labels.title}</span>
          </header>
          <Segment<ThreadFontSize>
            firstRef={firstOptionRef}
            icon={<Type size={13} aria-hidden />}
            label={labels.fontSize}
            value={appearance.fontSize}
            options={[
              { value: "sm", label: labels.fontSizeSm },
              { value: "md", label: labels.fontSizeMd },
              { value: "lg", label: labels.fontSizeLg },
            ]}
            onChange={appearance.setFontSize}
          />
          <Segment<ThreadDensity>
            icon={<Rows3 size={13} aria-hidden />}
            label={labels.density}
            value={appearance.density}
            options={[
              { value: "comfortable", label: labels.densityComfortable },
              { value: "compact", label: labels.densityCompact },
            ]}
            onChange={appearance.setDensity}
          />
          <Segment<ThreadSurfaceTone>
            icon={<Palette size={13} aria-hidden />}
            label={labels.surfaceTone}
            value={appearance.surfaceTone}
            options={[
              { value: "default", label: labels.surfaceToneDefault },
              { value: "soft", label: labels.surfaceToneSoft },
              { value: "warm", label: labels.surfaceToneWarm },
              { value: "cool", label: labels.surfaceToneCool },
            ]}
            onChange={appearance.setSurfaceTone}
          />
          <button
            type="button"
            className="mt-customize__reset"
            onClick={appearance.reset}
          >
            <RotateCcw size={12} aria-hidden />
            {labels.reset}
          </button>
          <p className="mt-customize__hint">{labels.hint}</p>
        </div>
      ) : null}
    </div>
  );
}

function Segment<TValue extends string>({
  firstRef,
  icon,
  label,
  value,
  options,
  onChange,
}: {
  firstRef?: React.MutableRefObject<HTMLButtonElement | null>;
  icon: ReactNode;
  label: string;
  value: TValue;
  options: Array<{ value: TValue; label: string }>;
  onChange: (next: TValue) => void;
}) {
  const groupId = useId();
  return (
    <div className="mt-customize__row">
      <span className="mt-customize__row-label" id={groupId}>
        <span className="mt-customize__row-icon" aria-hidden>
          {icon}
        </span>
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={groupId}
        className="mt-customize__segment"
      >
        {options.map((option, index) => {
          const isActive = option.value === value;
          return (
            <button
              key={option.value}
              ref={index === 0 ? firstRef : undefined}
              type="button"
              role="radio"
              aria-checked={isActive}
              data-active={isActive || undefined}
              className="mt-customize__segment-option"
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function cx(...parts: Array<string | undefined | false | null>): string {
  return parts.filter(Boolean).join(" ");
}
