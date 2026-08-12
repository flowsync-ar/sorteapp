import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./LoginForm";
import type { LoginFormState } from "@/lib/member/types";

describe("LoginForm", () => {
  it("renders email and password fields", () => {
    render(<LoginForm action={vi.fn()} />);

    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
  });

  it("submits when both fields are filled", async () => {
    const action = vi.fn().mockResolvedValue({ status: "idle" });
    const user = userEvent.setup();
    render(<LoginForm action={action} />);

    await user.type(screen.getByLabelText(/^email$/i), "buyer@example.com");
    await user.type(screen.getByLabelText(/contraseña/i), "secret123");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    expect(action).toHaveBeenCalled();
  });

  it("surfaces a server-side error returned by the action", () => {
    const errorState: LoginFormState = {
      status: "error",
      formError: "Email o contraseña incorrectos.",
    };
    render(
      <LoginForm
        action={vi.fn().mockResolvedValue(errorState)}
        initialStateOverride={errorState}
      />,
    );

    expect(
      screen.getByText("Email o contraseña incorrectos."),
    ).toBeInTheDocument();
  });
});
