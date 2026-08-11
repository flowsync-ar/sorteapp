import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { HowItWorks } from "./HowItWorks";

const steps = [
  { title: "Elegís tu curso", description: "Comparás los tiers." },
  { title: "Recibís tu número", description: "Se asigna al confirmarse el pago." },
];

describe("HowItWorks", () => {
  it("renders every step title and description in order", () => {
    render(<HowItWorks steps={steps} />);

    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings.map((h) => h.textContent)).toEqual(
      steps.map((s) => s.title),
    );
    for (const step of steps) {
      expect(screen.getByText(step.description)).toBeInTheDocument();
    }
  });

  it("numbers each step for scannability", () => {
    render(<HowItWorks steps={steps} />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
