import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderPlaceholder } from "./OrderPlaceholder";

const order = { id: "order-1", chances: 1, amount_ars: 15000, status: "approved" };

describe("OrderPlaceholder", () => {
  it("renders the order summary", () => {
    render(<OrderPlaceholder order={order} title="¡Pago aprobado!" noticeText="ok" />);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders extra children below the summary when provided (tasks.md PR8, member-area CTA)", () => {
    render(
      <OrderPlaceholder order={order} title="¡Pago aprobado!" noticeText="ok">
        <a href="/mi-cuenta">Ver mi curso</a>
      </OrderPlaceholder>,
    );
    expect(screen.getByRole("link", { name: /ver mi curso/i })).toHaveAttribute(
      "href",
      "/mi-cuenta",
    );
  });
});
