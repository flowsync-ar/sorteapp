import type { Metadata } from "next";
import { TrustSection } from "@/components/marketing/TrustSection";
import { transparency } from "@/lib/marketing/content";

export const metadata: Metadata = {
  title: "Transparencia — Sorteapp",
  description:
    "Autorización de lotería, escribanía interviniente y actas de sorteo de Sorteapp.",
};

export default function TransparenciaPage() {
  return (
    <div className="py-12">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h1 className="font-display text-4xl text-foreground">
          Transparencia
        </h1>
        <p className="mt-4 text-muted-foreground">
          Todos nuestros sorteos cuentan con autorización oficial y
          certificación notarial. Publicamos los datos verificables acá, sin
          intermediarios.
        </p>
      </div>
      <TrustSection transparency={transparency} />
    </div>
  );
}
