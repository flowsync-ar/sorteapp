"use client";

import { useEffect } from "react";

/**
 * Next.js App Router's `<Link>` reliably scrolls to top on navigation but
 * does NOT reliably jump to a URL hash afterwards (long-standing App Router
 * quirk) — clicking "Cursos" (`href="/#tiers"`) from another route, e.g.
 * `/faq`, always lands at the top of `/` instead of the tiers section. Paired
 * with `scroll={false}` on that Link, this does the jump by hand: on mount
 * (cross-route navigation) and on every `hashchange` (same-page re-click).
 */
export function ScrollToHash() {
  useEffect(() => {
    function scrollToCurrentHash() {
      const hash = window.location.hash;
      if (!hash) return;
      document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
    }

    scrollToCurrentHash();
    window.addEventListener("hashchange", scrollToCurrentHash);
    return () => window.removeEventListener("hashchange", scrollToCurrentHash);
  }, []);

  return null;
}
