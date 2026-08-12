import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateEditionForm } from "./CreateEditionForm";
import type { CreateEditionFormState } from "@/lib/admin/types";

describe("CreateEditionForm", () => {
  it("renders every field", () => {
    render(<CreateEditionForm action={vi.fn()} />);

    expect(screen.getByLabelText(/mes/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/año/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cupo de números/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^premio$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fecha de sorteo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/foto del premio/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /crear edición/i })).toBeInTheDocument();
  });

  it("submits the form data to the action", async () => {
    const action = vi.fn().mockResolvedValue({ status: "success" });
    const user = userEvent.setup();
    render(<CreateEditionForm action={action} />);

    await user.type(screen.getByLabelText(/mes/i), "9");
    await user.type(screen.getByLabelText(/año/i), "2026");
    await user.type(screen.getByLabelText(/cupo de números/i), "500");
    await user.type(screen.getByLabelText(/^premio$/i), "TV 55");
    await user.click(screen.getByRole("button", { name: /crear edición/i }));

    expect(action).toHaveBeenCalled();
  });

  it("surfaces a server-side error", () => {
    const errorState: CreateEditionFormState = {
      status: "error",
      formError: "Ya hay una edición abierta.",
    };
    render(
      <CreateEditionForm
        action={vi.fn().mockResolvedValue(errorState)}
        initialStateOverride={errorState}
      />,
    );

    expect(screen.getByText("Ya hay una edición abierta.")).toBeInTheDocument();
  });

  it("surfaces a non-fatal prize-image upload warning after a successful create", () => {
    const successState: CreateEditionFormState = {
      status: "success",
      warning: "No pudimos subir la imagen del premio.",
    };
    render(
      <CreateEditionForm
        action={vi.fn().mockResolvedValue(successState)}
        initialStateOverride={successState}
      />,
    );

    expect(screen.getByText("No pudimos subir la imagen del premio.")).toBeInTheDocument();
  });
});
