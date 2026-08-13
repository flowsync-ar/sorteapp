import Image from "next/image";
import Link from "next/link";
import { LegalFooter } from "@/components/marketing/LegalFooter";
import { contact } from "@/lib/marketing/content";

/**
 * Shared shell for the public marketing routes (design.md `app/(marketing)/`
 * — RSC-first, ISR-cached): minimal header nav + legal footer. Root
 * `app/layout.tsx` already provides fonts and the `<html>/<body>` shell.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="relative z-20 border-b border-surface px-6 py-4">
        <Link
          href="/"
          className="absolute left-6 top-0 flex items-start"
          aria-label="Sorteapp"
        >
          <Image
            src="/logo-sorteoapp-transp.png"
            alt="Sorteapp"
            width={2400}
            height={1309}
            priority
            className="h-56 w-auto"
          />
        </Link>
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-end">
          <nav
            aria-label="Principal"
            className="flex items-center gap-6 font-sans text-sm text-muted-foreground"
          >
            <Link href="/#tiers" className="hover:text-foreground">
              Cursos
            </Link>
            <Link href="/transparencia" className="hover:text-foreground">
              Transparencia
            </Link>
            <Link href="/faq" className="hover:text-foreground">
              FAQ
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-surface px-4 py-1.5 text-foreground transition hover:border-champagne hover:text-champagne"
            >
              Ingresar
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <LegalFooter contactEmail={contact.email} />
    </>
  );
}
