import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClaimAccountForm } from "./ClaimAccountForm";
import type { ClaimAccountFormState } from "@/lib/member/types";

describe("ClaimAccountForm", () => {
  it("renders email, password and confirm-password fields", () => {
    render(<ClaimAccountForm action={vi.fn()} />);

    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^contraseña$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/repetir contraseña/i)).toBeInTheDocument();
  });

  it("blocks submission and shows accessible errors on mismatched passwords, without calling the action", async () => {
    const action = vi.fn();
    const user = userEvent.setup();
    render(<ClaimAccountForm action={action} />);

    await user.type(screen.getByLabelText(/^email$/i), "buyer@example.com");
    await user.type(screen.getByLabelText(/^contraseña$/i), "secret123");
    await user.type(screen.getByLabelText(/repetir contraseña/i), "different1");
    await user.click(screen.getByRole("button", { name: /guardar/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/no coinciden/i);
    expect(action).not.toHaveBeenCalled();
  });

  it("submits when all fields are valid", async () => {
    const action = vi.fn().mockResolvedValue({ status: "success" });
    const user = userEvent.setup();
    render(<ClaimAccountForm action={action} />);

    await user.type(screen.getByLabelText(/^email$/i), "buyer@example.com");
    await user.type(screen.getByLabelText(/^contraseña$/i), "secret123");
    await user.type(screen.getByLabelText(/repetir contraseña/i), "secret123");
    await user.click(screen.getByRole("button", { name: /guardar/i }));

    expect(action).toHaveBeenCalled();
  });

  it("shows a confirmation message on success", () => {
    const successState: ClaimAccountFormState = { status: "success" };
    render(
      <ClaimAccountForm
        action={vi.fn().mockResolvedValue(successState)}
        initialStateOverride={successState}
      />,
    );

    expect(screen.getByText(/cuenta reclamada/i)).toBeInTheDocument();
  });

  it("surfaces a server-side error returned by the action", () => {
    const errorState: ClaimAccountFormState = {
      status: "error",
      formError: "Ese email ya está registrado.",
    };
    render(
      <ClaimAccountForm
        action={vi.fn().mockResolvedValue(errorState)}
        initialStateOverride={errorState}
      />,
    );

    expect(screen.getByText("Ese email ya está registrado.")).toBeInTheDocument();
  });
});
