import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

import { ReceiptQueue } from "./ReceiptQueue";

beforeEach(() => {
  refresh.mockClear();
});

const receipts = [
  {
    id: "receipt-1",
    orderId: "order-1",
    storagePath: "order-1/file.png",
    uploadedAt: "2026-08-01T00:00:00Z",
    buyerName: "Ana Test",
    buyerEmail: "ana@example.com",
    tierKey: "plus",
    amountArs: 35000,
    signedUrl: "https://signed.example.com/file.png",
  },
];

describe("ReceiptQueue", () => {
  it("renders an empty state when there are no pending receipts", () => {
    render(<ReceiptQueue receipts={[]} onReview={vi.fn()} />);
    expect(screen.getByText(/no hay comprobantes pendientes/i)).toBeInTheDocument();
  });

  it("renders each receipt with buyer info and a link to view the file", () => {
    render(<ReceiptQueue receipts={receipts} onReview={vi.fn()} />);

    expect(screen.getByText("Ana Test")).toBeInTheDocument();
    expect(screen.getByText(/plus/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ver comprobante/i })).toHaveAttribute(
      "href",
      "https://signed.example.com/file.png",
    );
  });

  it("verifies a receipt and refreshes the router on success", async () => {
    const onReview = vi.fn().mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<ReceiptQueue receipts={receipts} onReview={onReview} />);

    await user.click(screen.getByRole("button", { name: /^verificar$/i }));

    expect(onReview).toHaveBeenCalledWith("receipt-1", "verified", undefined);
    expect(refresh).toHaveBeenCalled();
  });

  it("rejects a receipt with a reason and refreshes on success", async () => {
    const onReview = vi.fn().mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<ReceiptQueue receipts={receipts} onReview={onReview} />);

    await user.click(screen.getByRole("button", { name: /rechazar/i }));
    await user.type(screen.getByLabelText(/motivo/i), "Monto no coincide");
    await user.click(screen.getByRole("button", { name: /confirmar rechazo/i }));

    expect(onReview).toHaveBeenCalledWith("receipt-1", "rejected", "Monto no coincide");
  });

  it("shows an accessible error when the review call fails", async () => {
    const onReview = vi.fn().mockResolvedValue({ ok: false, error: "processing failed" });
    const user = userEvent.setup();
    render(<ReceiptQueue receipts={receipts} onReview={onReview} />);

    await user.click(screen.getByRole("button", { name: /^verificar$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/processing failed/i);
    expect(refresh).not.toHaveBeenCalled();
  });
});
