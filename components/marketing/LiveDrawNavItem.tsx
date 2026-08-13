"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isWithinLiveWindow } from "@/lib/marketing/live-window";

interface LiveDrawNavItemProps {
  drawDateIso: string;
}

/**
 * "Ver Sorteo en Vivo" nav link — hidden until `LIVE_WINDOW_MINUTES` before
 * the draw (`lib/marketing/live-window.ts`, purely time-based — whether the
 * admin has closed sales doesn't matter), then shows with a blinking red
 * REC-style dot. Re-checks every second on the client (server-rendered "now"
 * would go stale the instant the live window opens for anyone with the tab
 * already open).
 */
export function LiveDrawNavItem({ drawDateIso }: LiveDrawNavItemProps) {
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    function check() {
      setIsLive(isWithinLiveWindow(drawDateIso));
    }
    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, [drawDateIso]);

  if (!isLive) return null;

  return (
    <Link
      href="/vivo"
      className="flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-red-400 transition hover:bg-red-500/20"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
      </span>
      Ver Sorteo en Vivo
    </Link>
  );
}
