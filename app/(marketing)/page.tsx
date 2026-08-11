import Link from "next/link";
import type { Metadata } from "next";
import { HeroPrize } from "@/components/marketing/HeroPrize";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { TierCards } from "@/components/marketing/TierCards";
import { PrizeOfMonth } from "@/components/marketing/PrizeOfMonth";
import { TrustSection } from "@/components/marketing/TrustSection";
import { PreviousWinners } from "@/components/marketing/PreviousWinners";
import { FAQAccordion } from "@/components/marketing/FAQAccordion";
import {
  currentPrize,
  faqItems,
  howItWorksSteps,
  previousWinners,
  tiers,
  transparency,
} from "@/lib/marketing/content";

export const metadata: Metadata = {
  title: "Sorteapp — Premio con respaldo",
  description:
    "Comprá tu curso digital, sumá tu número de 6 cifras y participá del sorteo mensual con autorización de lotería y certificación de escribano.",
};

// Content is static example data for now (lib/marketing/content.ts). Once
// editions/tiers/winners live in Supabase (PR2 schema is already in place),
// swap these for parallel Promise.all fetches here — see design.md §1
// "Data fetching parallelized with Promise.all in RSC to avoid waterfalls".
export default function LandingPage() {
  // Landing shows the 3 most recent winners; /ganadores has the full list.
  const recentWinners = previousWinners.slice(0, 3);
  // Landing shows a condensed FAQ; /faq has the full list.
  const landingFaqItems = faqItems.slice(0, 4);

  return (
    <>
      <HeroPrize prize={currentPrize} />
      <HowItWorks steps={howItWorksSteps} />
      <TierCards tiers={tiers} />
      <PrizeOfMonth prize={currentPrize} />
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
