import Image from "next/image";
import Link from "next/link";

/**
 * Minimal shell for the checkout flow (design.md `(shop)/checkout/[tier]/`).
 * Deliberately lighter than `(marketing)`'s header/footer — no distracting
 * nav links away from the purchase, a common checkout-UX pattern. Root
 * `app/layout.tsx` already provides fonts and the `<html>/<body>` shell.
 */
export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="relative z-20 flex h-20 items-start border-b border-surface px-6 py-4">
        <Link href="/" className="flex items-center" aria-label="Sorteapp">
          <Image
            src="/logo-sorteoapp-transp.png"
            alt="Sorteapp"
            width={2400}
            height={1309}
            priority
            className="h-56 w-auto"
          />
        </Link>
      </header>

      <main className="flex-1">{children}</main>
    </>
  );
}
