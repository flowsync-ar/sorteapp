import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));
vi.mock("@/lib/receipts/review", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/receipts/review")>();
  return {
    ...actual,
    reviewReceipt: vi.fn(),
  };
});

import { createClient } from "@/lib/supabase/server";
import { reviewReceipt, ReceiptReviewError } from "@/lib/receipts/review";
import { POST } from "./route";

function requestWithBody(body: unknown) {
  return new NextRequest("https://sorteapp.example.com/api/admin/receipts/receipt-1/review", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function mockSession(user: { id: string; role?: string } | null) {
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn(async () =>
        user
          ? { data: { user: { id: user.id, app_metadata: { role: user.role } } }, error: null }
          : { data: { user: null }, error: null },
      ),
    },
  } as never);
}

const params = Promise.resolve({ receiptId: "receipt-1" });

describe("POST /api/admin/receipts/[receiptId]/review", () => {
  afterEach(() => {
    vi.mocked(reviewReceipt).mockReset();
  });

  it("returns 401 when there is no authenticated session", async () => {
    mockSession(null);

    const response = await POST(requestWithBody({ decision: "verified" }), { params });

    expect(response.status).toBe(401);
    expect(reviewReceipt).not.toHaveBeenCalled();
  });

  it("returns 403 when the authenticated user is not an admin", async () => {
    mockSession({ id: "user-1", role: "authenticated" });

    const response = await POST(requestWithBody({ decision: "verified" }), { params });

    expect(response.status).toBe(403);
    expect(reviewReceipt).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid decision value", async () => {
    mockSession({ id: "admin-1", role: "admin" });

    const response = await POST(requestWithBody({ decision: "maybe" }), { params });

    expect(response.status).toBe(400);
    expect(reviewReceipt).not.toHaveBeenCalled();
  });

  it("calls reviewReceipt with the admin's id and returns 200 on success", async () => {
    mockSession({ id: "admin-1", role: "admin" });
    vi.mocked(reviewReceipt).mockResolvedValue({
      applied: true,
      receiptId: "receipt-1",
      orderId: "order-1",
      decision: "verified",
    });

    const response = await POST(requestWithBody({ decision: "verified" }), { params });

    expect(response.status).toBe(200);
    expect(reviewReceipt).toHaveBeenCalledWith("receipt-1", "verified", {
      reviewedBy: "admin-1",
      reason: undefined,
    });
  });

  it("forwards the rejection reason", async () => {
    mockSession({ id: "admin-1", role: "admin" });
    vi.mocked(reviewReceipt).mockResolvedValue({
      applied: true,
      receiptId: "receipt-1",
      orderId: "order-1",
      decision: "rejected",
    });

    await POST(requestWithBody({ decision: "rejected", reason: "Monto no coincide" }), { params });

    expect(reviewReceipt).toHaveBeenCalledWith("receipt-1", "rejected", {
      reviewedBy: "admin-1",
      reason: "Monto no coincide",
    });
  });

  it("returns 500 when reviewReceipt throws a processing error", async () => {
    mockSession({ id: "admin-1", role: "admin" });
    vi.mocked(reviewReceipt).mockRejectedValue(new ReceiptReviewError("boom"));

    const response = await POST(requestWithBody({ decision: "verified" }), { params });

    expect(response.status).toBe(500);
  });
});
