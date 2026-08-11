import type { Metadata } from "next";
import { PreviousWinners } from "@/components/marketing/PreviousWinners";
import { previousWinners } from "@/lib/marketing/content";

export const metadata: Metadata = {
  title: "Ganadores anteriores — Sorteapp",
  description: "Historial de ganadores de los sorteos mensuales de Sorteapp.",
};

export default function GanadoresPage() {
  return (
    <div className="px-6 py-12">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="font-display text-4xl text-foreground">
          Ganadores anteriores
        </h1>
        <p className="mt-4 text-muted-foreground">
          Cada resultado está certificado por escribano público — ver el acta
          de cada edición en{" "}
          <a href="/transparencia" className="text-champagne underline">
            Transparencia
          </a>
          .
        </p>
      </div>
      <PreviousWinners winners={previousWinners} />
    </div>
  );
}
