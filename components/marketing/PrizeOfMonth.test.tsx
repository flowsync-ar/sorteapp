import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PrizeOfMonth } from "./PrizeOfMonth";

const prize = {
  title: "Moto 0km Honda Wave 110s",
  editionLabel: "Edición Agosto 2026",
  drawDateIso: "2026-08-31T21:00:00-03:00",
  description: "0km, patentada a nombre del ganador.",
  imageAlt: "Moto 0km, premio del sorteo vigente",
};

describe("PrizeOfMonth", () => {
  it("renders the prize title, edition and description", () => {
    render(<PrizeOfMonth prize={prize} />);

    expect(
      screen.getByRole("heading", { name: prize.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(prize.editionLabel)).toBeInTheDocument();
    expect(screen.getByText(prize.description)).toBeInTheDocument();
  });

  it("renders a placeholder image with descriptive alt text", () => {
    render(<PrizeOfMonth prize={prize} />);

    expect(screen.getByAltText(prize.imageAlt)).toBeInTheDocument();
  });
});
