import { describe, expect, it, vi } from "vitest";
import { derivePartialDisplayName, publishWinner } from "./winners";

describe("derivePartialDisplayName", () => {
  it("keeps the first name and the last name's initial", () => {
    expect(derivePartialDisplayName("Martín Gómez")).toBe("Martín G.");
  });

  it("handles a single-word name", () => {
    expect(derivePartialDisplayName("Cher")).toBe("Cher");
  });

  it("uses only the first and last of a multi-word name", () => {
    expect(derivePartialDisplayName("Ana María Fernández López")).toBe("Ana L.");
  });
});

function fakeSupabase(options: {
  edition: { id: string; status: string } | null;
  raffleNumber: { user_id: string; order_id: string } | null;
  order: { buyer_name: string } | null;
  updateApplied?: boolean;
}) {
  const editionMaybeSingle = vi.fn(async () => ({ data: options.edition, error: null }));
  const editionEq = vi.fn(() => ({ maybeSingle: editionMaybeSingle }));
  const editionSelect = vi.fn(() => ({ eq: editionEq }));

  const numberMaybeSingle = vi.fn(async () => ({ data: options.raffleNumber, error: null }));
  const numberEqNumber = vi.fn(() => ({ maybeSingle: numberMaybeSingle }));
  const numberEqEdition = vi.fn(() => ({ eq: numberEqNumber }));
  const numberSelect = vi.fn(() => ({ eq: numberEqEdition }));

  const orderSingle = vi.fn(async () => ({ data: options.order, error: null }));
  const orderEq = vi.fn(() => ({ single: orderSingle }));
  const orderSelect = vi.fn(() => ({ eq: orderEq }));

  const updateMaybeSingle = vi.fn(async () => ({
    data: options.updateApplied === false ? null : { id: options.edition?.id },
    error: null,
  }));
  const updateSelect = vi.fn(() => ({ maybeSingle: updateMaybeSingle }));
  const updateEqStatus = vi.fn(() => ({ select: updateSelect }));
  const updateEqId = vi.fn(() => ({ eq: updateEqStatus }));
  const update = vi.fn(() => ({ eq: updateEqId }));

  const from = vi.fn((table: string) => {
    if (table === "raffle_edition") return { select: editionSelect, update };
    if (table === "raffle_number") return { select: numberSelect };
    if (table === "order") return { select: orderSelect };
    throw new Error(`unexpected table ${table}`);
  });

  return { client: { from } as never, from, update };
}

describe("publishWinner", () => {
  it("marks a closed edition as drawn with the winner's scrubbed name", async () => {
    const { client, update } = fakeSupabase({
      edition: { id: "edition-1", status: "closed" },
      raffleNumber: { user_id: "user-1", order_id: "order-1" },
      order: { buyer_name: "Martín Gómez" },
    });

    const result = await publishWinner("edition-1", 555555, client);

    expect(result).toEqual({ applied: true });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "drawn",
        winner_number: 555555,
        winner_participant_id: "user-1",
        winner_display_name: "Martín G.",
      }),
    );
  });

  it("rejects when the edition is not closed", async () => {
    const { client } = fakeSupabase({
      edition: { id: "edition-1", status: "open" },
      raffleNumber: null,
      order: null,
    });

    await expect(publishWinner("edition-1", 555555, client)).rejects.toThrow(
      /debe estar cerrada/i,
    );
  });

  it("rejects when the winning number was never assigned in this edition", async () => {
    const { client } = fakeSupabase({
      edition: { id: "edition-1", status: "closed" },
      raffleNumber: null,
      order: null,
    });

    await expect(publishWinner("edition-1", 555555, client)).rejects.toThrow(
      /no fue asignado/i,
    );
  });
});
