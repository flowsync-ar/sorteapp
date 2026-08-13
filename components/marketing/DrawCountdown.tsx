"use client";

import { useEffect, useState } from "react";

interface DrawCountdownProps {
  drawDateIso: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(drawDateIso: string): TimeLeft | null {
  const diffMs = new Date(drawDateIso).getTime() - Date.now();
  if (diffMs <= 0) return null;

  const totalSeconds = Math.floor(diffMs / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

/**
 * Ticking countdown to `drawDateIso`, shown on the hero prize card. Initial
 * state is computed once via the lazy `useState` initializer (server render
 * gets a real value instead of a blank flash); the effect only subscribes
 * to the 1s tick and calls `setState` from that callback — a synchronous
 * `setState` in the effect body itself trips `react-hooks/set-state-in-effect`
 * (cascading-render smell). The digits get `suppressHydrationWarning`: the
 * server's and the client's first tick differ by the network round-trip, by
 * design, same as any live clock.
 */
export function DrawCountdown({ drawDateIso }: DrawCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() => getTimeLeft(drawDateIso));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(drawDateIso));
    }, 1000);
    return () => clearInterval(interval);
  }, [drawDateIso]);

  if (timeLeft === null) {
    return (
      <p className="mt-3 text-sm font-semibold text-champagne">
        ¡El sorteo ya está en marcha!
      </p>
    );
  }

  return (
    <div className="mt-3" role="timer" aria-live="polite">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">
        Falta para el sorteo
      </p>
      <div className="mt-1 flex animate-heartbeat gap-2">
        <span
          className="rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1 font-display text-2xl font-bold text-red-400"
          suppressHydrationWarning
        >
          {pad(timeLeft.days)}
          <span className="ml-1 text-xs font-sans font-normal text-red-400/70">d</span>
        </span>
        <span
          className="rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1 font-display text-2xl font-bold text-red-400"
          suppressHydrationWarning
        >
          {pad(timeLeft.hours)}
          <span className="ml-1 text-xs font-sans font-normal text-red-400/70">h</span>
        </span>
        <span
          className="rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1 font-display text-2xl font-bold text-red-400"
          suppressHydrationWarning
        >
          {pad(timeLeft.minutes)}
          <span className="ml-1 text-xs font-sans font-normal text-red-400/70">m</span>
        </span>
        <span
          className="rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1 font-display text-2xl font-bold text-red-400"
          suppressHydrationWarning
        >
          {pad(timeLeft.seconds)}
          <span className="ml-1 text-xs font-sans font-normal text-red-400/70">s</span>
        </span>
      </div>
    </div>
  );
}
