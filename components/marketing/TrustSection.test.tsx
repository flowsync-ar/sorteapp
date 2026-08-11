import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrustSection } from "./TrustSection";

const transparency = {
  lotteryAuthority: "Instituto Provincial de Lotería y Casinos",
  authorizationNumber: "12345/2026",
  jurisdiction: "Buenos Aires",
  notary: { name: "Ana Pérez", registrationNumber: "4321" },
  lastActaUrl: "https://example.com/actas/2026-07.pdf",
};

describe("TrustSection", () => {
  it("renders the lottery authorization number (spec.md Scenario: Visitante ve confianza verificable)", () => {
    render(<TrustSection transparency={transparency} />);

    expect(screen.getByText(/12345\/2026/)).toBeInTheDocument();
  });

  it("renders the notary's name and registration number", () => {
    render(<TrustSection transparency={transparency} />);

    expect(screen.getByText(/Ana Pérez/)).toBeInTheDocument();
    expect(screen.getByText(/4321/)).toBeInTheDocument();
  });

  it("links to the latest sorteo acta", () => {
    render(<TrustSection transparency={transparency} />);

    const link = screen.getByRole("link", { name: /acta/i });
    expect(link).toHaveAttribute("href", transparency.lastActaUrl);
  });

  it("uses a labelled section landmark so it's independently reachable (a11y)", () => {
    render(<TrustSection transparency={transparency} />);

    expect(
      screen.getByRole("region", { name: /transparencia/i }),
    ).toBeInTheDocument();
  });
});
