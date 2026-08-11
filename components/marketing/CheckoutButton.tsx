import Link from "next/link";

interface CheckoutButtonProps {
  /** Selected tier key, or `null` when nothing is selected yet. */
  selectedTier: string | null;
}

/**
 * "Continuar" CTA for `TierCards` (design.md §7 `TierCards` + `CheckoutButton`
 * island). Disabled `<button>` with no tier selected — a real `<Link>` once
 * one is, so it's a normal navigable anchor (no client-side `router.push`
 * needed) to `/checkout/[tier]` (app/(shop)/checkout/[tier]/page.tsx).
 */
export function CheckoutButton({ selectedTier }: CheckoutButtonProps) {
  const className =
    "mt-8 inline-flex items-center justify-center rounded-lg bg-champagne px-8 py-3 font-sans text-sm font-semibold text-ink transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:opacity-40";

  if (!selectedTier) {
    return (
      <button type="button" disabled className={className}>
        Continuar
      </button>
    );
  }

  return (
    <Link href={`/checkout/${selectedTier}`} className={className}>
      Continuar
    </Link>
  );
}
