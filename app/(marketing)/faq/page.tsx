import type { Metadata } from "next";
import { FAQAccordion } from "@/components/marketing/FAQAccordion";
import { faqItems } from "@/lib/marketing/content";

export const metadata: Metadata = {
  title: "Preguntas frecuentes — Sorteapp",
  description: "Todo lo que necesitás saber sobre el pago, la entrega del curso y el sorteo.",
};

export default function FaqPage() {
  return (
    <div className="px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-center font-display text-4xl text-foreground">
          Preguntas frecuentes
        </h1>
        <div className="mt-10">
          <FAQAccordion items={faqItems} />
        </div>
      </div>
    </div>
  );
}
