import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrdersList } from "./OrdersList";
import type { MemberOrderView } from "@/lib/member/access";

describe("OrdersList", () => {
  it("shows an empty-state message when there are no orders", () => {
    render(<OrdersList orders={[]} />);
    expect(screen.getByText(/todavía no tenés compras/i)).toBeInTheDocument();
  });

  it("lists each order's chances, status and assigned numbers", () => {
    const orders: MemberOrderView[] = [
      {
        id: "order-1",
        chances: 6,
        status: "approved",
        method: "mp",
        amountArs: 60000,
        numbers: [4821, 990001],
      },
      {
        id: "order-2",
        chances: 1,
        status: "pending",
        method: "transfer",
        amountArs: 13500,
        numbers: [],
      },
    ];

    render(<OrdersList orders={orders} />);

    expect(screen.getByText("6 chances")).toBeInTheDocument();
    expect(screen.getByText("004821")).toBeInTheDocument();
    expect(screen.getByText("990001")).toBeInTheDocument();
    expect(screen.getByText("1 chance")).toBeInTheDocument();
    expect(screen.getByText(/pendiente/i)).toBeInTheDocument();
  });
});
