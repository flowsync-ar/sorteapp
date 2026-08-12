import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EditionsTable } from "./EditionsTable";
import type { EditionView } from "@/lib/admin/editions";

const openEdition: EditionView = {
  id: "edition-open",
  month: 9,
  year: 2026,
  status: "open",
  numberCap: 500,
  numbersSold: 12,
  prizeTitle: "TV 55",
  drawDateIso: "2026-09-30T21:00:00Z",
  winnerNumber: null,
  winnerDisplayName: null,
  prizeImageUrl: null,
};

const closedEdition: EditionView = {
  ...openEdition,
  id: "edition-closed",
  status: "closed",
};

const drawnEdition: EditionView = {
  ...openEdition,
  id: "edition-drawn",
  status: "drawn",
  winnerNumber: 555555,
  winnerDisplayName: "Martín G.",
};

describe("EditionsTable", () => {
  it("renders an empty state when there are no editions", () => {
    render(
      <EditionsTable
        editions={[]}
        closeAction={vi.fn()}
        publishAction={vi.fn()}
        prizeImageAction={vi.fn()}
      />,
    );
    expect(screen.getByText(/todavía no hay ediciones/i)).toBeInTheDocument();
  });

  it("shows a close button only for the open edition", () => {
    render(
      <EditionsTable
        editions={[openEdition, closedEdition]}
        closeAction={() => vi.fn()}
        publishAction={() => vi.fn()}
        prizeImageAction={() => vi.fn()}
      />,
    );
    expect(screen.getAllByRole("button", { name: /cerrar edición/i })).toHaveLength(1);
  });

  it("shows a winner-number input only for closed editions", () => {
    render(
      <EditionsTable
        editions={[openEdition, closedEdition]}
        closeAction={() => vi.fn()}
        publishAction={() => vi.fn()}
        prizeImageAction={() => vi.fn()}
      />,
    );
    expect(screen.getByLabelText(/número ganador/i)).toBeInTheDocument();
  });

  it("shows the published winner for a drawn edition", () => {
    render(
      <EditionsTable
        editions={[drawnEdition]}
        closeAction={() => vi.fn()}
        publishAction={() => vi.fn()}
        prizeImageAction={() => vi.fn()}
      />,
    );
    expect(screen.getByText(/555555/)).toBeInTheDocument();
    expect(screen.getByText(/martín g\./i)).toBeInTheDocument();
  });

  it("shows a re-upload prize-image control for every edition row", () => {
    render(
      <EditionsTable
        editions={[openEdition, closedEdition]}
        closeAction={() => vi.fn()}
        publishAction={() => vi.fn()}
        prizeImageAction={() => vi.fn()}
      />,
    );
    expect(screen.getAllByLabelText(/foto del premio/i)).toHaveLength(2);
  });
});
