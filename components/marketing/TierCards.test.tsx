import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TierCards } from "./TierCards";

const tiers = [
  {
    key: "inicial" as const,
    name: "Inicial",
    priceArs: 15000,
    numbersGranted: 1,
    transferDiscountPercent: 10,
    includes: ["1 curso digital"],
  },
  {
    key: "premium" as const,
    name: "Premium",
    priceArs: 60000,
    numbersGranted: 6,
    transferDiscountPercent: 10,
    includes: ["Todo el catálogo"],
  },
];

describe("TierCards", () => {
  it("renders a selectable option per tier with name and price", () => {
    render(<TierCards tiers={tiers} />);

    expect(
      screen.getByRole("radio", { name: /inicial/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /premium/i }),
    ).toBeInTheDocument();
  });

  it("disables the Continuar button until a tier is selected", () => {
    render(<TierCards tiers={tiers} />);

    expect(screen.getByRole("button", { name: /continuar/i })).toBeDisabled();
  });

  it("selecting a tier enables Continuar as a link to its checkout route", async () => {
    const user = userEvent.setup();
    render(<TierCards tiers={tiers} />);

    await user.click(screen.getByRole("radio", { name: /inicial/i }));

    const continueLink = screen.getByRole("link", { name: /continuar/i });
    expect(continueLink).toHaveAttribute("href", "/checkout/inicial");
  });

  it("only one tier can be selected at a time", async () => {
    const user = userEvent.setup();
    render(<TierCards tiers={tiers} />);

    await user.click(screen.getByRole("radio", { name: /inicial/i }));
    await user.click(screen.getByRole("radio", { name: /premium/i }));

    expect(screen.getByRole("radio", { name: /inicial/i })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: /premium/i })).toBeChecked();
    expect(screen.getByRole("link", { name: /continuar/i })).toHaveAttribute(
      "href",
      "/checkout/premium",
    );
  });
});
