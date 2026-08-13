import Link from "next/link";
import type { Metadata } from "next";
import { HeroPrize } from "@/components/marketing/HeroPrize";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { ChanceSelector } from "@/components/marketing/ChanceSelector";
import { PrizeOfMonth } from "@/components/marketing/PrizeOfMonth";
import { TrustSection } from "@/components/marketing/TrustSection";
import { PreviousWinners } from "@/components/marketing/PreviousWinners";
import { FAQAccordion } from "@/components/marketing/FAQAccordion";
import { createClient } from "@/lib/supabase/server";
import { getPublishedWinners } from "@/lib/marketing/winners";
import { getOpenEditionPrize } from "@/lib/marketing/prize";
import { getOpenEditionTiers } from "@/lib/marketing/tiers";
import {
  currentPrize,
  faqItems,
  howItWorksSteps,
  previousWinners,
  transparency,
} from "@/lib/marketing/content";

export const metadata: Metadata = {
  title: "Sorteapp — Premio con respaldo",
  description:
    "Comprá tu curso digital, sumá tu número de 6 cifras y participá del sorteo mensual con autorización de lotería y certificación de escribano.",
};

// Most content is still static example data (lib/marketing/content.ts) —
// tiers/transparency remain out of scope for this batch. Winners and the
// current prize photo are the two sections this batch (PR9.5 + prize-image)
// makes real: `getPublishedWinners`/`getOpenEditionPrize` read `raffle_edition`
// rows the admin panel actually manages, falling back to the static example
// data only when there's nothing to show yet (pre-launch). Both fetches are
// independent, so they run in parallel (vercel `async-parallel`) instead of
// a waterfall.
export default async function LandingPage() {
  const supabase = await createClient();
  const [publishedWinners, openEditionPrize, tiers] = await Promise.all([
    getPublishedWinners(supabase),
    getOpenEditionPrize(supabase),
    getOpenEditionTiers(supabase),
  ]);
  // Landing shows the 3 most recent winners; /ganadores has the full list.
  const recentWinners = (publishedWinners.length > 0 ? publishedWinners : previousWinners).slice(
    0,
    3,
  );
  // Landing shows a condensed FAQ; /faq has the full list.
  const landingFaqItems = faqItems.slice(0, 4);
  const prize = {
    ...currentPrize,
    title: openEditionPrize?.title ?? currentPrize.title,
    imageUrl: openEditionPrize?.imageUrl ?? null,
    drawDateIso: openEditionPrize?.drawDateIso ?? currentPrize.drawDateIso,
  };

  return (
    <>
      <HeroPrize prize={prize} />
      <HowItWorks steps={howItWorksSteps} />
      <ChanceSelector tiers={tiers} />
      <PrizeOfMonth prize={prize} />
      <TrustSection transparency={transparency} />

      <section>
        <PreviousWinners winners={recentWinners} />
        <p className="pb-12 text-center">
          <Link
            href="/ganadores"
            className="font-sans text-sm font-semibold text-champagne underline underline-offset-4"
          >
            Ver todos los ganadores →
          </Link>
        </p>
      </section>

      <section aria-labelledby="faq-heading" className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2
            id="faq-heading"
            className="text-center font-display text-3xl text-foreground sm:text-4xl"
          >
            Preguntas frecuentes
          </h2>
          <div className="mt-10">
            <FAQAccordion items={landingFaqItems} />
          </div>
          <p className="mt-6 text-center">
            <Link
              href="/faq"
              className="font-sans text-sm font-semibold text-champagne underline underline-offset-4"
            >
              Ver todas las preguntas →
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
