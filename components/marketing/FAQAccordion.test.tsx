import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FAQAccordion } from "./FAQAccordion";

const items = [
  { question: "¿Cómo se paga?", answer: "Con Mercado Pago o transferencia." },
  { question: "¿Qué pasa si no gano?", answer: "Te quedás con el curso igual." },
];

describe("FAQAccordion", () => {
  it("renders every question", () => {
    render(<FAQAccordion items={items} />);

    for (const item of items) {
      expect(
        screen.getByRole("button", { name: item.question }),
      ).toBeInTheDocument();
    }
  });

  it("hides answers until their question is expanded", () => {
    render(<FAQAccordion items={items} />);

    expect(screen.queryByText(items[0].answer)).not.toBeInTheDocument();
  });

  it("reveals the answer when the question is clicked, and hides it again on a second click", async () => {
    const user = userEvent.setup();
    render(<FAQAccordion items={items} />);

    const question = screen.getByRole("button", { name: items[0].question });
    await user.click(question);
    expect(screen.getByText(items[0].answer)).toBeInTheDocument();
    expect(question).toHaveAttribute("aria-expanded", "true");

    await user.click(question);
    expect(screen.queryByText(items[0].answer)).not.toBeInTheDocument();
    expect(question).toHaveAttribute("aria-expanded", "false");
  });
});
