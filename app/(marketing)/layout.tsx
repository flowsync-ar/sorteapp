import Image from "next/image";
import Link from "next/link";
import { LegalFooter } from "@/components/marketing/LegalFooter";
import { LiveDrawNavItem } from "@/components/marketing/LiveDrawNavItem";
import { ScrollToHash } from "@/components/marketing/ScrollToHash";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { WhatsAppButton } from "@/components/marketing/WhatsAppButton";
import { createClient } from "@/lib/supabase/server";
import { getCurrentDrawStatus } from "@/lib/marketing/draw-status";
import { contact } from "@/lib/marketing/content";

/**
 * Shared shell for the public marketing routes (design.md `app/(marketing)/`
 * — RSC-first, ISR-cached): minimal header nav + legal footer. Root
 * `app/layout.tsx` already provides fonts and the `<html>/<body>` shell.
 */
export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const draw = await getCurrentDrawStatus(supabase);

  return (
    <>
      <header className="relative z-20 flex min-h-28 items-center border-b border-surface px-6 py-4">
        <Link
          href="/"
          className="absolute left-6 top-0 flex items-start"
          aria-label="Sorteapp"
        >
          <Image
            src="/logo-sorteoapp-transp.png"
            alt="Sorteapp"
            width={862}
            height={713}
            priority
            className="h-28 w-auto"
          />
        </Link>
        <div className="flex h-12 w-full items-center justify-end">
          <nav
            aria-label="Principal"
            className="flex items-center gap-6 font-sans text-base text-muted-foreground"
          >
            <Link href="/#tiers" scroll={false} className="hover:text-foreground">
              Cursos
            </Link>
            <Link href="/transparencia" className="hover:text-foreground">
              Transparencia
            </Link>
            <Link href="/faq" className="hover:text-foreground">
              FAQ
            </Link>
            {draw ? (
              <LiveDrawNavItem drawDateIso={draw.drawDateIso} />
            ) : null}
            <Link
              href="/login"
              className="rounded-lg border border-surface px-4 py-1.5 text-foreground transition hover:border-champagne hover:text-champagne"
            >
              Ingresar
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <ScrollToHash />

      <main className="flex-1">{children}</main>

      <LegalFooter contactEmail={contact.email} />

      <WhatsAppButton />
    </>
  );
}
