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
      <header className="border-b border-surface px-6 py-4">
        <Link href="/" className="flex items-center" aria-label="Sorteapp">
          <Image
            src="/logo.png"
            alt="Sorteapp"
            width={497}
            height={401}
            priority
            className="h-12 w-auto"
          />
        </Link>
      </header>

      <main className="flex-1">{children}</main>
    </>
  );
}
