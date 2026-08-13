import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChanceSelector } from "./ChanceSelector";

const tiers = [
  { id: "tier-1", numbersGranted: 1, priceArs: 15000 },
  { id: "tier-2", numbersGranted: 6, priceArs: 52000 },
];

describe("ChanceSelector", () => {
  it("defaults to the first tier and shows its price", () => {
    render(<ChanceSelector tiers={tiers} />);

    expect(
      screen.getByRole("button", { name: /cantidad de chances/i }),
    ).toHaveTextContent("1 chance — $ 15.000");
    expect(screen.getByText("$ 15.000")).toBeInTheDocument();
  });

  it("enables Continuar as a link to the selected tier's checkout route", () => {
    render(<ChanceSelector tiers={tiers} />);

    expect(screen.getByRole("link", { name: /continuar/i })).toHaveAttribute(
      "href",
      "/checkout/tier-1",
    );
  });

  it("updates the price and checkout link when the dropdown selection changes", async () => {
    const user = userEvent.setup();
    render(<ChanceSelector tiers={tiers} />);

    await user.click(screen.getByRole("button", { name: /cantidad de chances/i }));
    await user.click(screen.getByRole("option", { name: /6 chances/i }));

    expect(screen.getByText("$ 52.000")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /continuar/i })).toHaveAttribute(
      "href",
      "/checkout/tier-2",
    );
  });

  it("shows an empty state instead of a dropdown when there are no tiers", () => {
    render(<ChanceSelector tiers={[]} />);

    expect(
      screen.queryByRole("button", { name: /cantidad de chances/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/todavía no hay chances disponibles/i)).toBeInTheDocument();
  });
});
