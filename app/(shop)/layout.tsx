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
        <Link href="/" className="font-display text-lg text-foreground">
          Sorteapp
        </Link>
      </header>

      <main className="flex-1">{children}</main>
    </>
  );
}
