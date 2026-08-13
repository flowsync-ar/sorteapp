import { describe, expect, it } from "vitest";
import { faqItems, previousWinners, transparency } from "./content";

describe("marketing content", () => {
  it("provides at least one example winner card", () => {
    expect(previousWinners.length).toBeGreaterThan(0);
    for (const winner of previousWinners) {
      expect(winner.displayName).toMatch(/\S/);
      expect(winner.prize).toMatch(/\S/);
    }
  });

  it("provides a non-empty FAQ list", () => {
    expect(faqItems.length).toBeGreaterThan(0);
    for (const item of faqItems) {
      expect(item.question).toMatch(/\S/);
      expect(item.answer).toMatch(/\S/);
    }
  });

  it("marks the legally-sensitive transparency fields as pending real data", () => {
    // These must stay bracketed TODO placeholders (never invented data) until
    // the business supplies the real authorization/escribano details — same
    // convention as terminos-y-condiciones.md.
    expect(transparency.authorizationNumber).toMatch(/^\[.*\]$/);
    expect(transparency.notary.name).toMatch(/^\[.*\]$/);
    expect(transparency.notary.registrationNumber).toMatch(/^\[.*\]$/);
  });
});
