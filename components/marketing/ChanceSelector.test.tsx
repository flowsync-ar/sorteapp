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

    expect(screen.getByRole("combobox")).toHaveValue("tier-1");
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

    await user.selectOptions(screen.getByRole("combobox"), "tier-2");

    expect(screen.getByText("$ 52.000")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /continuar/i })).toHaveAttribute(
      "href",
      "/checkout/tier-2",
    );
  });

  it("shows an empty state instead of a dropdown when there are no tiers", () => {
    render(<ChanceSelector tiers={[]} />);

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByText(/todavía no hay chances disponibles/i)).toBeInTheDocument();
  });
});
