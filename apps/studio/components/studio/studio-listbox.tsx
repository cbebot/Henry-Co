"use client";

import { ChevronDown, Check } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export function StudioListbox({
  name,
  label,
  value,
  onChange,
  options,
  required,
  placeholder = "Choose…",
  className = "",
}: {
  name: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const selected = options.find((o) => o.value === value);
  const display = value ? selected?.label ?? value : placeholder;

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function primeActiveFromValue() {
    const idx = options.findIndex((o) => o.value === value);
    setActive(idx >= 0 ? idx : 0);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        primeActiveFromValue();
        setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = options[active];
      if (opt) {
        onChange(opt.value);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    // When open, lift the wrapper out of any sibling stacking context
    // (studio-panel uses backdrop-filter which creates one). Without
    // this the dropdown was painted UNDER the live brief summary side
    // panel that follows it in document order on smaller viewports.
    <div
      className={`relative ${open ? "z-[120]" : "z-0"} ${className}`}
      ref={rootRef}
    >
      <input type="hidden" name={name} value={value} required={required} />
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }
          primeActiveFromValue();
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        className="flex min-h-[48px] w-full items-center justify-between gap-2 rounded-[1.2rem] border border-[var(--studio-line)] bg-[color-mix(in_srgb,var(--studio-surface-strong)_88%,transparent)] px-4 py-3 text-left text-[var(--studio-ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-[rgba(151,244,243,0.28)] focus:border-[rgba(151,244,243,0.45)] focus:outline-none focus:ring-2 focus:ring-[rgba(88,212,210,0.25)]"
      >
        <span className={value ? "font-medium" : "text-[var(--studio-ink-soft)]"}>{display}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--studio-signal)] transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label={label}
          className="studio-listbox-dropdown absolute left-0 right-0 z-[80] mt-2 max-h-64 overflow-auto rounded-[1.2rem] border border-[var(--studio-line-strong)] bg-[var(--studio-surface-strong)] py-1 backdrop-blur-xl"
        >
          {!required ? (
            <li role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={value === ""}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-[var(--studio-ink-soft)] hover:bg-[rgba(151,244,243,0.1)]"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                {placeholder}
              </button>
            </li>
          ) : null}
          {options.map((opt, index) => {
            const isActive = index === active;
            const isSel = opt.value === value;
            return (
              <li key={opt.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSel}
                  className={`flex w-full items-center gap-2 px-4 py-3 text-left text-sm transition ${
                    isActive ? "bg-[rgba(151,244,243,0.12)]" : ""
                  } text-[var(--studio-ink)] hover:bg-[rgba(151,244,243,0.1)]`}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  onMouseEnter={() => setActive(index)}
                >
                  {isSel ? <Check className="h-4 w-4 shrink-0 text-[var(--studio-signal)]" /> : (
                    <span className="inline-block w-4 shrink-0" />
                  )}
                  <span className="min-w-0 flex-1">{opt.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
