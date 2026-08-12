import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WinnerForm } from "./WinnerForm";

describe("WinnerForm", () => {
  it("renders the winner number input and submit button", () => {
    render(<WinnerForm action={vi.fn()} />);
    expect(screen.getByLabelText(/número ganador/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /publicar ganador/i })).toBeInTheDocument();
  });

  it("submits the form", async () => {
    const action = vi.fn().mockResolvedValue({ status: "success" });
    const user = userEvent.setup();
    render(<WinnerForm action={action} />);

    await user.type(screen.getByLabelText(/número ganador/i), "555555");
    await user.click(screen.getByRole("button", { name: /publicar ganador/i }));

    expect(action).toHaveBeenCalled();
  });

  it("surfaces a server-side error", () => {
    const errorState = { status: "error" as const, formError: "Ese número no fue asignado." };
    render(
      <WinnerForm action={vi.fn().mockResolvedValue(errorState)} initialStateOverride={errorState} />,
    );
    expect(screen.getByText("Ese número no fue asignado.")).toBeInTheDocument();
  });
});
