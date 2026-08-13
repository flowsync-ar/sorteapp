import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TRANSFER_DISCOUNT_PERCENT } from "@/lib/checkout/pricing";
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
 * `(shop)/checkout/[tier]/`, tasks.md 5.2). The `[tier]` route param is a
 * `tier.id` (uuid) now, not a global key (change: edition-tiers) — tiers are
 * per-edition, so there's no longer a stable name/catalog to look up display
 * copy from; both price and chance count come straight from the DB row.
 */
export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { tier: tierId } = await params;

  const supabase = await createClient();
  const { data: dbTier } = await supabase
    .from("tier")
    .select("price_ars, numbers_granted")
    .eq("id", tierId)
    .maybeSingle();

  if (!dbTier) {
    notFound();
  }

  const priceArs = Number(dbTier.price_ars);
  const numbersGranted = Number(dbTier.numbers_granted);
  const tierName = `${numbersGranted} ${numbersGranted === 1 ? "chance" : "chances"}`;
  const boundCreateOrder = createOrder.bind(null, tierId);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <p className="font-sans text-sm tracking-widest text-champagne uppercase">
        Checkout
      </p>
      <h1 className="mt-2 font-display text-3xl text-foreground sm:text-4xl">
        {tierName}
      </h1>

      <div className="mt-6 rounded-2xl border border-surface bg-surface/40 p-6">
        <p className="font-display text-3xl text-champagne">
          {formatArs(priceArs)}
        </p>
        <p className="mt-1 text-sm font-semibold text-emerald">
          {numbersGranted}{" "}
          {numbersGranted === 1
            ? "número de 6 cifras"
            : "números de 6 cifras"}
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          {TRANSFER_DISCOUNT_PERCENT}% off pagando por transferencia bancaria.
        </p>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-xl text-foreground">Tus datos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Los usamos para asignarte tu número y avisarte si resultás
          ganador — nunca los compartimos con terceros.
        </p>
        <div className="mt-6">
          <CheckoutForm action={boundCreateOrder} tierName={tierName} />
        </div>
      </div>
    </div>
  );
}
