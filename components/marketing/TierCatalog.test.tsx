import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TierCatalog } from "./TierCatalog";

const tiers = [
  {
    key: "inicial" as const,
    name: "Inicial",
    priceArs: 15000,
    numbersGranted: 1,
    transferDiscountPercent: 10,
    includes: ["1 curso digital", "1 número de 6 cifras"],
  },
  {
    key: "premium" as const,
    name: "Premium",
    priceArs: 60000,
    numbersGranted: 6,
    transferDiscountPercent: 10,
    includes: ["Todo el catálogo", "6 números de 6 cifras"],
  },
];

describe("TierCatalog", () => {
  it("renders a card per tier with its name and price in ARS", () => {
    render(<TierCatalog tiers={tiers} />);

    expect(screen.getByText("Inicial")).toBeInTheDocument();
    expect(screen.getByText("Premium")).toBeInTheDocument();
    expect(screen.getByText(/\$\s?15\.000/)).toBeInTheDocument();
    expect(screen.getByText(/\$\s?60\.000/)).toBeInTheDocument();
  });

  it("lists what each tier includes", () => {
    render(<TierCatalog tiers={tiers} />);

    expect(screen.getByText("1 curso digital")).toBeInTheDocument();
    expect(screen.getByText("Todo el catálogo")).toBeInTheDocument();
  });

  it("shows the transfer discount and links each tier to its future checkout route", () => {
    render(<TierCatalog tiers={tiers} />);

    expect(screen.getAllByText(/10%/)[0]).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /elegir inicial/i });
    expect(link).toHaveAttribute("href", "/checkout/inicial");
  });
});
