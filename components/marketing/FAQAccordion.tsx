"use client";

import { useId, useState } from "react";
import type { FaqItem } from "@/lib/marketing/content";

interface FAQAccordionProps {
  items: FaqItem[];
}

export function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const baseId = useId();

  return (
    <ul className="divide-y divide-surface">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const buttonId = `${baseId}-question-${index}`;
        const panelId = `${baseId}-answer-${index}`;

        return (
          <li key={item.question}>
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-4 py-5 text-left font-sans text-base font-medium text-foreground"
              >
                {item.question}
                <span aria-hidden className="text-champagne">
                  {isOpen ? "−" : "+"}
                </span>
              </button>
            </h3>
            {isOpen ? (
              <p
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className="pb-5 text-muted-foreground"
              >
                {item.answer}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
