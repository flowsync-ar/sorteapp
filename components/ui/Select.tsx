"use client";

import { useEffect, useRef, useState } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  id?: string;
  /** When set, renders a hidden `<input>` so this drops into a plain
   * `<form>` (native GET or a server action reading `FormData`) exactly like
   * a native `<select name="...">` would. */
  name?: string;
  /** Controlled mode — pass together with `onChange`. */
  value?: string;
  /** Uncontrolled mode — same ergonomics as `<select defaultValue>`, for
   * Server Components that render this without owning React state. */
  defaultValue?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  className?: string;
  "aria-labelledby"?: string;
}

/**
 * Custom-styled single-select dropdown — the standard replacement for every
 * `<select>` in the app. A native `<select>`'s trigger can be themed, but its
 * options popup is rendered by the OS/browser and ignores app CSS entirely
 * (always shows up light-gray, off-brand); this renders a button +
 * `role="listbox"` panel styled like the rest of the dark/champagne palette
 * instead, closing on outside click or Escape.
 *
 * Works controlled (`value`/`onChange`, e.g. `ChanceSelector`) or
 * uncontrolled (`defaultValue`, e.g. a Server Component's `<form
 * method="get">` filter) — pass `name` in the latter case to submit like a
 * real form field.
 */
export function Select({
  id,
  name,
  value,
  defaultValue,
  onChange,
  options,
  className = "",
  "aria-labelledby": ariaLabelledBy,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(
    defaultValue ?? options[0]?.value ?? "",
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function selectOption(optionValue: string) {
    if (!isControlled) {
      setInternalValue(optionValue);
    }
    onChange?.(optionValue);
    setOpen(false);
  }

  const selected = options.find((option) => option.value === currentValue) ?? null;

  return (
    <div ref={containerRef} className="relative">
      {name ? <input type="hidden" name={name} value={currentValue} /> : null}
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={ariaLabelledBy}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className={`flex w-full items-center justify-between rounded-lg border border-white/15 bg-ink px-3 py-2.5 text-left text-sm text-foreground transition focus:border-champagne focus:outline-none ${className}`}
      >
        <span>{selected?.label ?? "Seleccioná una opción"}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-labelledby={ariaLabelledBy}
          className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-white/15 bg-ink py-1 shadow-lg shadow-black/40"
        >
          {options.map((option) => {
            const isSelected = option.value === currentValue;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => selectOption(option.value)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition ${
                    isSelected
                      ? "bg-champagne/15 text-champagne"
                      : "text-foreground hover:bg-white/5"
                  }`}
                >
                  {option.label}
                  {isSelected ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 shrink-0"
                      aria-hidden="true"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
