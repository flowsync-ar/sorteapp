import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad — Sorteapp",
  description: "Política de Privacidad de Sorteapp (en preparación).",
};

// TODO: reemplazar por la Política de Privacidad real (Ley 25.326), redactada
// junto con Términos y Condiciones (app/(marketing)/terminos/page.tsx),
// antes de publicar el sitio. Este stub existe para que el link del footer
// legal no quede roto mientras tanto.
export default function PrivacidadPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-4xl text-foreground">
        Política de Privacidad
      </h1>
      <div
        role="note"
        aria-label="Página en preparación"
        className="mt-6 rounded-xl border border-champagne/40 bg-champagne/10 p-4 text-sm text-foreground"
      >
        Esta página está en preparación. La Política de Privacidad completa
        (tratamiento de datos personales conforme a la Ley 25.326, cookies y
        derechos de acceso/rectificación/supresión) se publicará antes del
        lanzamiento del sitio.
      </div>
      <p className="mt-6 text-muted-foreground">
        Mientras tanto, para consultas sobre tus datos personales podés
        escribir a la dirección de contacto en el pie de página, según lo
        indicado en la Cláusula 12 de los{" "}
        <a href="/terminos" className="text-champagne underline">
          Términos y Condiciones
        </a>
        .
      </p>
    </article>
  );
}
