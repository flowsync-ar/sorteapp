import { describe, expect, it, vi } from "vitest";
import { closeEdition, createEdition, listEditions, validateCreateEditionInput } from "./editions";

const row = {
  id: "edition-1",
  month: 8,
  year: 2026,
  status: "open",
  number_cap: 1000,
  numbers_sold: 10,
  prize_title: "Moto 0km",
  draw_date: "2026-08-31T21:00:00Z",
  winner_number: null,
  winner_display_name: null,
  prize_image: "https://project.supabase.co/storage/v1/object/public/prize-images/edition-1?v=1",
};

describe("validateCreateEditionInput", () => {
  it("accepts a well-formed edition", () => {
    const result = validateCreateEditionInput({
      month: "8",
      year: "2026",
      numberCap: "1000",
      prizeTitle: "Moto 0km",
      drawDate: "2026-08-31T21:00",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an out-of-range month", () => {
    const result = validateCreateEditionInput({
      month: "13",
      year: "2026",
      numberCap: "1000",
      prizeTitle: "Moto 0km",
      drawDate: "2026-08-31T21:00",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing prize title", () => {
    const result = validateCreateEditionInput({
      month: "8",
      year: "2026",
      numberCap: "1000",
      prizeTitle: "",
      drawDate: "2026-08-31T21:00",
    });
    expect(result.success).toBe(false);
  });
});

describe("listEditions", () => {
  it("maps edition rows into the admin view shape", async () => {
    const order = vi.fn(async () => ({ data: [row], error: null }));
    const select = vi.fn(() => ({ order }));
    const from = vi.fn(() => ({ select }));

    const result = await listEditions({ from } as never);

    expect(from).toHaveBeenCalledWith("raffle_edition");
    expect(result).toEqual([
      {
        id: "edition-1",
        month: 8,
        year: 2026,
        status: "open",
        numberCap: 1000,
        numbersSold: 10,
        prizeTitle: "Moto 0km",
        drawDateIso: "2026-08-31T21:00:00Z",
        winnerNumber: null,
        winnerDisplayName: null,
        prizeImageUrl: "https://project.supabase.co/storage/v1/object/public/prize-images/edition-1?v=1",
      },
    ]);
  });
});

describe("createEdition", () => {
  it("inserts a new open edition", async () => {
    const single = vi.fn(async () => ({ data: { id: "edition-2" }, error: null }));
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    const from = vi.fn(() => ({ insert }));

    const result = await createEdition(
      { month: 9, year: 2026, numberCap: 500, prizeTitle: "TV 55", drawDateIso: "2026-09-30T21:00:00Z" },
      { from } as never,
    );

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        month: 9,
        year: 2026,
        status: "open",
        number_cap: 500,
        prize_title: "TV 55",
        draw_date: "2026-09-30T21:00:00Z",
      }),
    );
    expect(result).toEqual({ success: true, editionId: "edition-2" });
  });

  it("returns a friendly error when another edition is already open (unique violation)", async () => {
    const single = vi.fn(async () => ({ data: null, error: { code: "23505", message: "duplicate" } }));
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    const from = vi.fn(() => ({ insert }));

    const result = await createEdition(
      { month: 9, year: 2026, numberCap: 500, prizeTitle: "TV 55", drawDateIso: "2026-09-30T21:00:00Z" },
      { from } as never,
    );

    expect(result).toEqual({
      success: false,
      error: expect.stringMatching(/ya hay una edición abierta/i),
    });
  });
});

describe("closeEdition", () => {
  it("closes an open edition", async () => {
    const maybeSingle = vi.fn(async () => ({ data: { id: "edition-1" }, error: null }));
    const select = vi.fn(() => ({ maybeSingle }));
    const eqStatus = vi.fn(() => ({ select }));
    const eqId = vi.fn(() => ({ eq: eqStatus }));
    const update = vi.fn(() => ({ eq: eqId }));
    const from = vi.fn(() => ({ update }));

    const result = await closeEdition("edition-1", { from } as never);

    expect(update).toHaveBeenCalledWith({ status: "closed" });
    expect(result).toEqual({ applied: true });
  });

  it("is a no-op when the edition is not currently open", async () => {
    const maybeSingle = vi.fn(async () => ({ data: null, error: null }));
    const select = vi.fn(() => ({ maybeSingle }));
    const eqStatus = vi.fn(() => ({ select }));
    const eqId = vi.fn(() => ({ eq: eqStatus }));
    const update = vi.fn(() => ({ eq: eqId }));
    const from = vi.fn(() => ({ update }));

    const result = await closeEdition("edition-1", { from } as never);

    expect(result).toEqual({ applied: false });
  });
});
