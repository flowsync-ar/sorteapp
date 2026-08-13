import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCurrentDrawStatus, isDrawLive } from "@/lib/marketing/draw-status";
import { DrawCountdown } from "@/components/marketing/DrawCountdown";

export const metadata: Metadata = {
  title: "Sorteo en vivo — Sorteapp",
  description: "Mirá el sorteo mensual en vivo, certificado por escribano público.",
};

/**
 * `/vivo`: reachable directly or via the header's `LiveDrawNavItem`.
 * TODO: embed the real stream (YouTube/Instagram Live) once we have the
 * channel — same "[ ]" placeholder convention `lib/marketing/content.ts`
 * already uses for pending real content. Until then this shows the
 * countdown before the draw and a "ya está en marcha" notice during it.
 */
export default async function VivoPage() {
  const supabase = await createClient();
  const draw = await getCurrentDrawStatus(supabase);
  const isLive = isDrawLive(draw);

  return (
    <div className="px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl text-center">
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
              <div className="mt-4 flex justify-center">
                <DrawCountdown drawDateIso={draw.drawDateIso} />
              </div>
            )}

            <div className="mt-10 flex aspect-video items-center justify-center rounded-2xl border border-dashed border-champagne/30 bg-surface/40 text-muted-foreground">
              {/* TODO: reemplazar por el embed real (YouTube/Instagram Live) */}
              La transmisión se va a mostrar acá.
            </div>
          </>
        ) : (
          <p className="mt-4 text-muted-foreground">
            Todavía no hay un sorteo programado.
          </p>
        )}
      </div>
    </div>
  );
}
