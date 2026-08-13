"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "sorteapp-theme";
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function getSnapshot(): "light" | "dark" {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

/** SSR has no `document`/localStorage — "dark" is the site's own default,
 * same value the blocking script in `app/layout.tsx` falls back to. */
function getServerSnapshot(): "light" | "dark" {
  return "dark";
}

function applyTheme(next: "light" | "dark") {
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Private browsing / storage disabled — theme just won't persist.
  }
  listeners.forEach((notify) => notify());
}

/**
 * Light/dark switch. Every color in the app is a CSS custom property
 * (`app/globals.css`'s `@theme` + the `:root[data-theme="light"]`
 * override), so flipping `data-theme` on `<html>` re-themes the whole site
 * — no per-component light/dark classes needed.
 *
 * `useSyncExternalStore` (not `useState` + `useEffect`) on purpose: the
 * source of truth is genuinely external (a DOM attribute set by a blocking
 * script before hydration, mirrored to localStorage), and this hook is
 * exactly what React ships for "read external state safely across
 * server/client" — `getServerSnapshot` fixes the SSR/first-client-render
 * value to "dark" so there's no hydration mismatch to suppress in the first
 * place, unlike a manual "mounted" effect (which the icon's structural
 * server/client diff can't just paper over with `suppressHydrationWarning`,
 * see `DrawCountdown` for the simpler text-only case where that does work).
 */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isLight = theme === "light";

  function toggle() {
    applyTheme(isLight ? "dark" : "light");
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isLight}
      aria-label={isLight ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
      onClick={toggle}
      className="relative inline-flex h-6 w-12 shrink-0 items-center rounded-full border border-white/15 bg-surface/60 transition"
    >
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-champagne text-ink shadow transition-transform ${
          isLight ? "translate-x-6" : "translate-x-0.5"
        }`}
      >
        {isLight ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="5" />
            <path
              strokeWidth="2"
              stroke="currentColor"
              d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
          </svg>
        )}
      </span>
    </button>
  );
}
