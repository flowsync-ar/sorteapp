import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCurrentDrawStatus, isDrawLive } from "@/lib/marketing/draw-status";
import { DrawCountdown } from "@/components/marketing/DrawCountdown";
import { LiveChatLoader } from "@/components/marketing/LiveChatLoader";
import { LiveStreamEmbed } from "@/components/marketing/LiveStreamEmbed";

export const metadata: Metadata = {
  title: "Sorteo en vivo — Sorteapp",
  description: "Mirá el sorteo mensual en vivo, certificado por escribano público.",
};

/**
 * `/vivo`: reachable directly or via the header's `LiveDrawNavItem`. The
 * admin broadcasts on YouTube Live (any tool that streams to their
 * channel — OBS, a phone via YouTube's app, etc.); `LiveStreamEmbed` shows
 * it automatically once they go live, no per-edition config needed.
 */
export default async function VivoPage() {
  const supabase = await createClient();
  const draw = await getCurrentDrawStatus(supabase);
  const isLive = isDrawLive(draw);

  return (
    <div className="px-6 py-16 sm:py-20">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="text-center lg:text-left">
          <h1 className="font-display text-4xl text-foreground sm:text-5xl">
            Sorteo en vivo
          </h1>

          {draw ? (
            <>
              {isLive ? (
                <p className="mt-4 text-lg font-semibold text-red-400">
                  ● El sorteo ya está en marcha
                </p>
              ) : (
                <div className="mt-4 flex justify-center lg:justify-start">
                  <DrawCountdown drawDateIso={draw.drawDateIso} />
                </div>
              )}

              <div className="mt-10">
                <LiveStreamEmbed />
              </div>
            </>
          ) : (
            <p className="mt-4 text-muted-foreground">
              Todavía no hay un sorteo programado.
            </p>
          )}
        </div>

        <div className="lg:h-[36rem]">
          <LiveChatLoader />
        </div>
      </div>
    </div>
  );
}
