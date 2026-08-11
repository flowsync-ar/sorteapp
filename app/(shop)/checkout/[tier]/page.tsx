import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { tiers as tierContent } from "@/lib/marketing/content";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { createOrder } from "./actions";

interface CheckoutPageProps {
  params: Promise<{ tier: string }>;
}

function formatArs(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Tier summary + buyer form + payment method selection (design.md
 * `(shop)/checkout/[tier]/`, tasks.md 5.2). Price/availability come from the
 * DB `tier` row (authoritative — must match what `createOrder` charges);
 * display copy (name, includes) comes from `lib/marketing/content.ts`, same
 * as the landing.
 */
export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { tier: tierKey } = await params;
  const displayTier = tierContent.find((t) => t.key === tierKey);

  if (!displayTier) {
    notFound();
  }

  const supabase = await createClient();
  const { data: dbTier } = await supabase
    .from("tier")
    .select("price_ars")
    .eq("key", tierKey)
    .maybeSingle();

  if (!dbTier) {
    notFound();
  }

  const priceArs = Number(dbTier.price_ars);
  const boundCreateOrder = createOrder.bind(null, tierKey);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <p className="font-sans text-sm tracking-widest text-champagne uppercase">
        Checkout
      </p>
      <h1 className="mt-2 font-display text-3xl text-foreground sm:text-4xl">
        {displayTier.name}
      </h1>

      <div className="mt-6 rounded-2xl border border-surface bg-surface/40 p-6">
        <p className="font-display text-3xl text-champagne">
          {formatArs(priceArs)}
        </p>
        <p className="mt-1 text-sm font-semibold text-emerald">
          {displayTier.numbersGranted}{" "}
          {displayTier.numbersGranted === 1
            ? "número de 6 cifras"
            : "números de 6 cifras"}
        </p>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          {displayTier.includes.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden className="text-emerald">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          {displayTier.transferDiscountPercent}% off pagando por
          transferencia bancaria.
        </p>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-xl text-foreground">Tus datos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Los usamos para asignarte tu número y avisarte si resultás
          ganador — nunca los compartimos con terceros.
        </p>
        <div className="mt-6">
          <CheckoutForm action={boundCreateOrder} tierName={displayTier.name} />
        </div>
      </div>
    </div>
  );
}
