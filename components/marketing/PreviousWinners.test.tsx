import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PreviousWinners } from "./PreviousWinners";

const winners = [
  {
    id: "w1",
    displayName: "Martín G.",
    prize: "Notebook 15\"",
    dateIso: "2026-06-30",
    editionLabel: "Edición Junio 2026",
  },
  {
    id: "w2",
    displayName: "Rocío A.",
    prize: "Smart TV 55\"",
    dateIso: "2026-07-31",
    editionLabel: "Edición Julio 2026",
  },
];

describe("PreviousWinners", () => {
  it("renders a card per winner with partial name, prize and edition", () => {
    render(<PreviousWinners winners={winners} />);

    for (const winner of winners) {
      expect(screen.getByText(winner.displayName)).toBeInTheDocument();
      expect(screen.getByText(winner.prize)).toBeInTheDocument();
      expect(screen.getByText(winner.editionLabel)).toBeInTheDocument();
    }
  });

  it("renders nothing but an empty list when there are no winners yet", () => {
    render(<PreviousWinners winners={[]} />);

    expect(screen.getByRole("list")).toBeEmptyDOMElement();
  });
});
