import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CheckoutForm } from "./CheckoutForm";
import type { CheckoutFormState } from "@/lib/checkout/types";

describe("CheckoutForm", () => {
  it("renders every buyer field and both payment methods", () => {
    render(<CheckoutForm action={vi.fn()} tierName="Inicial" />);

    expect(screen.getByLabelText(/nombre y apellido/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dni/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tel[eé]fono/i)).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /mercado pago/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /transferencia/i }),
    ).toBeInTheDocument();
  });

  it("blocks submission and shows accessible errors when fields are invalid, without calling the action", async () => {
    const action = vi.fn();
    const user = userEvent.setup();
    render(<CheckoutForm action={action} tierName="Inicial" />);

    await user.click(screen.getByRole("button", { name: /confirmar compra/i }));

    const nameInput = screen.getByLabelText(/nombre y apellido/i);
    expect(nameInput).toHaveAttribute("aria-invalid", "true");
    const errors = await screen.findAllByRole("alert");
    expect(errors.length).toBeGreaterThan(0);
    expect(action).not.toHaveBeenCalled();
  });

  it("submits when all fields are valid", async () => {
    const action = vi.fn().mockResolvedValue({ status: "idle" });
    const user = userEvent.setup();
    render(<CheckoutForm action={action} tierName="Inicial" />);

    await user.type(
      screen.getByLabelText(/nombre y apellido/i),
      "Martín García",
    );
    await user.type(screen.getByLabelText(/^email$/i), "martin@example.com");
    await user.type(screen.getByLabelText(/dni/i), "30123456");
    await user.type(screen.getByLabelText(/tel[eé]fono/i), "+5491123456789");
    await user.click(screen.getByRole("radio", { name: /transferencia/i }));
    await user.click(screen.getByRole("button", { name: /confirmar compra/i }));

    expect(action).toHaveBeenCalled();
  });

  it("surfaces a server-side error returned by the action", () => {
    const errorState: CheckoutFormState = {
      status: "error",
      formError: "No hay una edición activa en este momento.",
    };
    render(
      <CheckoutForm
        action={vi.fn().mockResolvedValue(errorState)}
        tierName="Inicial"
        initialStateOverride={errorState}
      />,
    );

    expect(
      screen.getByText("No hay una edición activa en este momento."),
    ).toBeInTheDocument();
  });
});
