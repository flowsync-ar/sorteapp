import type { HowItWorksStep } from "@/lib/marketing/content";

interface HowItWorksProps {
  steps: HowItWorksStep[];
}

/**
 * "Cómo funciona" (spec.md §1): elegís tu curso → recibís tu número →
 * accedés al curso → participás del sorteo.
 */
export function HowItWorks({ steps }: HowItWorksProps) {
  return (
    <section aria-labelledby="como-funciona-heading" className="px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <h2
          id="como-funciona-heading"
          className="text-center font-display text-3xl text-foreground sm:text-4xl"
        >
          Cómo funciona
        </h2>

        <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-3">
              <span
                aria-hidden
                className="flex size-9 items-center justify-center rounded-full bg-champagne/15 font-display text-champagne"
              >
                {index + 1}
              </span>
              <h3 className="font-sans text-lg font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
