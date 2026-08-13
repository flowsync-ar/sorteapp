"use client";

import dynamic from "next/dynamic";

// `next/dynamic` with `ssr: false` isn't allowed directly inside a Server
// Component (Next.js App Router) — this tiny client wrapper is where it
// has to live. See `LiveChat.tsx` for why skipping SSR is the right call
// here in the first place.
const LiveChat = dynamic(
  () => import("./LiveChat").then((mod) => mod.LiveChat),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[32rem] items-center justify-center rounded-2xl border border-white/15 bg-surface/40 text-sm text-muted-foreground lg:h-full">
        Cargando chat...
      </div>
    ),
  },
);

export function LiveChatLoader() {
  return <LiveChat />;
}
