interface LegalFooterProps {
  contactEmail: string;
}

/** Footer legal (spec.md §1): links to T&C, Privacidad, y contacto. */
export function LegalFooter({ contactEmail }: LegalFooterProps) {
  return (
    <footer className="border-t border-surface px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Sorteapp. Todos los derechos reservados.</p>

        <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2">
          <a href="/terminos" className="hover:text-foreground">
            Términos y Condiciones
          </a>
          <a href="/privacidad" className="hover:text-foreground">
            Política de Privacidad
          </a>
          <a href="/transparencia" className="hover:text-foreground">
            Transparencia
          </a>
          <a href={`mailto:${contactEmail}`} className="hover:text-foreground">
            {contactEmail}
          </a>
        </nav>
      </div>
    </footer>
  );
}
