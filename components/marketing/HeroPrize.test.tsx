import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroPrize } from "./HeroPrize";

const prize = {
  title: "Moto 0km Honda Wave 110s",
  editionLabel: "Edición Agosto 2026",
  drawDateIso: "2026-08-31T21:00:00-03:00",
  description: "0km, patentada a nombre del ganador.",
  imageAlt: "Moto 0km, premio del sorteo vigente",
};

describe("HeroPrize", () => {
  it("renders the brand tagline as the main heading", () => {
    render(<HeroPrize prize={prize} />);

    expect(
      screen.getByRole("heading", { level: 1, name: /premio con respaldo/i }),
    ).toBeInTheDocument();
  });

  it("shows the current prize title and edition label", () => {
    render(<HeroPrize prize={prize} />);

    expect(screen.getByText(prize.title)).toBeInTheDocument();
    expect(screen.getByText(prize.editionLabel)).toBeInTheDocument();
  });

  it("renders a call-to-action link to buy", () => {
    render(<HeroPrize prize={prize} />);

    const cta = screen.getByRole("link", { name: /compr/i });
    expect(cta).toHaveAttribute("href", "#tiers");
  });

  it("renders the prize image with descriptive alt text", () => {
    render(<HeroPrize prize={prize} />);

    expect(screen.getByAltText(prize.imageAlt)).toBeInTheDocument();
  });

  it("falls back to the placeholder image when there is no real prize image yet", () => {
    render(<HeroPrize prize={{ ...prize, imageUrl: null }} />);

    expect(screen.getByAltText(prize.imageAlt)).toHaveAttribute(
      "src",
      expect.stringContaining("prize-placeholder.svg"),
    );
  });

  it("renders the real prize image url when the open edition has one", () => {
    render(
      <HeroPrize
        prize={{ ...prize, imageUrl: "https://cdn.example.com/prize-images/edition-1?v=1" }}
      />,
    );

    expect(screen.getByAltText(prize.imageAlt)).toHaveAttribute(
      "src",
      expect.stringContaining(encodeURIComponent("https://cdn.example.com/prize-images/edition-1?v=1")),
    );
  });
});
