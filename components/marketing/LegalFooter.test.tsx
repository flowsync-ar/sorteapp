import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LegalFooter } from "./LegalFooter";

describe("LegalFooter", () => {
  it("links to Términos y Condiciones", () => {
    render(<LegalFooter contactEmail="contacto@example.com" />);

    expect(
      screen.getByRole("link", { name: /términos y condiciones/i }),
    ).toHaveAttribute("href", "/terminos");
  });

  it("links to Política de Privacidad (placeholder page, not a dead link)", () => {
    render(<LegalFooter contactEmail="contacto@example.com" />);

    expect(
      screen.getByRole("link", { name: /política de privacidad/i }),
    ).toHaveAttribute("href", "/privacidad");
  });

  it("shows the contact email", () => {
    render(<LegalFooter contactEmail="contacto@example.com" />);

    expect(screen.getByText("contacto@example.com")).toBeInTheDocument();
  });
});
